// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IVaultEvents.sol";
import "./GrandWardenVault.sol";
import "./WalletVault.sol";
import "./DeviceRegistry.sol";
import "./AtomicVaultManager.sol";
import "./RecoveryManager.sol";

/**
 * @title MirrorInbox
 * @dev ROFL entry point for mirroring Sui events to Sapphire with attestation/allowlist,
 * idempotency, ordering, and dispatch to domain contracts
 * 
 * This contract serves as the critical data bridge that accepts events from the ROFL worker
 * and dispatches them to appropriate Grand Warden contracts while ensuring security,
 * idempotency, and proper ordering.
 */
contract MirrorInbox is IVaultEvents, ReentrancyGuard {
    using Sapphire for *;

    // Event types for dispatching to domain contracts
    enum EventType {
        VaultCreated,           // 0
        DeviceRegistered,       // 1
        DeviceStatusChanged,    // 2
        VaultPointerCreated,    // 3
        VaultPointerSet,        // 4
        BlobACLUpdated,         // 5
        RecoveryInitiated,      // 6
        RecoveryApproved,       // 7
        RecoveryCompleted,      // 8
        WalletImported,         // 9
        TransactionSigned,      // 10
        AtomicUpdateStarted,    // 11
        AtomicUpdateCompleted,  // 12
        AtomicUpdateFailed      // 13
    }

    // Mirrored event payload structure with versioning
    struct MirrorPayload {
        uint256 version;        // Payload version for future evolution
        address user;           // User address
        bytes data;            // Event-specific data (ABI-encoded)
        uint256 timestamp;     // Original event timestamp
        bytes32 sourceChain;   // Source chain identifier (e.g., "sui")
        bytes32 sourceTxHash;  // Original transaction hash
    }

    // Attestation verification result
    struct AttestationResult {
        bool isValid;
        address signer;
        uint256 verifiedAt;
    }

    // Storage for idempotency and ordering
    mapping(bytes32 => bool) private processedEvents;           // eventId => processed
    mapping(address => uint64) private lastSequenceByUser;     // user => last seq
    mapping(address => bool) private allowedSenders;           // ROFL worker allowlist
    
    // Contract references
    GrandWardenVault public grandWardenVault;
    WalletVault public walletVault;
    DeviceRegistry public deviceRegistry;
    AtomicVaultManager public atomicVaultManager;
    RecoveryManager public recoveryManager;
    
    // Access control
    address public owner;
    address public roflWorker;
    bool public isPaused;
    
    // Configuration
    uint256 public maxSequenceGap = 100;        // Maximum allowed sequence gap
    uint256 public attestationExpiry = 3600;    // 1 hour attestation validity
    
    // Events
    event EventMirrored(
        bytes32 indexed eventId,
        address indexed user,
        EventType indexed eventType,
        uint64 sequence,
        uint256 timestamp
    );
    
    event SenderAllowed(address indexed sender, bool allowed);
    event ROFLWorkerUpdated(address indexed oldWorker, address indexed newWorker);
    event ContractUpdated(string indexed contractName, address indexed contractAddress);
    event MirrorError(
        bytes32 indexed eventId,
        address indexed user,
        string reason,
        uint256 timestamp
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "MirrorInbox: not owner");
        _;
    }

    modifier onlyAllowedSender() {
        require(allowedSenders[msg.sender] || msg.sender == roflWorker, "MirrorInbox: not allowed");
        _;
    }

    modifier whenNotPaused() {
        require(!isPaused, "MirrorInbox: paused");
        _;
    }

    modifier validPayload(MirrorPayload memory payload) {
        require(payload.version > 0, "MirrorInbox: invalid payload version");
        require(payload.user != address(0), "MirrorInbox: invalid user address");
        require(payload.data.length > 0, "MirrorInbox: empty payload data");
        _;
    }

    /**
     * @dev Constructor initializes the MirrorInbox with contract references
     */
    constructor(
        address _grandWardenVault,
        address _walletVault,
        address _deviceRegistry,
        address _atomicVaultManager,
        address _recoveryManager
    ) {
        owner = msg.sender;
        
        grandWardenVault = GrandWardenVault(_grandWardenVault);
        walletVault = WalletVault(_walletVault);
        deviceRegistry = DeviceRegistry(_deviceRegistry);
        atomicVaultManager = AtomicVaultManager(_atomicVaultManager);
        recoveryManager = RecoveryManager(_recoveryManager);
        
        emit ContractUpdated("GrandWardenVault", _grandWardenVault);
        emit ContractUpdated("WalletVault", _walletVault);
        emit ContractUpdated("DeviceRegistry", _deviceRegistry);
        emit ContractUpdated("AtomicVaultManager", _atomicVaultManager);
        emit ContractUpdated("RecoveryManager", _recoveryManager);
    }

    /**
     * @dev Main entry point for ROFL workers to mirror Sui events to Sapphire
     * Enforces allowlist/attestation, idempotency, and ordering
     * 
     * @param eventType The type of event being mirrored
     * @param payload The event payload with versioning
     * @param eventId Unique identifier for idempotency (hash of source tx + log index)
     * @param sequence Monotonic sequence number per user for ordering
     * @param attestation Optional attestation data for verification
     */
    function mirrorEvent(
        EventType eventType,
        MirrorPayload memory payload,
        bytes32 eventId,
        uint64 sequence,
        bytes calldata attestation
    ) 
        external 
        nonReentrant 
        onlyAllowedSender 
        whenNotPaused 
        validPayload(payload) 
    {
        // 1. Verify event hasn't been processed (idempotency)
        require(!processedEvents[eventId], "MirrorInbox: event already processed");
        
        // 2. Verify sequence ordering
        uint64 lastSeq = lastSequenceByUser[payload.user];
        require(sequence > lastSeq, "MirrorInbox: sequence not monotonic");
        require(sequence <= lastSeq + maxSequenceGap, "MirrorInbox: sequence gap too large");
        
        // 3. Verify attestation if provided
        if (attestation.length > 0) {
            AttestationResult memory attestResult = _verifyAttestation(attestation, payload);
            require(attestResult.isValid, "MirrorInbox: invalid attestation");
        }
        
        // 4. Mark event as processed and update sequence
        processedEvents[eventId] = true;
        lastSequenceByUser[payload.user] = sequence;
        
        // 5. Dispatch to appropriate domain contract
        bool success = _dispatchEvent(eventType, payload);
        
        if (success) {
            emit EventMirrored(eventId, payload.user, eventType, sequence, block.timestamp);
        } else {
            emit MirrorError(eventId, payload.user, "dispatch failed", block.timestamp);
            // Note: We don't revert here to avoid blocking the ROFL worker
            // Instead, we emit an error event for monitoring
        }
    }

    /**
     * @dev Dispatch mirrored event to appropriate domain contract
     * @param eventType The type of event to dispatch
     * @param payload The event payload
     * @return success Whether the dispatch was successful
     */
    function _dispatchEvent(EventType eventType, MirrorPayload memory payload) 
        internal 
        returns (bool success) 
    {
        try this._safeDispatch(eventType, payload) {
            return true;
        } catch Error(string memory reason) {
            emit MirrorError(
                keccak256(abi.encode(payload.sourceTxHash, payload.timestamp)),
                payload.user,
                reason,
                block.timestamp
            );
            return false;
        } catch {
            emit MirrorError(
                keccak256(abi.encode(payload.sourceTxHash, payload.timestamp)),
                payload.user,
                "unknown dispatch error",
                block.timestamp
            );
            return false;
        }
    }

    /**
     * @dev Safe dispatch wrapper that can be caught for error handling
     * @param eventType The type of event to dispatch
     * @param payload The event payload
     */
    function _safeDispatch(EventType eventType, MirrorPayload memory payload) external {
        require(msg.sender == address(this), "MirrorInbox: internal only");
        
        if (eventType == EventType.VaultCreated) {
            _dispatchVaultCreated(payload);
        } else if (eventType == EventType.DeviceRegistered) {
            _dispatchDeviceRegistered(payload);
        } else if (eventType == EventType.DeviceStatusChanged) {
            _dispatchDeviceStatusChanged(payload);
        } else if (eventType == EventType.VaultPointerCreated) {
            _dispatchVaultPointerCreated(payload);
        } else if (eventType == EventType.VaultPointerSet) {
            _dispatchVaultPointerSet(payload);
        } else if (eventType == EventType.BlobACLUpdated) {
            _dispatchBlobACLUpdated(payload);
        } else if (eventType == EventType.RecoveryInitiated) {
            _dispatchRecoveryInitiated(payload);
        } else if (eventType == EventType.RecoveryApproved) {
            _dispatchRecoveryApproved(payload);
        } else if (eventType == EventType.RecoveryCompleted) {
            _dispatchRecoveryCompleted(payload);
        } else if (eventType == EventType.WalletImported) {
            _dispatchWalletImported(payload);
        } else if (eventType == EventType.TransactionSigned) {
            _dispatchTransactionSigned(payload);
        } else if (eventType == EventType.AtomicUpdateStarted) {
            _dispatchAtomicUpdateStarted(payload);
        } else if (eventType == EventType.AtomicUpdateCompleted) {
            _dispatchAtomicUpdateCompleted(payload);
        } else if (eventType == EventType.AtomicUpdateFailed) {
            _dispatchAtomicUpdateFailed(payload);
        } else {
            revert("MirrorInbox: unknown event type");
        }
    }

    /**
     * @dev Verify attestation data from ROFL worker
     * @param attestation The attestation data to verify
     * @param payload The payload being attested
     * @return result Attestation verification result
     */
    function _verifyAttestation(bytes calldata attestation, MirrorPayload memory payload)
        internal
        view
        returns (AttestationResult memory result)
    {
        // For now, implement basic signature verification
        // In production, this would verify SGX attestation or TEE proof
        if (attestation.length < 65) {
            return AttestationResult(false, address(0), 0);
        }
        
        // Extract signature components (r, s, v)
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := calldataload(add(attestation.offset, 0))
            s := calldataload(add(attestation.offset, 32))
            v := byte(0, calldataload(add(attestation.offset, 64)))
        }
        
        // Create message hash
        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(payload.user, payload.data, payload.timestamp))
        ));
        
        // Recover signer
        address signer = ecrecover(messageHash, v, r, s);
        
        if (signer == address(0)) {
            return AttestationResult(false, address(0), 0);
        }
        
        // Check if signer is allowed and attestation is not expired
        bool isValid = allowedSenders[signer] && block.timestamp <= payload.timestamp + attestationExpiry;
        
        return AttestationResult(isValid, signer, block.timestamp);
    }

    // Dispatch functions for each event type
    function _dispatchVaultCreated(MirrorPayload memory payload) internal {
        (bytes32 vaultId, uint256 timestamp) = abi.decode(payload.data, (bytes32, uint256));
        emit VaultCreated(payload.user, vaultId, timestamp);
    }

    function _dispatchDeviceRegistered(MirrorPayload memory payload) internal {
        (bytes32 deviceId, string memory deviceName, uint256 timestamp) = 
            abi.decode(payload.data, (bytes32, string, uint256));
        emit DeviceRegistered(payload.user, deviceId, deviceName, timestamp);
    }

    function _dispatchDeviceStatusChanged(MirrorPayload memory payload) internal {
        (bytes32 deviceId, uint8 newStatus, uint256 timestamp, string memory reason) = 
            abi.decode(payload.data, (bytes32, uint8, uint256, string));
        // Note: This would ideally update the DeviceRegistry contract state as well
        emit DeviceStatusChanged(payload.user, deviceId, newStatus, timestamp, reason);
    }

    function _dispatchVaultPointerCreated(MirrorPayload memory payload) internal {
        (bytes32 vaultId, string memory walrusCid, bytes32 metadataHash, uint256 timestamp) = 
            abi.decode(payload.data, (bytes32, string, bytes32, uint256));
        emit VaultPointerCreated(payload.user, vaultId, walrusCid, metadataHash, timestamp);
    }

    function _dispatchVaultPointerSet(MirrorPayload memory payload) internal {
        (bytes32 vaultId, string memory walrusCid, bytes32 metadataHash, string memory stage, uint256 timestamp) = 
            abi.decode(payload.data, (bytes32, string, bytes32, string, uint256));
        emit VaultPointerSet(payload.user, vaultId, walrusCid, metadataHash, stage, timestamp);
    }

    function _dispatchBlobACLUpdated(MirrorPayload memory payload) internal {
        (string memory blobId, uint8 policy, address[] memory authorizedDevices, uint256 timestamp) = 
            abi.decode(payload.data, (string, uint8, address[], uint256));
        emit BlobACLUpdated(payload.user, blobId, policy, authorizedDevices, timestamp);
    }

    function _dispatchRecoveryInitiated(MirrorPayload memory payload) internal {
        (bytes32 recoveryId, uint8 method, uint256 threshold, uint256 timestamp) = 
            abi.decode(payload.data, (bytes32, uint8, uint256, uint256));
        emit RecoveryInitiated(payload.user, recoveryId, method, threshold, timestamp);
    }

    function _dispatchRecoveryApproved(MirrorPayload memory payload) internal {
        (bytes32 recoveryId, address guardian, uint256 timestamp) = 
            abi.decode(payload.data, (bytes32, address, uint256));
        emit RecoveryApproved(payload.user, recoveryId, guardian, timestamp);
    }

    function _dispatchRecoveryCompleted(MirrorPayload memory payload) internal {
        (bytes32 recoveryId, bool success, uint256 timestamp) = 
            abi.decode(payload.data, (bytes32, bool, uint256));
        emit RecoveryCompleted(payload.user, recoveryId, success, timestamp);
    }

    function _dispatchWalletImported(MirrorPayload memory payload) internal {
        (bytes32 walletId, string memory walletName, uint256 timestamp) = 
            abi.decode(payload.data, (bytes32, string, uint256));
        emit WalletImported(payload.user, walletId, walletName, timestamp);
    }

    function _dispatchTransactionSigned(MirrorPayload memory payload) internal {
        (bytes32 walletId, bytes32 txHash, uint8 chainType, uint256 timestamp) = 
            abi.decode(payload.data, (bytes32, bytes32, uint8, uint256));
        emit TransactionSigned(payload.user, walletId, txHash, chainType, timestamp);
    }

    function _dispatchAtomicUpdateStarted(MirrorPayload memory payload) internal {
        (bytes32 vaultId, string memory walrusCid, uint256 timestamp) = 
            abi.decode(payload.data, (bytes32, string, uint256));
        emit AtomicUpdateStarted(payload.user, vaultId, walrusCid, timestamp);
    }

    function _dispatchAtomicUpdateCompleted(MirrorPayload memory payload) internal {
        (bytes32 vaultId, bytes32 suiTxHash, uint256 timestamp) = 
            abi.decode(payload.data, (bytes32, bytes32, uint256));
        emit AtomicUpdateCompleted(payload.user, vaultId, suiTxHash, timestamp);
    }

    function _dispatchAtomicUpdateFailed(MirrorPayload memory payload) internal {
        (bytes32 vaultId, string memory reason, uint256 timestamp) = 
            abi.decode(payload.data, (bytes32, string, uint256));
        emit AtomicUpdateFailed(payload.user, vaultId, reason, timestamp);
    }

    // Admin functions
    
    /**
     * @dev Set allowed sender for ROFL worker
     * @param sender Address to allow/disallow
     * @param allowed Whether the sender is allowed
     */
    function setAllowedSender(address sender, bool allowed) external onlyOwner {
        require(sender != address(0), "MirrorInbox: invalid sender");
        allowedSenders[sender] = allowed;
        emit SenderAllowed(sender, allowed);
    }

    /**
     * @dev Set the primary ROFL worker address
     * @param _roflWorker Address of the ROFL worker
     */
    function setROFLWorker(address _roflWorker) external onlyOwner {
        require(_roflWorker != address(0), "MirrorInbox: invalid ROFL worker");
        address oldWorker = roflWorker;
        roflWorker = _roflWorker;
        allowedSenders[_roflWorker] = true;
        emit ROFLWorkerUpdated(oldWorker, _roflWorker);
        emit SenderAllowed(_roflWorker, true);
    }

    /**
     * @dev Update contract addresses
     */
    function updateContractAddresses(
        address _grandWardenVault,
        address _walletVault,
        address _deviceRegistry,
        address _atomicVaultManager,
        address _recoveryManager
    ) external onlyOwner {
        if (_grandWardenVault != address(0)) {
            grandWardenVault = GrandWardenVault(_grandWardenVault);
            emit ContractUpdated("GrandWardenVault", _grandWardenVault);
        }
        if (_walletVault != address(0)) {
            walletVault = WalletVault(_walletVault);
            emit ContractUpdated("WalletVault", _walletVault);
        }
        if (_deviceRegistry != address(0)) {
            deviceRegistry = DeviceRegistry(_deviceRegistry);
            emit ContractUpdated("DeviceRegistry", _deviceRegistry);
        }
        if (_atomicVaultManager != address(0)) {
            atomicVaultManager = AtomicVaultManager(_atomicVaultManager);
            emit ContractUpdated("AtomicVaultManager", _atomicVaultManager);
        }
        if (_recoveryManager != address(0)) {
            recoveryManager = RecoveryManager(_recoveryManager);
            emit ContractUpdated("RecoveryManager", _recoveryManager);
        }
    }

    /**
     * @dev Emergency pause/unpause
     * @param _paused Whether to pause the contract
     */
    function setPaused(bool _paused) external onlyOwner {
        isPaused = _paused;
    }

    /**
     * @dev Update configuration
     */
    function updateConfig(uint256 _maxSequenceGap, uint256 _attestationExpiry) external onlyOwner {
        require(_maxSequenceGap > 0 && _maxSequenceGap <= 1000, "MirrorInbox: invalid sequence gap");
        require(_attestationExpiry > 0 && _attestationExpiry <= 86400, "MirrorInbox: invalid expiry");
        
        maxSequenceGap = _maxSequenceGap;
        attestationExpiry = _attestationExpiry;
    }

    /**
     * @dev Transfer ownership
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "MirrorInbox: invalid new owner");
        owner = newOwner;
    }

    // View functions
    
    /**
     * @dev Check if an event has been processed
     * @param eventId The event ID to check
     * @return Whether the event has been processed
     */
    function isEventProcessed(bytes32 eventId) external view returns (bool) {
        return processedEvents[eventId];
    }

    /**
     * @dev Get last sequence number for a user
     * @param user The user address
     * @return The last sequence number
     */
    function getLastSequence(address user) external view returns (uint64) {
        return lastSequenceByUser[user];
    }

    /**
     * @dev Check if a sender is allowed
     * @param sender The sender address
     * @return Whether the sender is allowed
     */
    function isAllowedSender(address sender) external view returns (bool) {
        return allowedSenders[sender] || sender == roflWorker;
    }

    /**
     * @dev Get contract configuration
     * @return maxGap Maximum sequence gap allowed
     * @return expiry Attestation expiry time
     * @return paused Whether the contract is paused
     */
    function getConfig() external view returns (uint256 maxGap, uint256 expiry, bool paused) {
        return (maxSequenceGap, attestationExpiry, isPaused);
    }

    /**
     * @dev Get all contract addresses
     */
    function getContractAddresses() external view returns (
        address _grandWardenVault,
        address _walletVault,
        address _deviceRegistry,
        address _atomicVaultManager,
        address _recoveryManager
    ) {
        return (
            address(grandWardenVault),
            address(walletVault),
            address(deviceRegistry),
            address(atomicVaultManager),
            address(recoveryManager)
        );
    }

    // Implement IVaultEvents functions
    
    /**
     * @dev Emit a generic vault event for flexibility
     * @param user The user address
     * @param eventType The event type identifier
     * @param data Additional event data
     */
    function emitVaultEvent(address user, uint8 eventType, bytes calldata data) external onlyAllowedSender {
        // This is a generic event emitter for custom events
        // Can be used by ROFL for custom event types not covered by the standard events
        emit VaultEvent(user, eventType, data, block.timestamp);
    }
    
    /**
     * @dev Emit user flow tracking events
     * @param user The user address
     * @param flowType The flow type (1=wallet import, 2=password save, etc.)
     * @param step The current step in the flow
     * @param success Whether the step was successful
     * @param data Additional flow data
     */
    function emitUserFlowEvent(
        address user, 
        uint8 flowType, 
        uint8 step, 
        bool success, 
        bytes calldata data
    ) external onlyAllowedSender {
        emit UserFlowEvent(user, flowType, step, success, data, block.timestamp);
    }

    // Additional events for the generic emitters
    event VaultEvent(address indexed user, uint8 eventType, bytes data, uint256 timestamp);
    event UserFlowEvent(address indexed user, uint8 flowType, uint8 step, bool success, bytes data, uint256 timestamp);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title IVaultEvents
 * @dev Interface defining all events for The Graph indexing
 */
interface IVaultEvents {
    // Frozen Event Canon for The Graph indexing
    event VaultCreated(address indexed user, bytes32 indexed vaultId, uint256 timestamp);
    event DeviceRegistered(address indexed user, bytes32 indexed deviceId, string deviceName, uint256 timestamp);
    event BreachAlert(address indexed user, uint256 severity, string message);
    event WalletImported(address indexed user, bytes32 indexed walletId, string name, uint256 timestamp);
    event TransactionSigned(address indexed user, bytes32 indexed walletId, bytes32 txHash, uint8 chainType, uint256 timestamp);
    event VaultBlobUpdated(address indexed user, bytes32 indexed vaultId, string newCID, bytes32 suiTxHash);
    event AtomicUpdateStarted(address indexed user, bytes32 indexed vaultId, string walrusCID, uint256 timestamp);
    event AtomicUpdateCompleted(address indexed user, bytes32 indexed vaultId, bytes32 suiTxHash, uint256 timestamp);
    event AtomicUpdateFailed(address indexed user, bytes32 indexed vaultId, string reason, uint256 timestamp);
    
    // Sui mirrored events (via ROFL)
    event DeviceStatusChanged(address indexed user, bytes32 indexed deviceId, uint8 newStatus, uint256 timestamp, string reason);
    event VaultPointerCreated(address indexed user, bytes32 indexed vaultId, string walrusCid, bytes32 metadataHash, uint256 timestamp);
    event VaultPointerSet(address indexed user, bytes32 indexed vaultId, string walrusCid, bytes32 metadataHash, string stage, uint256 timestamp);
    event BlobACLUpdated(address indexed user, string blobId, uint8 policy, address[] authorizedDevices, uint256 timestamp);
    event RecoveryInitiated(address indexed user, bytes32 indexed recoveryId, uint8 method, uint256 threshold, uint256 timestamp);
    event RecoveryApproved(address indexed user, bytes32 indexed recoveryId, address guardian, uint256 timestamp);
    event RecoveryCompleted(address indexed user, bytes32 indexed recoveryId, bool success, uint256 timestamp);
    
    // Additional device and access control events
    event DeviceAuthorized(address indexed user, bytes32 indexed deviceId, address deviceAddress);
    event DeviceRevoked(address indexed user, bytes32 indexed deviceId, uint256 timestamp);
    event AccessGranted(address indexed user, bytes32 indexed resourceId, address grantee);
    event AccessRevoked(address indexed user, bytes32 indexed resourceId, address revokee);
    
    // Security events
    event SecurityAlert(address indexed user, uint8 alertType, string description, uint256 timestamp);
    event UnauthorizedAccess(address indexed user, address unauthorized, string resource);
    
    // Multi-chain events
    event ChainBalanceUpdated(address indexed user, bytes32 indexed walletId, uint8 chainType, uint256 newBalance);
    event CrossChainOperationStarted(address indexed user, bytes32 indexed operationId, uint8 sourceChain, uint8 targetChain);
    event CrossChainOperationCompleted(address indexed user, bytes32 indexed operationId, bool success);
    
    // System health events
    event SystemHealthCheck(uint256 timestamp, bool healthy, string details);
    event EmergencyShutdown(address indexed admin, string reason, uint256 timestamp);
    event SystemRecovery(address indexed admin, uint256 timestamp);
    
    /**
     * @dev Emit a generic vault event for flexibility
     * @param user The user address
     * @param eventType The event type identifier
     * @param data Additional event data
     */
    function emitVaultEvent(address user, uint8 eventType, bytes calldata data) external;
    
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
    ) external;
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title IMirrorInbox
 * @dev Interface for ROFL event mirroring with attestation/allowlist, idempotency, and ordering
 */
interface IMirrorInbox {
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

    /**
     * @dev Main entry point for ROFL workers to mirror Sui events to Sapphire
     * Requirements:
     * - msg.sender must be allowlisted (or verified attested identity)
     * - processed[eventId] == false (idempotency)
     * - seq > lastSeq[user] (monotonic ordering)
     */
    function mirrorEvent(
        EventType eventType,
        MirrorPayload memory payload,
        bytes32 eventId,
        uint64 sequence,
        bytes calldata attestation
    ) external;

    /**
     * @dev Set allowed sender for ROFL worker (onlyOwner)
     */
    function setAllowedSender(address sender, bool allowed) external;

    /**
     * @dev Set the primary ROFL worker address (onlyOwner)
     */
    function setROFLWorker(address roflWorker) external;

    /**
     * @dev Emergency pause/unpause (onlyOwner)
     */
    function setPaused(bool paused) external;

    /**
     * @dev Update configuration (onlyOwner)
     */
    function updateConfig(uint256 maxSequenceGap, uint256 attestationExpiry) external;

    /**
     * @dev Transfer ownership (onlyOwner)
     */
    function transferOwnership(address newOwner) external;

    // View functions
    
    /**
     * @dev Check if an event has been processed
     */
    function isEventProcessed(bytes32 eventId) external view returns (bool);

    /**
     * @dev Get last sequence number for a user
     */
    function getLastSequence(address user) external view returns (uint64);

    /**
     * @dev Check if a sender is allowed
     */
    function isAllowedSender(address sender) external view returns (bool);

    /**
     * @dev Get contract configuration
     */
    function getConfig() external view returns (uint256 maxGap, uint256 expiry, bool paused);
}

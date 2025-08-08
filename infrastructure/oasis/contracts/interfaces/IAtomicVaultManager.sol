// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title IAtomicVaultManager
 * @dev Interface for coordinating atomic operations across Walrus and Sui
 */
interface IAtomicVaultManager {
    // Operation status enumeration
    enum OperationStatus {
        Pending,
        WalrusUploadRequested,
        WalrusUploaded,
        SuiUpdateRequested,
        SuiUpdated,
        Completed,
        Failed,
        RolledBack
    }

    // Atomic operation structure
    struct AtomicOperation {
        bytes32 id;
        address user;
        bytes32 vaultId;
        bytes vaultData;
        string walrusCID;
        bytes32 suiTxHash;
        OperationStatus status;
        uint256 startTime;
        uint256 completionTime;
        string errorMessage;
        bool exists;
    }

    // Events for atomic operations
    event AtomicUpdateStarted(address indexed user, bytes32 indexed vaultId, string walrusCID);
    event AtomicUpdateCompleted(address indexed user, bytes32 indexed vaultId, bytes32 suiTxHash);
    event AtomicUpdateFailed(address indexed user, bytes32 indexed vaultId, string reason);
    event OperationRolledBack(address indexed user, bytes32 indexed operationId, string reason);
    
    // Events for ROFL worker integration
    event WalrusUploadRequested(bytes32 indexed operationId, bytes data, string baseUrl, uint256 epochs);
    event WalrusUploadCompleted(bytes32 indexed operationId, string cid);
    event WalrusUploadFailed(bytes32 indexed operationId, string reason);
    event SuiUpdateRequested(bytes32 indexed operationId, bytes32 vaultId, string cid, string rpcUrl);
    event SuiUpdateCompleted(bytes32 indexed operationId, bytes32 txHash);
    event SuiUpdateFailed(bytes32 indexed operationId, string reason);

    /**
     * @dev Coordinate Walrus upload and Sui state update
     * @param vaultId The vault identifier
     * @param newVaultData The new vault data to upload
     * @return walrusCID The content identifier from Walrus
     * @return suiTxHash The transaction hash from Sui
     */
    function executeAtomicUpdate(bytes32 vaultId, bytes calldata newVaultData)
        external returns (string memory walrusCID, bytes32 suiTxHash);

    /**
     * @dev Rollback failed atomic operations
     * @param vaultId The vault identifier
     * @param failedCID The CID that failed to complete
     */
    function rollbackFailedUpdate(bytes32 vaultId, string calldata failedCID) external;

    /**
     * @dev Verify atomic operation completion
     * @param vaultId The vault identifier
     * @param cid The content identifier to verify
     * @param suiTxHash The Sui transaction hash to verify
     * @return completed Whether the operation completed successfully
     */
    function verifyAtomicCompletion(bytes32 vaultId, string calldata cid, bytes32 suiTxHash)
        external view returns (bool completed);

    /**
     * @dev Get operation status
     * @param operationId The operation identifier
     * @return operation The operation details
     */
    function getOperation(bytes32 operationId) 
        external view returns (AtomicOperation memory operation);

    /**
     * @dev Get pending operations for user
     * @param user The user address
     * @return operations Array of pending operations
     */
    function getPendingOperations(address user) 
        external view returns (AtomicOperation[] memory operations);

    /**
     * @dev Clean up expired operations
     * @param maxAge Maximum age in seconds for operations to keep
     */
    function cleanupExpiredOperations(uint256 maxAge) external;

    /**
     * @dev Emergency pause atomic operations
     */
    function pauseOperations() external;

    /**
     * @dev Resume atomic operations
     */
    function resumeOperations() external;

    /**
     * @dev Check if operations are paused
     * @return paused Whether operations are currently paused
     */
    function isOperationsPaused() external view returns (bool paused);

    // ROFL worker callback functions
    /**
     * @dev Callback for ROFL worker to report Walrus upload results
     * @param operationId The operation identifier
     * @param success Whether the upload succeeded
     * @param cid The content identifier from Walrus (if successful)
     * @param errorMessage Error details (if failed)
     */
    function reportWalrusUploadResult(
        bytes32 operationId,
        bool success,
        string calldata cid,
        string calldata errorMessage
    ) external;

    /**
     * @dev Callback for ROFL worker to report Sui update results
     * @param operationId The operation identifier
     * @param success Whether the update succeeded
     * @param txHash The transaction hash from Sui (if successful)
     * @param errorMessage Error details (if failed)
     */
    function reportSuiUpdateResult(
        bytes32 operationId,
        bool success,
        bytes32 txHash,
        string calldata errorMessage
    ) external;

    /**
     * @dev Set the authorized ROFL worker address
     * @param roflWorker The ROFL worker address
     */
    function setROFLWorker(address roflWorker) external;
}
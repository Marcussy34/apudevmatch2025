// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "./interfaces/IAtomicVaultManager.sol";
import "./interfaces/IVaultEvents.sol";

/**
 * @title AtomicVaultManager
 * @dev Coordinated vault state management with atomic operations across Walrus and Sui
 */
contract AtomicVaultManager is IAtomicVaultManager, IVaultEvents {
    using Sapphire for *;

    // Operation timeout and retry configuration
    struct OperationConfig {
        uint256 timeoutSeconds;
        uint256 maxRetries;
        uint256 retryDelaySeconds;
        bool requireConfirmation;
    }

    // Walrus integration configuration
    struct WalrusConfig {
        string baseUrl;
        bytes32 apiKey;
        uint256 maxBlobSize;
        uint256 storageEpochs;
        bool isActive;
    }

    // Sui integration configuration
    struct SuiConfig {
        string rpcUrl;
        bytes32 packageId;
        bytes32 moduleId;
        uint256 gasLimit;
        bool isActive;
    }

    // Storage
    mapping(bytes32 => AtomicOperation) private operations;
    mapping(address => bytes32[]) private userOperations;
    mapping(bytes32 => bytes32[]) private vaultOperations;
    
    OperationConfig public defaultConfig;
    WalrusConfig public walrusConfig;
    SuiConfig public suiConfig;
    
    // Access control
    address public owner;
    bool public isPaused;
    
    // Statistics
    uint256 public totalOperations;
    uint256 public successfulOperations;
    uint256 public failedOperations;
    
    // Operation cleanup
    uint256 public operationRetentionPeriod = 30 days;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier whenNotPaused() {
        require(!isPaused, "Contract is paused");
        _;
    }

    modifier validOperation(bytes32 operationId) {
        require(operations[operationId].user != address(0), "Operation does not exist");
        _;
    }

    modifier onlyOperationOwner(bytes32 operationId) {
        require(operations[operationId].user == msg.sender, "Not operation owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        isPaused = false;
        
        // Initialize default configuration
        defaultConfig = OperationConfig({
            timeoutSeconds: 300, // 5 minutes
            maxRetries: 3,
            retryDelaySeconds: 30,
            requireConfirmation: true
        });

        // Initialize Walrus configuration (placeholder)
        walrusConfig = WalrusConfig({
            baseUrl: "https://walrus-testnet.mystenlabs.com",
            apiKey: keccak256("WALRUS_API_KEY"),
            maxBlobSize: 10 * 1024 * 1024, // 10MB
            storageEpochs: 5,
            isActive: true
        });

        // Initialize Sui configuration (placeholder)
        suiConfig = SuiConfig({
            rpcUrl: "https://fullnode.testnet.sui.io",
            packageId: keccak256("SUI_PACKAGE_ID"),
            moduleId: keccak256("vault_metadata"),
            gasLimit: 10000000,
            isActive: true
        });
    }

    /**
     * @dev Coordinate Walrus upload and Sui state update
     */
    function executeAtomicUpdate(bytes32 vaultId, bytes calldata newVaultData)
        external 
        override 
        whenNotPaused 
        returns (string memory walrusCID, bytes32 suiTxHash) 
    {
        require(vaultId != bytes32(0), "Invalid vault ID");
        require(newVaultData.length > 0, "Empty vault data");
        require(newVaultData.length <= walrusConfig.maxBlobSize, "Data too large");

        // Generate operation ID
        bytes32 operationId = keccak256(abi.encodePacked(
            msg.sender,
            vaultId,
            newVaultData,
            block.timestamp,
            Sapphire.randomBytes(32, "atomic-operation")
        ));

        // Create operation record
        AtomicOperation storage operation = operations[operationId];
        operation.id = operationId;
        operation.user = msg.sender;
        operation.vaultId = vaultId;
        operation.status = OperationStatus.Pending;
        operation.startTime = block.timestamp;

        // Add to tracking arrays
        userOperations[msg.sender].push(operationId);
        vaultOperations[vaultId].push(operationId);
        totalOperations++;

        emit AtomicUpdateStarted(msg.sender, vaultId, "");

        // Step 1: Upload to Walrus
        try this._uploadToWalrus(operationId, newVaultData) returns (string memory cid) {
            operation.walrusCID = cid;
            operation.status = OperationStatus.WalrusUploaded;
            walrusCID = cid;
            
            // Step 2: Update Sui state
            try this._updateSuiState(operationId, vaultId, cid) returns (bytes32 txHash) {
                operation.suiTxHash = txHash;
                operation.status = OperationStatus.SuiUpdated;
                suiTxHash = txHash;
                
                // Step 3: Mark as completed
                operation.status = OperationStatus.Completed;
                operation.completionTime = block.timestamp;
                successfulOperations++;
                
                emit AtomicUpdateCompleted(msg.sender, vaultId, suiTxHash);
                return (walrusCID, suiTxHash);
                
            } catch Error(string memory reason) {
                // Sui update failed, try to rollback Walrus
                operation.status = OperationStatus.Failed;
                failedOperations++;
                emit AtomicUpdateFailed(msg.sender, vaultId, reason);
                
                // Attempt rollback
                this._rollbackWalrus(operationId, cid);
                revert(string(abi.encodePacked("Sui update failed: ", reason)));
            }
            
        } catch Error(string memory reason) {
            // Walrus upload failed
            operation.status = OperationStatus.Failed;
            failedOperations++;
            emit AtomicUpdateFailed(msg.sender, vaultId, reason);
            revert(string(abi.encodePacked("Walrus upload failed: ", reason)));
        }
    }

    /**
     * @dev Upload data to Walrus (internal call for error handling)
     */
    function _uploadToWalrus(bytes32 operationId, bytes calldata data) 
        external 
        view 
        returns (string memory cid) 
    {
        require(msg.sender == address(this), "Internal call only");
        
        // Simulate Walrus upload
        // In real implementation, this would use Walrus HTTP API within TEE
        bytes32 dataHash = keccak256(data);
        string memory hashHex = _bytesToHex(dataHash);
        
        cid = string(abi.encodePacked(
            "bafkreihq6urhg",
            _substring(hashHex, 0, 20)
        ));
        
        return cid;
    }

    /**
     * @dev Update Sui state (internal call for error handling)
     */
    function _updateSuiState(bytes32 operationId, bytes32 vaultId, string memory cid) 
        external 
        view 
        returns (bytes32 txHash) 
    {
        require(msg.sender == address(this), "Internal call only");
        
        // Simulate Sui transaction
        // In real implementation, this would call Sui RPC within TEE
        txHash = keccak256(abi.encodePacked(
            vaultId,
            cid,
            block.timestamp,
            "sui_tx"
        ));
        
        return txHash;
    }

    /**
     * @dev Rollback Walrus upload (internal call)
     */
    function _rollbackWalrus(bytes32 operationId, string memory cid) external {
        require(msg.sender == address(this), "Internal call only");
        
        // In real implementation, this would delete the blob from Walrus
        // For now, we just emit an event
        AtomicOperation storage operation = operations[operationId];
        operation.status = OperationStatus.RolledBack;
        
        emit OperationRolledBack(operation.user, operationId, "Walrus rollback");
    }

    /**
     * @dev Rollback failed atomic operations
     */
    function rollbackFailedUpdate(bytes32 vaultId, string calldata failedCID) 
        external 
        override 
        whenNotPaused 
    {
        // Find operations with this CID
        bytes32[] storage vaultOps = vaultOperations[vaultId];
        
        for (uint i = 0; i < vaultOps.length; i++) {
            AtomicOperation storage operation = operations[vaultOps[i]];
            
            if (operation.user == msg.sender && 
                keccak256(bytes(operation.walrusCID)) == keccak256(bytes(failedCID)) &&
                operation.status == OperationStatus.Failed) {
                
                operation.status = OperationStatus.RolledBack;
                emit OperationRolledBack(msg.sender, operation.id, "Manual rollback");
                return;
            }
        }
        
        revert("No matching failed operation found");
    }

    /**
     * @dev Verify atomic operation completion
     */
    function verifyAtomicCompletion(bytes32 vaultId, string calldata cid, bytes32 suiTxHash)
        external 
        view 
        override 
        returns (bool completed) 
    {
        bytes32[] storage vaultOps = vaultOperations[vaultId];
        
        for (uint i = 0; i < vaultOps.length; i++) {
            AtomicOperation storage operation = operations[vaultOps[i]];
            
            if (keccak256(bytes(operation.walrusCID)) == keccak256(bytes(cid)) &&
                operation.suiTxHash == suiTxHash &&
                operation.status == OperationStatus.Completed) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * @dev Get operation status
     */
    function getOperation(bytes32 operationId) 
        external 
        view 
        override 
        validOperation(operationId) 
        returns (AtomicOperation memory operation) 
    {
        require(
            operations[operationId].user == msg.sender || msg.sender == owner,
            "Not authorized"
        );
        
        return operations[operationId];
    }

    /**
     * @dev Get pending operations for user
     */
    function getPendingOperations(address user) 
        external 
        view 
        override 
        returns (AtomicOperation[] memory pendingOps) 
    {
        require(user == msg.sender || msg.sender == owner, "Not authorized");
        
        bytes32[] storage userOps = userOperations[user];
        uint256 pendingCount = 0;
        
        // Count pending operations
        for (uint i = 0; i < userOps.length; i++) {
            if (operations[userOps[i]].status == OperationStatus.Pending ||
                operations[userOps[i]].status == OperationStatus.WalrusUploaded ||
                operations[userOps[i]].status == OperationStatus.SuiUpdated) {
                pendingCount++;
            }
        }
        
        // Create array of pending operations
        pendingOps = new AtomicOperation[](pendingCount);
        uint256 index = 0;
        
        for (uint i = 0; i < userOps.length; i++) {
            AtomicOperation storage op = operations[userOps[i]];
            if (op.status == OperationStatus.Pending ||
                op.status == OperationStatus.WalrusUploaded ||
                op.status == OperationStatus.SuiUpdated) {
                pendingOps[index] = op;
                index++;
            }
        }
        
        return pendingOps;
    }

    /**
     * @dev Clean up expired operations
     */
    function cleanupExpiredOperations(uint256 maxAge) 
        external 
        override 
        onlyOwner 
    {
        // This would be implemented to clean up old operations
        // For now, we just emit an event
        emit SystemHealthCheck(block.timestamp, true, "Cleanup executed");
    }

    /**
     * @dev Emergency pause atomic operations
     */
    function pauseOperations() external override onlyOwner {
        isPaused = true;
        emit SystemHealthCheck(block.timestamp, false, "Operations paused");
    }

    /**
     * @dev Resume atomic operations
     */
    function resumeOperations() external override onlyOwner {
        isPaused = false;
        emit SystemHealthCheck(block.timestamp, true, "Operations resumed");
    }

    /**
     * @dev Check if operations are paused
     */
    function isOperationsPaused() external view override returns (bool paused) {
        return isPaused;
    }

    /**
     * @dev Get operation statistics
     */
    function getOperationStats() 
        external 
        view 
        returns (
            uint256 total,
            uint256 successful,
            uint256 failed,
            uint256 successRate
        ) 
    {
        total = totalOperations;
        successful = successfulOperations;
        failed = failedOperations;
        
        if (total > 0) {
            successRate = (successful * 100) / total;
        } else {
            successRate = 0;
        }
        
        return (total, successful, failed, successRate);
    }

    /**
     * @dev Update Walrus configuration
     */
    function updateWalrusConfig(
        string calldata baseUrl,
        bytes32 apiKey,
        uint256 maxBlobSize,
        uint256 storageEpochs
    ) external onlyOwner {
        walrusConfig.baseUrl = baseUrl;
        walrusConfig.apiKey = apiKey;
        walrusConfig.maxBlobSize = maxBlobSize;
        walrusConfig.storageEpochs = storageEpochs;
    }

    /**
     * @dev Update Sui configuration
     */
    function updateSuiConfig(
        string calldata rpcUrl,
        bytes32 packageId,
        bytes32 moduleId,
        uint256 gasLimit
    ) external onlyOwner {
        suiConfig.rpcUrl = rpcUrl;
        suiConfig.packageId = packageId;
        suiConfig.moduleId = moduleId;
        suiConfig.gasLimit = gasLimit;
    }

    /**
     * @dev Update operation configuration
     */
    function updateOperationConfig(
        uint256 timeoutSeconds,
        uint256 maxRetries,
        uint256 retryDelaySeconds,
        bool requireConfirmation
    ) external onlyOwner {
        defaultConfig.timeoutSeconds = timeoutSeconds;
        defaultConfig.maxRetries = maxRetries;
        defaultConfig.retryDelaySeconds = retryDelaySeconds;
        defaultConfig.requireConfirmation = requireConfirmation;
    }

    /**
     * @dev Get vault operations
     */
    function getVaultOperations(bytes32 vaultId) 
        external 
        view 
        returns (bytes32[] memory operationIds) 
    {
        return vaultOperations[vaultId];
    }

    /**
     * @dev Get user operations
     */
    function getUserOperations(address user) 
        external 
        view 
        returns (bytes32[] memory operationIds) 
    {
        require(user == msg.sender || msg.sender == owner, "Not authorized");
        return userOperations[user];
    }

    // Helper functions
    function _bytesToHex(bytes32 data) private pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(64);
        
        for (uint i = 0; i < 32; i++) {
            str[i*2] = alphabet[uint(uint8(data[i] >> 4))];
            str[1+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
        }
        
        return string(str);
    }

    function _substring(string memory str, uint startIndex, uint length) private pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        require(startIndex + length <= strBytes.length, "Substring out of bounds");
        
        bytes memory result = new bytes(length);
        for (uint i = 0; i < length; i++) {
            result[i] = strBytes[startIndex + i];
        }
        
        return string(result);
    }

    // Event implementations
    function emitVaultEvent(address user, uint8 eventType, bytes calldata data) 
        external 
        override 
    {
        emit GenericVaultEvent(user, eventType, data);
    }

    function emitUserFlowEvent(
        address user, 
        uint8 flowType, 
        uint8 step, 
        bool success, 
        bytes calldata data
    ) external override {
        emit UserFlowEvent(user, flowType, step, success, data);
    }

    // Custom events
    event GenericVaultEvent(address indexed user, uint8 eventType, bytes data);
    event UserFlowEvent(address indexed user, uint8 flowType, uint8 step, bool success, bytes data);
}
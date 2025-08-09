// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IAtomicVaultManager.sol";
import "./interfaces/IVaultEvents.sol";

/**
 * @title AtomicVaultManager
 * @dev Coordinated vault state management with atomic operations across Walrus and Sui
 * 
 * ARCHITECTURE NOTE:
 * Smart contracts cannot make HTTP requests directly, even on Sapphire. The HTTP integration
 * functions in this contract return mock data for testing. In production, external systems
 * must handle HTTP communications:
 * 
 * 1. ROFL Worker: Can make HTTPS calls to Walrus/Sui and call back into this contract
 * 2. Frontend: Can fetch directly and call contract functions with results
 * 3. Trusted Backend: Can act as oracle/bridge between external APIs and contract
 * 
 * The contract provides the coordination logic and state management, while external
 * systems handle the actual HTTP communications with Walrus and Sui networks.
 */
contract AtomicVaultManager is IAtomicVaultManager, IVaultEvents, ReentrancyGuard {
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
    address public roflWorker;
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

    modifier onlyROFLWorker() {
        require(msg.sender == roflWorker, "Not authorized ROFL worker");
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
        nonReentrant
        whenNotPaused 
        returns (string memory walrusCID, bytes32 suiTxHash) 
    {
        require(vaultId != bytes32(0), "Invalid vault ID");
        require(newVaultData.length > 0, "Empty vault data");
        require(newVaultData.length <= walrusConfig.maxBlobSize, "Data too large");
        require(roflWorker != address(0), "ROFL worker not set");

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
        operation.vaultData = newVaultData;
        operation.status = OperationStatus.WalrusUploadRequested;
        operation.exists = true;
        operation.startTime = block.timestamp;

        // Add to tracking arrays
        userOperations[msg.sender].push(operationId);
        vaultOperations[vaultId].push(operationId);
        totalOperations++;

        // Emit events for ROFL worker to pick up
        emit WalrusUploadRequested(operationId, newVaultData, walrusConfig.baseUrl, walrusConfig.storageEpochs);
        emit AtomicUpdateStarted(msg.sender, vaultId, "");

        // Return empty values - actual values will be available after ROFL worker completes
        // Users should listen to events or query operation status for completion
        return ("", bytes32(0));
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
        nonReentrant
        whenNotPaused
    {
        require(maxAge >= 1 hours && maxAge <= 30 days, "Invalid max age");
        
        // This would be implemented to clean up old operations
        // For now, we just emit an event
        emit SystemHealthCheck(block.timestamp, true, "Cleanup executed");
    }

    /**
     * @dev Emergency pause atomic operations
     */
    function pauseOperations() external override onlyOwner nonReentrant {
        require(!isPaused, "Already paused");
        isPaused = true;
        emit SystemHealthCheck(block.timestamp, false, "Operations paused");
    }

    /**
     * @dev Resume atomic operations
     */
    function resumeOperations() external override onlyOwner nonReentrant {
        require(isPaused, "Not paused");
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
    ) external onlyOwner nonReentrant whenNotPaused {
        require(bytes(baseUrl).length > 0, "Base URL cannot be empty");
        require(maxBlobSize > 0 && maxBlobSize <= 100 * 1024 * 1024, "Invalid max blob size"); // Max 100MB
        require(storageEpochs > 0 && storageEpochs <= 100, "Invalid storage epochs");
        
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
    ) external onlyOwner nonReentrant whenNotPaused {
        require(bytes(rpcUrl).length > 0, "RPC URL cannot be empty");
        require(packageId != bytes32(0), "Package ID cannot be zero");
        require(moduleId != bytes32(0), "Module ID cannot be zero");
        require(gasLimit >= 1000000 && gasLimit <= 100000000, "Invalid gas limit"); // 1M - 100M gas
        
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
    ) external onlyOwner nonReentrant whenNotPaused {
        require(timeoutSeconds >= 30 && timeoutSeconds <= 3600, "Timeout must be 30s-1h");
        require(maxRetries <= 10, "Too many retries");
        require(retryDelaySeconds >= 1 && retryDelaySeconds <= 300, "Retry delay must be 1s-5m");
        
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
    
    function _uint256ToString(uint256 value) private pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
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

    /**
     * @dev Set the authorized ROFL worker address
     */
    function setROFLWorker(address _roflWorker) external override onlyOwner {
        require(_roflWorker != address(0), "Invalid ROFL worker address");
        roflWorker = _roflWorker;
        emit ROFLWorkerUpdated(_roflWorker);
    }

    /**
     * @dev Callback for ROFL worker to report Walrus upload results
     */
    function reportWalrusUploadResult(
        bytes32 operationId,
        bool success,
        string calldata cid,
        string calldata errorMessage
    ) external override onlyROFLWorker nonReentrant {
        require(operations[operationId].exists, "Operation not found");
        require(operations[operationId].status == OperationStatus.WalrusUploadRequested, "Invalid operation state");
        
        AtomicOperation storage operation = operations[operationId];
        
        if (success) {
            operation.walrusCID = cid;
            operation.status = OperationStatus.WalrusUploaded;
            emit WalrusUploadCompleted(operationId, cid);
            
            // Proceed to next step - request Sui state update
            emit SuiUpdateRequested(operationId, operation.vaultId, cid, suiConfig.rpcUrl);
            operation.status = OperationStatus.SuiUpdateRequested;
        } else {
            operation.status = OperationStatus.Failed;
            operation.errorMessage = errorMessage;
            operation.completionTime = block.timestamp;
            failedOperations++;
            emit WalrusUploadFailed(operationId, errorMessage);
            emit AtomicUpdateFailed(operation.user, operation.vaultId, errorMessage);
        }
    }

    /**
     * @dev Callback for ROFL worker to report Sui update results
     */
    function reportSuiUpdateResult(
        bytes32 operationId,
        bool success,
        bytes32 txHash,
        string calldata errorMessage
    ) external override onlyROFLWorker nonReentrant {
        require(operations[operationId].exists, "Operation not found");
        require(operations[operationId].status == OperationStatus.SuiUpdateRequested, "Invalid operation state");
        
        AtomicOperation storage operation = operations[operationId];
        
        if (success) {
            operation.suiTxHash = txHash;
            operation.status = OperationStatus.Completed;
            operation.completionTime = block.timestamp;
            successfulOperations++;
            emit SuiUpdateCompleted(operationId, txHash);
            emit AtomicUpdateCompleted(operation.user, operation.vaultId, txHash);
        } else {
            operation.status = OperationStatus.Failed;
            operation.errorMessage = errorMessage;
            operation.completionTime = block.timestamp;
            failedOperations++;
            emit SuiUpdateFailed(operationId, errorMessage);
            emit AtomicUpdateFailed(operation.user, operation.vaultId, errorMessage);
        }
    }

    // Custom events
    event GenericVaultEvent(address indexed user, uint8 eventType, bytes data);
    event UserFlowEvent(address indexed user, uint8 flowType, uint8 step, bool success, bytes data);
    event ROFLWorkerUpdated(address indexed newROFLWorker);
}
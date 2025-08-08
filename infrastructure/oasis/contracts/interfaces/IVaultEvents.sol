// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title IVaultEvents
 * @dev Interface defining all events for The Graph indexing
 */
interface IVaultEvents {
    // Core vault events - only declare events not in other interfaces
    event TransactionSigned(address indexed user, bytes32 indexed walletId, bytes32 txHash, uint8 chainType);
    
    // Device and access control events
    event DeviceRegistered(address indexed user, bytes32 indexed deviceId, string deviceName);
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
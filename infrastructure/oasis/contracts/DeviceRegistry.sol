// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "./interfaces/IVaultEvents.sol";

/**
 * @title DeviceRegistry
 * @dev Multi-device authentication and management with secure device authorization
 */
contract DeviceRegistry is IVaultEvents {
    using Sapphire for *;

    // Device status enumeration
    enum DeviceStatus {
        Active,
        Suspended,
        Revoked,
        Pending
    }

    // Device information structure
    struct Device {
        bytes32 id;
        address owner;
        string name;
        bytes32 publicKeyHash;
        bytes deviceFingerprint;
        DeviceStatus status;
        uint256 registeredAt;
        uint256 lastUsed;
        uint256 authCount;
        bool exists;
    }

    // Device authorization record
    struct DeviceAuth {
        bytes32 deviceId;
        bytes32 challenge;
        bytes signature;
        uint256 timestamp;
        bool verified;
    }

    // Storage
    mapping(bytes32 => Device) private devices;
    mapping(address => bytes32[]) private userDevices;
    mapping(bytes32 => DeviceAuth[]) private deviceAuths;
    mapping(address => uint256) private maxDevicesPerUser;
    
    // Access control
    address public owner;
    bool public isPaused;
    uint256 public defaultMaxDevices = 10;
    uint256 public authChallengeExpiry = 300; // 5 minutes

    // Events - only declare events not in interfaces
    event DeviceAuthenticated(address indexed user, bytes32 indexed deviceId, uint256 timestamp);
    event DeviceStatusChanged(address indexed user, bytes32 indexed deviceId, DeviceStatus newStatus);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier whenNotPaused() {
        require(!isPaused, "Contract is paused");
        _;
    }

    modifier validDevice(bytes32 deviceId) {
        require(devices[deviceId].exists, "Device does not exist");
        _;
    }

    modifier onlyDeviceOwner(bytes32 deviceId) {
        require(devices[deviceId].owner == msg.sender, "Not device owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        isPaused = false;
    }

    /**
     * @dev Register a new device for the user
     * @param deviceName Human-readable device name
     * @param publicKeyHash Hash of the device's public key
     * @param deviceFingerprint Unique device fingerprint
     * @return deviceId The generated device identifier
     */
    function registerDevice(
        string calldata deviceName,
        bytes32 publicKeyHash,
        bytes calldata deviceFingerprint
    ) 
        external 
        whenNotPaused 
        returns (bytes32 deviceId) 
    {
        uint256 maxDevices = maxDevicesPerUser[msg.sender] == 0 
            ? defaultMaxDevices 
            : maxDevicesPerUser[msg.sender];
        
        require(userDevices[msg.sender].length < maxDevices, "Too many devices");
        require(bytes(deviceName).length > 0, "Device name required");
        require(publicKeyHash != bytes32(0), "Public key hash required");

        // Generate secure device ID
        deviceId = keccak256(abi.encodePacked(
            msg.sender,
            publicKeyHash,
            deviceFingerprint,
            block.timestamp,
            Sapphire.randomBytes(32, "device-registration")
        ));

        // Ensure device ID is unique
        require(!devices[deviceId].exists, "Device ID collision");

        // Create device record
        devices[deviceId] = Device({
            id: deviceId,
            owner: msg.sender,
            name: deviceName,
            publicKeyHash: publicKeyHash,
            deviceFingerprint: deviceFingerprint,
            status: DeviceStatus.Active,
            registeredAt: block.timestamp,
            lastUsed: block.timestamp,
            authCount: 0,
            exists: true
        });

        // Add to user's device list
        userDevices[msg.sender].push(deviceId);

        emit DeviceRegistered(msg.sender, deviceId, deviceName);
        return deviceId;
    }

    /**
     * @dev Authenticate device with challenge-response
     * @param deviceId The device identifier
     * @param challenge The authentication challenge
     * @param signature The signed challenge
     * @return success Whether authentication was successful
     */
    function authenticateDevice(
        bytes32 deviceId,
        bytes32 challenge,
        bytes calldata signature
    ) 
        external 
        validDevice(deviceId) 
        onlyDeviceOwner(deviceId) 
        whenNotPaused 
        returns (bool success) 
    {
        Device storage device = devices[deviceId];
        require(device.status == DeviceStatus.Active, "Device not active");

        // In a real implementation, this would verify the signature against the public key
        // For now, we'll do a simple validation
        bytes32 expectedHash = keccak256(abi.encodePacked(challenge, device.publicKeyHash));
        bool verified = keccak256(signature) != bytes32(0); // Mock verification

        // Record authentication attempt
        deviceAuths[deviceId].push(DeviceAuth({
            deviceId: deviceId,
            challenge: challenge,
            signature: signature,
            timestamp: block.timestamp,
            verified: verified
        }));

        if (verified) {
            device.lastUsed = block.timestamp;
            device.authCount++;
            emit DeviceAuthenticated(msg.sender, deviceId, block.timestamp);
            return true;
        }

        return false;
    }

    /**
     * @dev Revoke a device
     * @param deviceId The device identifier
     */
    function revokeDevice(bytes32 deviceId) 
        external 
        validDevice(deviceId) 
        onlyDeviceOwner(deviceId) 
        whenNotPaused 
    {
        Device storage device = devices[deviceId];
        device.status = DeviceStatus.Revoked;
        
        emit DeviceRevoked(msg.sender, deviceId, block.timestamp);
        emit DeviceStatusChanged(msg.sender, deviceId, DeviceStatus.Revoked);
    }

    /**
     * @dev Suspend a device (can be reactivated)
     * @param deviceId The device identifier
     */
    function suspendDevice(bytes32 deviceId) 
        external 
        validDevice(deviceId) 
        onlyDeviceOwner(deviceId) 
        whenNotPaused 
    {
        Device storage device = devices[deviceId];
        require(device.status == DeviceStatus.Active, "Device not active");
        
        device.status = DeviceStatus.Suspended;
        emit DeviceStatusChanged(msg.sender, deviceId, DeviceStatus.Suspended);
    }

    /**
     * @dev Reactivate a suspended device
     * @param deviceId The device identifier
     */
    function reactivateDevice(bytes32 deviceId) 
        external 
        validDevice(deviceId) 
        onlyDeviceOwner(deviceId) 
        whenNotPaused 
    {
        Device storage device = devices[deviceId];
        require(device.status == DeviceStatus.Suspended, "Device not suspended");
        
        device.status = DeviceStatus.Active;
        emit DeviceStatusChanged(msg.sender, deviceId, DeviceStatus.Active);
    }

    /**
     * @dev Get device information
     * @param deviceId The device identifier
     * @return device The device information
     */
    function getDevice(bytes32 deviceId) 
        external 
        view 
        validDevice(deviceId) 
        onlyDeviceOwner(deviceId) 
        returns (Device memory device) 
    {
        return devices[deviceId];
    }

    /**
     * @dev Get user's devices
     * @param user The user address
     * @return deviceIds Array of device identifiers
     */
    function getUserDevices(address user) 
        external 
        view 
        returns (bytes32[] memory deviceIds) 
    {
        require(msg.sender == user || msg.sender == owner, "Not authorized");
        return userDevices[user];
    }

    /**
     * @dev Get device status
     * @param deviceId The device identifier
     * @return status The device status
     */
    function getDeviceStatus(bytes32 deviceId) 
        external 
        view 
        validDevice(deviceId) 
        returns (DeviceStatus status) 
    {
        require(
            devices[deviceId].owner == msg.sender || msg.sender == owner, 
            "Not authorized"
        );
        return devices[deviceId].status;
    }

    /**
     * @dev Check if device is authorized for operation
     * @param deviceId The device identifier
     * @return authorized Whether the device is authorized
     */
    function isDeviceAuthorized(bytes32 deviceId) 
        external 
        view 
        validDevice(deviceId) 
        returns (bool authorized) 
    {
        return devices[deviceId].status == DeviceStatus.Active;
    }

    /**
     * @dev Get device authentication history
     * @param deviceId The device identifier
     * @param limit Maximum number of records to return
     * @return auths Array of authentication records
     */
    function getDeviceAuthHistory(bytes32 deviceId, uint256 limit) 
        external 
        view 
        validDevice(deviceId) 
        onlyDeviceOwner(deviceId) 
        returns (DeviceAuth[] memory auths) 
    {
        DeviceAuth[] storage history = deviceAuths[deviceId];
        uint256 length = history.length;
        uint256 returnLength = limit > length ? length : limit;
        
        auths = new DeviceAuth[](returnLength);
        
        // Return most recent entries
        for (uint256 i = 0; i < returnLength; i++) {
            auths[i] = history[length - returnLength + i];
        }
        
        return auths;
    }

    /**
     * @dev Update device name
     * @param deviceId The device identifier
     * @param newName The new device name
     */
    function updateDeviceName(bytes32 deviceId, string calldata newName) 
        external 
        validDevice(deviceId) 
        onlyDeviceOwner(deviceId) 
        whenNotPaused 
    {
        require(bytes(newName).length > 0, "Device name required");
        devices[deviceId].name = newName;
    }

    /**
     * @dev Generate authentication challenge for device
     * @param deviceId The device identifier
     * @return challenge The generated challenge
     */
    function generateAuthChallenge(bytes32 deviceId) 
        external 
        view 
        validDevice(deviceId) 
        onlyDeviceOwner(deviceId) 
        returns (bytes32 challenge) 
    {
        // Generate a unique challenge based on device and current time
        challenge = keccak256(abi.encodePacked(
            deviceId,
            devices[deviceId].publicKeyHash,
            block.timestamp,
            blockhash(block.number - 1)
        ));
        
        return challenge;
    }

    // Admin functions

    /**
     * @dev Set maximum devices per user
     * @param user The user address (address(0) for default)
     * @param maxDevices The maximum number of devices
     */
    function setMaxDevicesPerUser(address user, uint256 maxDevices) 
        external 
        onlyOwner 
    {
        if (user == address(0)) {
            defaultMaxDevices = maxDevices;
        } else {
            maxDevicesPerUser[user] = maxDevices;
        }
    }

    /**
     * @dev Set authentication challenge expiry time
     * @param expiry The expiry time in seconds
     */
    function setAuthChallengeExpiry(uint256 expiry) 
        external 
        onlyOwner 
    {
        authChallengeExpiry = expiry;
    }

    /**
     * @dev Emergency revoke device (admin only)
     * @param deviceId The device identifier
     * @param reason The reason for revocation
     */
    function emergencyRevokeDevice(bytes32 deviceId, string calldata reason) 
        external 
        onlyOwner 
        validDevice(deviceId) 
    {
        Device storage device = devices[deviceId];
        device.status = DeviceStatus.Revoked;
        
        emit DeviceRevoked(device.owner, deviceId, block.timestamp);
        emit SecurityAlert(device.owner, 1, reason, block.timestamp);
    }

    // Event implementations for IVaultEvents
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

    function pause() external onlyOwner {
        isPaused = true;
    }

    function unpause() external onlyOwner {
        isPaused = false;
    }
}
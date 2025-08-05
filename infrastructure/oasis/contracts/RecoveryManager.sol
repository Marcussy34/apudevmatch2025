// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "./interfaces/IVaultEvents.sol";

/**
 * @title RecoveryManager
 * @dev Backup and recovery system with social recovery and access control
 */
contract RecoveryManager is IVaultEvents {
    using Sapphire for *;

    // Recovery method types
    enum RecoveryMethod {
        SocialRecovery,
        BackupPhrase,
        HardwareKey,
        BiometricBackup
    }

    // Recovery status
    enum RecoveryStatus {
        Pending,
        InProgress,
        Completed,
        Failed,
        Cancelled,
        Expired
    }

    // Recovery request structure
    struct RecoveryRequest {
        bytes32 id;
        address user;
        RecoveryMethod method;
        RecoveryStatus status;
        uint256 threshold;
        uint256 requiredApprovals;
        uint256 currentApprovals;
        address[] guardians;
        mapping(address => bool) guardiansApproved;
        bytes encryptedRecoveryData;
        uint256 createdAt;
        uint256 expiresAt;
        uint256 completedAt;
        bool exists;
    }

    // Guardian structure
    struct Guardian {
        address guardianAddress;
        string name;
        bytes32 contactHash;
        bool isActive;
        uint256 addedAt;
        uint256 lastVerified;
    }

    // Recovery share structure
    struct RecoveryShare {
        bytes32 shareId;
        address owner;
        bytes encryptedShare;
        bytes32 shareHash;
        uint256 threshold;
        uint256 createdAt;
        bool isActive;
    }

    // Storage
    mapping(bytes32 => RecoveryRequest) private recoveryRequests;
    mapping(address => bytes32[]) private userRecoveryRequests;
    mapping(address => Guardian[]) private userGuardians;
    mapping(address => RecoveryShare[]) private userShares;
    mapping(address => mapping(address => bool)) private guardianAuthorizations;
    
    // Access control
    address public owner;
    bool public isPaused;
    
    // Configuration
    uint256 public defaultRecoveryPeriod = 7 days;
    uint256 public minGuardians = 2;
    uint256 public maxGuardians = 10;
    uint256 public minThreshold = 2;

    // Events
    event RecoveryInitiated(address indexed user, bytes32 indexed recoveryId, uint256 threshold);
    event RecoveryCompleted(address indexed user, bytes32 indexed recoveryId, uint256 timestamp);
    event GuardianAdded(address indexed user, address indexed guardian, string name);
    event GuardianRemoved(address indexed user, address indexed guardian);
    event GuardianApproved(address indexed user, bytes32 indexed recoveryId, address indexed guardian);
    event RecoveryShareCreated(address indexed user, bytes32 indexed shareId, uint256 threshold);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier whenNotPaused() {
        require(!isPaused, "Contract is paused");
        _;
    }

    modifier validRecoveryRequest(bytes32 recoveryId) {
        require(recoveryRequests[recoveryId].exists, "Recovery request does not exist");
        _;
    }

    modifier onlyRequestOwner(bytes32 recoveryId) {
        require(recoveryRequests[recoveryId].user == msg.sender, "Not request owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        isPaused = false;
    }

    /**
     * @dev Add a guardian for social recovery
     * @param guardianAddress The guardian's address
     * @param name Human-readable name for the guardian
     * @param contactHash Hash of contact information
     */
    function addGuardian(
        address guardianAddress,
        string calldata name,
        bytes32 contactHash
    ) 
        external 
        whenNotPaused 
    {
        require(guardianAddress != address(0), "Invalid guardian address");
        require(guardianAddress != msg.sender, "Cannot add self as guardian");
        require(bytes(name).length > 0, "Guardian name required");
        require(userGuardians[msg.sender].length < maxGuardians, "Too many guardians");

        // Check if guardian already exists
        Guardian[] storage guardians = userGuardians[msg.sender];
        for (uint i = 0; i < guardians.length; i++) {
            require(guardians[i].guardianAddress != guardianAddress, "Guardian already exists");
        }

        // Add guardian
        guardians.push(Guardian({
            guardianAddress: guardianAddress,
            name: name,
            contactHash: contactHash,
            isActive: true,
            addedAt: block.timestamp,
            lastVerified: block.timestamp
        }));

        guardianAuthorizations[msg.sender][guardianAddress] = true;
        emit GuardianAdded(msg.sender, guardianAddress, name);
    }

    /**
     * @dev Remove a guardian
     * @param guardianAddress The guardian's address to remove
     */
    function removeGuardian(address guardianAddress) 
        external 
        whenNotPaused 
    {
        Guardian[] storage guardians = userGuardians[msg.sender];
        
        for (uint i = 0; i < guardians.length; i++) {
            if (guardians[i].guardianAddress == guardianAddress) {
                guardians[i].isActive = false;
                guardianAuthorizations[msg.sender][guardianAddress] = false;
                emit GuardianRemoved(msg.sender, guardianAddress);
                return;
            }
        }
        
        revert("Guardian not found");
    }

    /**
     * @dev Initiate social recovery process
     * @param threshold Number of guardian approvals required
     * @param encryptedRecoveryData Encrypted recovery data
     * @return recoveryId The recovery request identifier
     */
    function initiateRecovery(
        uint256 threshold,
        bytes calldata encryptedRecoveryData
    ) 
        external 
        whenNotPaused 
        returns (bytes32 recoveryId) 
    {
        require(threshold >= minThreshold, "Threshold too low");
        
        Guardian[] storage guardians = userGuardians[msg.sender];
        uint256 activeGuardians = 0;
        
        for (uint i = 0; i < guardians.length; i++) {
            if (guardians[i].isActive) {
                activeGuardians++;
            }
        }
        
        require(activeGuardians >= threshold, "Not enough active guardians");

        // Generate recovery ID
        recoveryId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            Sapphire.randomBytes(32, "recovery-init")
        ));

        // Create recovery request
        RecoveryRequest storage request = recoveryRequests[recoveryId];
        request.id = recoveryId;
        request.user = msg.sender;
        request.method = RecoveryMethod.SocialRecovery;
        request.status = RecoveryStatus.Pending;
        request.threshold = threshold;
        request.requiredApprovals = threshold;
        request.currentApprovals = 0;
        request.encryptedRecoveryData = encryptedRecoveryData;
        request.createdAt = block.timestamp;
        request.expiresAt = block.timestamp + defaultRecoveryPeriod;
        request.exists = true;

        // Copy active guardians
        for (uint i = 0; i < guardians.length; i++) {
            if (guardians[i].isActive) {
                request.guardians.push(guardians[i].guardianAddress);
            }
        }

        userRecoveryRequests[msg.sender].push(recoveryId);

        emit RecoveryInitiated(msg.sender, recoveryId, threshold);
        return recoveryId;
    }

    /**
     * @dev Guardian approves recovery request
     * @param recoveryId The recovery request identifier
     */
    function approveRecovery(bytes32 recoveryId) 
        external 
        validRecoveryRequest(recoveryId) 
        whenNotPaused 
    {
        RecoveryRequest storage request = recoveryRequests[recoveryId];
        require(block.timestamp <= request.expiresAt, "Recovery request expired");
        require(request.status == RecoveryStatus.Pending, "Recovery not pending");
        
        // Check if sender is an authorized guardian
        bool isGuardian = false;
        for (uint i = 0; i < request.guardians.length; i++) {
            if (request.guardians[i] == msg.sender) {
                isGuardian = true;
                break;
            }
        }
        require(isGuardian, "Not an authorized guardian");
        require(!request.guardiansApproved[msg.sender], "Already approved");

        // Record approval
        request.guardiansApproved[msg.sender] = true;
        request.currentApprovals++;

        emit GuardianApproved(request.user, recoveryId, msg.sender);

        // Check if threshold reached
        if (request.currentApprovals >= request.requiredApprovals) {
            request.status = RecoveryStatus.Completed;
            request.completedAt = block.timestamp;
            emit RecoveryCompleted(request.user, recoveryId, block.timestamp);
        }
    }

    /**
     * @dev Create encrypted recovery shares using secret sharing
     * @param threshold The minimum number of shares needed for recovery
     * @param shareData Array of encrypted share data
     * @return shareIds Array of created share identifiers
     */
    function createRecoveryShares(
        uint256 threshold,
        bytes[] calldata shareData
    ) 
        external 
        whenNotPaused 
        returns (bytes32[] memory shareIds) 
    {
        require(threshold > 0 && threshold <= shareData.length, "Invalid threshold");
        require(shareData.length <= maxGuardians, "Too many shares");

        shareIds = new bytes32[](shareData.length);
        
        for (uint i = 0; i < shareData.length; i++) {
            bytes32 shareId = keccak256(abi.encodePacked(
                msg.sender,
                i,
                block.timestamp,
                Sapphire.randomBytes(16, "share-creation")
            ));

            userShares[msg.sender].push(RecoveryShare({
                shareId: shareId,
                owner: msg.sender,
                encryptedShare: shareData[i],
                shareHash: keccak256(shareData[i]),
                threshold: threshold,
                createdAt: block.timestamp,
                isActive: true
            }));

            shareIds[i] = shareId;
            emit RecoveryShareCreated(msg.sender, shareId, threshold);
        }

        return shareIds;
    }

    /**
     * @dev Reconstruct secret from recovery shares
     * @param shareIds Array of share identifiers to use
     * @param shareProofs Array of share proofs
     * @return success Whether reconstruction was successful
     * @return reconstructedData The reconstructed secret data
     */
    function reconstructFromShares(
        bytes32[] calldata shareIds,
        bytes[] calldata shareProofs
    ) 
        external 
        view 
        whenNotPaused 
        returns (bool success, bytes memory reconstructedData) 
    {
        require(shareIds.length == shareProofs.length, "Array length mismatch");
        require(shareIds.length > 0, "No shares provided");

        RecoveryShare[] storage shares = userShares[msg.sender];
        uint256 validShares = 0;
        uint256 requiredThreshold = 0;

        // Verify shares and get threshold
        for (uint i = 0; i < shareIds.length; i++) {
            for (uint j = 0; j < shares.length; j++) {
                if (shares[j].shareId == shareIds[i] && shares[j].isActive) {
                    // Verify share proof
                    if (keccak256(shareProofs[i]) == shares[j].shareHash) {
                        validShares++;
                        if (requiredThreshold == 0) {
                            requiredThreshold = shares[j].threshold;
                        }
                    }
                    break;
                }
            }
        }

        if (validShares >= requiredThreshold) {
            // In a real implementation, this would use Shamir's Secret Sharing
            // For now, we'll return a mock reconstructed secret
            reconstructedData = abi.encodePacked("RECONSTRUCTED_SECRET_", block.timestamp);
            return (true, reconstructedData);
        }

        return (false, "");
    }

    /**
     * @dev Get recovery request details
     * @param recoveryId The recovery request identifier
     * @return user The user who initiated recovery
     * @return status The current recovery status
     * @return currentApprovals Number of current approvals
     * @return requiredApprovals Number of required approvals
     * @return expiresAt Expiration timestamp
     */
    function getRecoveryRequest(bytes32 recoveryId) 
        external 
        view 
        validRecoveryRequest(recoveryId) 
        returns (
            address user,
            RecoveryStatus status,
            uint256 currentApprovals,
            uint256 requiredApprovals,
            uint256 expiresAt
        ) 
    {
        RecoveryRequest storage request = recoveryRequests[recoveryId];
        require(
            request.user == msg.sender || 
            guardianAuthorizations[request.user][msg.sender] || 
            msg.sender == owner,
            "Not authorized"
        );

        return (
            request.user,
            request.status,
            request.currentApprovals,
            request.requiredApprovals,
            request.expiresAt
        );
    }

    /**
     * @dev Get user's guardians
     * @param user The user address
     * @return guardians Array of guardian information
     */
    function getUserGuardians(address user) 
        external 
        view 
        returns (Guardian[] memory guardians) 
    {
        require(user == msg.sender || msg.sender == owner, "Not authorized");
        return userGuardians[user];
    }

    /**
     * @dev Get user's recovery requests
     * @param user The user address
     * @return recoveryIds Array of recovery request identifiers
     */
    function getUserRecoveryRequests(address user) 
        external 
        view 
        returns (bytes32[] memory recoveryIds) 
    {
        require(user == msg.sender || msg.sender == owner, "Not authorized");
        return userRecoveryRequests[user];
    }

    /**
     * @dev Cancel pending recovery request
     * @param recoveryId The recovery request identifier
     */
    function cancelRecovery(bytes32 recoveryId) 
        external 
        validRecoveryRequest(recoveryId) 
        onlyRequestOwner(recoveryId) 
        whenNotPaused 
    {
        RecoveryRequest storage request = recoveryRequests[recoveryId];
        require(request.status == RecoveryStatus.Pending, "Recovery not pending");
        
        request.status = RecoveryStatus.Cancelled;
    }

    /**
     * @dev Emergency recovery by admin
     * @param user The user to recover
     * @param newOwner The new owner address
     * @param reason The reason for emergency recovery
     */
    function emergencyRecovery(
        address user,
        address newOwner,
        string calldata reason
    ) 
        external 
        onlyOwner 
        whenNotPaused 
    {
        require(newOwner != address(0), "Invalid new owner");
        
        bytes32 recoveryId = keccak256(abi.encodePacked(
            user,
            newOwner,
            block.timestamp,
            "emergency"
        ));

        emit RecoveryInitiated(user, recoveryId, 0);
        emit RecoveryCompleted(user, recoveryId, block.timestamp);
        emit SecurityAlert(user, 3, reason, block.timestamp);
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

    // Admin functions
    function setRecoveryPeriod(uint256 period) external onlyOwner {
        defaultRecoveryPeriod = period;
    }

    function setGuardianLimits(uint256 minGuard, uint256 maxGuard) external onlyOwner {
        minGuardians = minGuard;
        maxGuardians = maxGuard;
    }

    function pause() external onlyOwner {
        isPaused = true;
    }

    function unpause() external onlyOwner {
        isPaused = false;
    }
}
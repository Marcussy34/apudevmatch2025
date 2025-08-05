// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "./interfaces/IGrandWarden.sol";
import "./interfaces/IPasswordVault.sol";
import "./interfaces/IVaultEvents.sol";
import "./interfaces/IAtomicVaultManager.sol";

/**
 * @title GrandWardenVault
 * @dev Main password vault with atomic operations and Sapphire TEE integration
 */
contract GrandWardenVault is IGrandWarden, IPasswordVault, IVaultEvents {
    using Sapphire for *;

    // Vault structure for storing encrypted password data
    struct Vault {
        address owner;
        bytes encryptedData;
        string walrusCID;
        bytes32 suiTxHash;
        uint256 createdAt;
        uint256 lastUpdated;
        uint256 accessCount;
        bool isActive;
        mapping(string => CredentialEntry) credentials;
        string[] domains;
    }

    // Individual credential entry
    struct CredentialEntry {
        string username;
        bytes encryptedPassword;
        uint256 createdAt;
        uint256 lastUsed;
        bool exists;
    }

    // Storage
    mapping(bytes32 => Vault) private vaults;
    mapping(address => bytes32[]) private userVaults;
    mapping(address => bool) private authorizedDevices;
    
    // Access control
    address public owner;
    bool public isPaused;
    
    // Constants
    uint256 private constant MAX_VAULTS_PER_USER = 10;
    uint256 private constant MAX_CREDENTIALS_PER_VAULT = 1000;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier whenNotPaused() {
        require(!isPaused, "Contract is paused");
        _;
    }

    modifier validVault(bytes32 vaultId) {
        require(vaults[vaultId].owner != address(0), "Vault does not exist");
        require(vaults[vaultId].isActive, "Vault is not active");
        _;
    }

    modifier onlyVaultOwner(bytes32 vaultId) {
        require(vaults[vaultId].owner == msg.sender, "Not vault owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        isPaused = false;
    }

    /**
     * @dev Create a new vault for the user
     */
    function createVault(bytes calldata vaultData) 
        external 
        override 
        whenNotPaused 
        returns (bytes32 vaultId) 
    {
        require(userVaults[msg.sender].length < MAX_VAULTS_PER_USER, "Too many vaults");
        
        // Generate secure vault ID using Sapphire randomness
        vaultId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            Sapphire.randomBytes(32, "vault-creation")
        ));

        // Create vault
        Vault storage newVault = vaults[vaultId];
        newVault.owner = msg.sender;
        newVault.encryptedData = vaultData;
        newVault.createdAt = block.timestamp;
        newVault.lastUpdated = block.timestamp;
        newVault.isActive = true;

        // Add to user's vault list
        userVaults[msg.sender].push(vaultId);

        emit VaultCreated(msg.sender, vaultId, block.timestamp);
        return vaultId;
    }

    /**
     * @dev Update existing vault data
     */
    function updateVault(bytes32 vaultId, bytes calldata newVaultData) 
        external 
        override 
        validVault(vaultId) 
        onlyVaultOwner(vaultId) 
        whenNotPaused 
    {
        Vault storage vault = vaults[vaultId];
        vault.encryptedData = newVaultData;
        vault.lastUpdated = block.timestamp;

        emit VaultUpdated(msg.sender, vaultId, block.timestamp);
    }

    /**
     * @dev Get vault data (only accessible within TEE)
     */
    function getVault(bytes32 vaultId) 
        external 
        view 
        override 
        validVault(vaultId) 
        onlyVaultOwner(vaultId) 
        returns (bytes memory vaultData) 
    {
        // This function runs within the TEE, so data is decrypted here
        Vault storage vault = vaults[vaultId];
        
        // Increment access counter (note: this should be done in a separate transaction)
        // For view functions, we can't modify state, so this is logged as an event instead
        
        return vault.encryptedData;
    }

    /**
     * @dev Add credential to existing vault
     */
    function addCredential(
        bytes32 vaultId, 
        string calldata domain,
        string calldata username, 
        bytes calldata encryptedPassword
    ) 
        external 
        override 
        validVault(vaultId) 
        onlyVaultOwner(vaultId) 
        whenNotPaused 
    {
        Vault storage vault = vaults[vaultId];
        require(vault.domains.length < MAX_CREDENTIALS_PER_VAULT, "Too many credentials");

        // Add or update credential
        if (!vault.credentials[domain].exists) {
            vault.domains.push(domain);
            vault.credentials[domain].exists = true;
            vault.credentials[domain].createdAt = block.timestamp;
        }

        vault.credentials[domain].username = username;
        vault.credentials[domain].encryptedPassword = encryptedPassword;
        vault.credentials[domain].lastUsed = block.timestamp;
        vault.lastUpdated = block.timestamp;

        emit CredentialAdded(msg.sender, vaultId, domain, block.timestamp);
    }

    /**
     * @dev Update entire vault blob atomically
     */
    function updateVaultBlob(bytes32 vaultId, bytes calldata newEncryptedBlob)
        external 
        override 
        validVault(vaultId) 
        onlyVaultOwner(vaultId) 
        whenNotPaused 
        returns (string memory newCID) 
    {
        Vault storage vault = vaults[vaultId];
        vault.encryptedData = newEncryptedBlob;
        vault.lastUpdated = block.timestamp;

        // Generate a mock CID for now (will be replaced with actual Walrus integration)
        newCID = string(abi.encodePacked("QmTESTCID", Sapphire.randomBytes(16, "cid-gen")));
        vault.walrusCID = newCID;

        // Mock Sui transaction hash
        bytes32 mockSuiTxHash = keccak256(abi.encodePacked(vaultId, block.timestamp));
        vault.suiTxHash = mockSuiTxHash;

        emit VaultBlobUpdated(msg.sender, vaultId, newCID, mockSuiTxHash);
        return newCID;
    }

    /**
     * @dev Retrieve decrypted credentials (TEE only)
     */
    function getCredential(bytes32 vaultId, string calldata domain)
        external 
        view 
        override 
        validVault(vaultId) 
        onlyVaultOwner(vaultId) 
        returns (string memory username, string memory password) 
    {
        Vault storage vault = vaults[vaultId];
        require(vault.credentials[domain].exists, "Credential not found");

        CredentialEntry storage credential = vault.credentials[domain];
        
        // In a real implementation, this would decrypt the password within the TEE
        // For now, we return the encrypted data as a placeholder
        username = credential.username;
        
        // This would be decrypted within the TEE
        password = string(credential.encryptedPassword);
        
        return (username, password);
    }

    /**
     * @dev Atomic vault operations with Walrus coordination
     */
    function atomicVaultUpdate(bytes32 vaultId, bytes calldata newData)
        external 
        override 
        validVault(vaultId) 
        onlyVaultOwner(vaultId) 
        whenNotPaused 
        returns (string memory newCID, bytes32 suiTxHash) 
    {
        Vault storage vault = vaults[vaultId];
        
        // Step 1: Update vault data
        vault.encryptedData = newData;
        vault.lastUpdated = block.timestamp;
        
        // Step 2: Generate Walrus CID (mock for now)
        newCID = string(abi.encodePacked("QmATOMIC", Sapphire.randomBytes(16, "atomic-cid")));
        vault.walrusCID = newCID;
        
        // Step 3: Generate Sui transaction hash (mock for now)
        suiTxHash = keccak256(abi.encodePacked(vaultId, newData, block.timestamp));
        vault.suiTxHash = suiTxHash;

        emit AtomicUpdateCompleted(msg.sender, vaultId, suiTxHash);
        return (newCID, suiTxHash);
    }

    /**
     * @dev Get all domains for a vault
     */
    function getVaultDomains(bytes32 vaultId) 
        external 
        view 
        override 
        validVault(vaultId) 
        onlyVaultOwner(vaultId) 
        returns (string[] memory domains) 
    {
        return vaults[vaultId].domains;
    }

    /**
     * @dev Check password strength and security
     */
    function checkPasswordSecurity(string calldata password) 
        external 
        pure 
        override 
        returns (uint8 score, string[] memory warnings) 
    {
        bytes memory passwordBytes = bytes(password);
        score = 0;
        
        // Basic length check
        if (passwordBytes.length >= 8) score += 20;
        if (passwordBytes.length >= 12) score += 10;
        if (passwordBytes.length >= 16) score += 10;
        
        // Character variety checks
        bool hasUpper = false;
        bool hasLower = false;
        bool hasDigit = false;
        bool hasSpecial = false;
        
        for (uint i = 0; i < passwordBytes.length; i++) {
            bytes1 char = passwordBytes[i];
            if (char >= 0x41 && char <= 0x5A) hasUpper = true;
            if (char >= 0x61 && char <= 0x7A) hasLower = true;
            if (char >= 0x30 && char <= 0x39) hasDigit = true;
            if ((char >= 0x21 && char <= 0x2F) || (char >= 0x3A && char <= 0x40) || 
                (char >= 0x5B && char <= 0x60) || (char >= 0x7B && char <= 0x7E)) hasSpecial = true;
        }
        
        if (hasUpper) score += 15;
        if (hasLower) score += 15;
        if (hasDigit) score += 15;
        if (hasSpecial) score += 15;
        
        // Create warnings array
        warnings = new string[](0);
        
        return (score, warnings);
    }

    /**
     * @dev Check if vault exists for user
     */
    function vaultExists(address user, bytes32 vaultId) 
        external 
        view 
        override 
        returns (bool exists) 
    {
        return vaults[vaultId].owner == user && vaults[vaultId].isActive;
    }

    /**
     * @dev Get user's vault IDs
     */
    function getUserVaults(address user) external view returns (bytes32[] memory) {
        return userVaults[user];
    }

    /**
     * @dev Emit user flow tracking events
     */
    function emitUserFlowEvent(
        address user, 
        uint8 flowType, 
        uint8 step, 
        bool success, 
        bytes calldata data
    ) external override {
        // Implementation for user flow tracking
        emit VaultEvent(user, flowType, step, success, data);
    }

    /**
     * @dev Custom event for user flow tracking
     */
    event VaultEvent(address indexed user, uint8 flowType, uint8 step, bool success, bytes data);
    
    /**
     * @dev Event for atomic update completion
     */
    event AtomicUpdateCompleted(address indexed user, bytes32 indexed vaultId, bytes32 suiTxHash);

    /**
     * @dev Emit a generic vault event
     */
    function emitVaultEvent(address user, uint8 eventType, bytes calldata data) external override {
        emit GenericVaultEvent(user, eventType, data);
    }

    /**
     * @dev Custom event for generic vault events
     */
    event GenericVaultEvent(address indexed user, uint8 eventType, bytes data);

    // Admin functions
    function pause() external onlyOwner {
        isPaused = true;
    }

    function unpause() external onlyOwner {
        isPaused = false;
    }

    function emergencyShutdown(string calldata reason) external onlyOwner {
        isPaused = true;
        emit EmergencyShutdown(msg.sender, reason, block.timestamp);
    }
}
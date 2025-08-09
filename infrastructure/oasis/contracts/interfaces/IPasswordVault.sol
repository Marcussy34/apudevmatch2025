// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title IPasswordVault
 * @dev Interface for password vault functionality with atomic operations
 */
interface IPasswordVault {
    // Events for user flow
    event CredentialAdded(address indexed user, bytes32 indexed vaultId, string domain, uint256 timestamp);
    // Note: VaultBlobUpdated and BreachAlert are declared in IVaultEvents

    /**
     * @dev Add credential to existing vault
     * @param vaultId The vault identifier
     * @param domain The website domain
     * @param username The username for the credential
     * @param encryptedPassword The encrypted password data
     */
    function addCredential(
        bytes32 vaultId, 
        string calldata domain,
        string calldata username, 
        bytes calldata encryptedPassword
    ) external;

    /**
     * @dev Update entire vault blob atomically
     * @param vaultId The vault identifier
     * @param newEncryptedBlob The new encrypted vault blob
     * @return newCID The new content identifier from Walrus
     */
    function updateVaultBlob(bytes32 vaultId, bytes calldata newEncryptedBlob)
        external returns (string memory newCID);

    /**
     * @dev Retrieve decrypted credentials (TEE only)
     * @param vaultId The vault identifier
     * @param domain The website domain
     * @return username The username for the credential
     * @return password The decrypted password
     */
    function getCredential(bytes32 vaultId, string calldata domain)
        external view returns (string memory username, string memory password);

    /**
     * @dev Atomic vault operations with Walrus coordination
     * @param vaultId The vault identifier
     * @param newData The new vault data
     * @return newCID The new content identifier from Walrus
     * @return suiTxHash The Sui transaction hash for coordination
     */
    function atomicVaultUpdate(bytes32 vaultId, bytes calldata newData)
        external returns (string memory newCID, bytes32 suiTxHash);

    /**
     * @dev Get all domains for a vault
     * @param vaultId The vault identifier
     * @return domains List of domains in the vault
     */
    function getVaultDomains(bytes32 vaultId) external view returns (string[] memory domains);

    /**
     * @dev Check password strength and security
     * @param password The password to check
     * @return score Security score (0-100)
     * @return warnings Security warnings
     */
    function checkPasswordSecurity(string calldata password) 
        external pure returns (uint8 score, string[] memory warnings);
}
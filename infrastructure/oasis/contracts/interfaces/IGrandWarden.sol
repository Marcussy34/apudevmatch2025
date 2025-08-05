// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title IGrandWarden
 * @dev Main interface for Grand Warden vault system
 */
interface IGrandWarden {
    // Events for The Graph indexing
    event VaultCreated(address indexed user, bytes32 indexed vaultId, uint256 timestamp);
    event VaultUpdated(address indexed user, bytes32 indexed vaultId, uint256 timestamp);
    event VaultAccessed(address indexed user, bytes32 indexed vaultId, uint256 timestamp);

    /**
     * @dev Create a new vault for the user
     * @param vaultData Encrypted vault data
     * @return vaultId The unique identifier for the created vault
     */
    function createVault(bytes calldata vaultData) external returns (bytes32 vaultId);

    /**
     * @dev Update existing vault data
     * @param vaultId The vault identifier
     * @param newVaultData New encrypted vault data
     */
    function updateVault(bytes32 vaultId, bytes calldata newVaultData) external;

    /**
     * @dev Get vault data (only accessible within TEE)
     * @param vaultId The vault identifier
     * @return vaultData The decrypted vault data
     */
    function getVault(bytes32 vaultId) external view returns (bytes memory vaultData);

    /**
     * @dev Check if vault exists for user
     * @param user The user address
     * @param vaultId The vault identifier
     * @return exists Whether the vault exists
     */
    function vaultExists(address user, bytes32 vaultId) external view returns (bool exists);
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IMultiChainRPC.sol";

/**
 * @title IWalletVault
 * @dev Interface for Web3 wallet management with multi-chain support
 */
interface IWalletVault {

    // Events for user flow - TransactionSigned is declared in IVaultEvents
    event WalletImported(address indexed user, bytes32 indexed walletId, string name, uint256 timestamp);
    event BalancesFetched(address indexed user, bytes32 indexed walletId, uint256 totalValue);

    /**
     * @dev Import seed phrase and create wallet
     * @param encryptedSeed The encrypted seed phrase
     * @param walletName The name for the wallet
     * @return walletId The unique identifier for the wallet
     */
    function importSeedPhrase(bytes calldata encryptedSeed, string calldata walletName)
        external returns (bytes32 walletId);

    /**
     * @dev Derive keys from seed for multiple chains
     * @param walletId The wallet identifier
     * @param chainTypes Array of chain type identifiers
     * @return addresses Array of derived addresses
     */
    function deriveKeysFromSeed(bytes32 walletId, uint8[] calldata chainTypes)
        external returns (address[] memory addresses);

    /**
     * @dev Fetch wallet balances across multiple chains within TEE
     * @param walletId The wallet identifier
     * @return balances Array of chain balances
     */
    function fetchWalletBalances(bytes32 walletId)
        external view returns (IMultiChainRPC.ChainBalance[] memory balances);

    /**
     * @dev Sign transaction securely within TEE
     * @param walletId The wallet identifier
     * @param chainType The target chain type
     * @param txHash The transaction hash to sign
     * @param txData The transaction data
     * @return signature The generated signature
     */
    function signTransaction(bytes32 walletId, uint8 chainType, bytes32 txHash, bytes calldata txData)
        external returns (bytes memory signature);

    /**
     * @dev Update wallet metadata
     * @param walletId The wallet identifier
     * @param name The new wallet name
     * @param isActive Whether the wallet is active
     */
    function updateWalletMetadata(bytes32 walletId, string calldata name, bool isActive) external;

    /**
     * @dev Get wallet information
     * @param walletId The wallet identifier
     * @return name The wallet name
     * @return chainTypes Supported chain types
     * @return isActive Whether the wallet is active
     */
    function getWalletInfo(bytes32 walletId) 
        external view returns (string memory name, uint8[] memory chainTypes, bool isActive);

    /**
     * @dev Get derived address for specific chain
     * @param walletId The wallet identifier
     * @param chainType The chain type
     * @return derivedAddress The derived address for the chain
     */
    function getDerivedAddress(bytes32 walletId, uint8 chainType) 
        external view returns (address derivedAddress);
}
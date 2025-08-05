// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title IMultiChainRPC
 * @dev Interface for multi-chain RPC operations within Sapphire TEE
 */
interface IMultiChainRPC {
    struct ChainBalance {
        uint8 chainType;      // 1=Ethereum, 2=Polygon, 3=BSC, etc.
        string tokenSymbol;   // ETH, MATIC, BNB, etc.
        uint256 balance;      // Balance in wei
        uint256 usdValue;     // USD value (optional)
    }

    struct ChainConfig {
        uint8 chainType;
        string name;
        string rpcUrl;
        uint256 chainId;
        bool isActive;
    }

    // Events
    event ChainConfigUpdated(uint8 indexed chainType, string rpcUrl);
    event BalanceFetched(address indexed wallet, uint8 indexed chainType, uint256 balance);

    /**
     * @dev Fetch balances for specific address across multiple chains
     * @param wallet The wallet address
     * @param chains Array of chain types to query
     * @return balances Array of chain balances
     */
    function getMultiChainBalances(address wallet, uint8[] calldata chains)
        external view returns (ChainBalance[] memory balances);

    /**
     * @dev Execute RPC call to specific chain
     * @param chainType The target chain type
     * @param method The RPC method to call
     * @param params The RPC parameters
     * @return result The RPC call result
     */
    function executeChainRPC(uint8 chainType, string calldata method, bytes calldata params)
        external view returns (bytes memory result);

    /**
     * @dev Update RPC endpoints for chains
     * @param chainType The chain type identifier
     * @param rpcUrl The new RPC URL
     */
    function updateChainRPC(uint8 chainType, string calldata rpcUrl) external;

    /**
     * @dev Get chain configuration
     * @param chainType The chain type
     * @return config The chain configuration
     */
    function getChainConfig(uint8 chainType) external view returns (ChainConfig memory config);

    /**
     * @dev Get all supported chains
     * @return configs Array of all chain configurations
     */
    function getAllChains() external view returns (ChainConfig[] memory configs);

    /**
     * @dev Fetch native token balance for address on specific chain
     * @param wallet The wallet address
     * @param chainType The chain type
     * @return balance The native token balance
     */
    function getNativeBalance(address wallet, uint8 chainType) 
        external view returns (uint256 balance);

    /**
     * @dev Batch fetch balances for multiple addresses and chains
     * @param wallets Array of wallet addresses
     * @param chainTypes Array of chain types
     * @return balances 2D array of balances [wallet][chain]
     */
    function batchGetBalances(address[] calldata wallets, uint8[] calldata chainTypes)
        external view returns (uint256[][] memory balances);
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "./interfaces/IMultiChainRPC.sol";
import "./interfaces/IVaultEvents.sol";

/**
 * @title MultiChainRPC
 * @dev Multi-chain balance and RPC integration within Sapphire TEE
 */
contract MultiChainRPC is IMultiChainRPC, IVaultEvents {
    using Sapphire for *;

    // RPC endpoint structure
    struct RPCEndpoint {
        string url;
        uint256 maxRetries;
        uint256 timeoutMs;
        bool isActive;
        uint256 lastUsed;
        uint256 successCount;
        uint256 failureCount;
    }

    // Price feed structure for USD conversion
    struct PriceFeed {
        uint256 price;
        uint256 lastUpdated;
        string source;
        bool isActive;
    }

    // Storage
    mapping(uint8 => ChainConfig) private chainConfigs;
    mapping(uint8 => RPCEndpoint[]) private chainEndpoints;
    mapping(uint8 => PriceFeed) private priceFeeds;
    uint8[] private supportedChainTypes;
    
    // Cache for balances (to avoid excessive RPC calls)
    mapping(address => mapping(uint8 => uint256)) private balanceCache;
    mapping(address => mapping(uint8 => uint256)) private cacheTimestamps;
    
    // Access control
    address public owner;
    bool public isPaused;
    
    // Configuration
    uint256 public cacheExpiry = 300; // 5 minutes
    uint256 public defaultTimeout = 10000; // 10 seconds
    uint256 public maxRetries = 3;

    // Chain type constants
    uint8 private constant ETHEREUM_CHAIN = 1;
    uint8 private constant POLYGON_CHAIN = 2;
    uint8 private constant BSC_CHAIN = 3;
    uint8 private constant ARBITRUM_CHAIN = 4;
    uint8 private constant OPTIMISM_CHAIN = 5;

    // Events - only declare events not in interfaces
    event RPCCallExecuted(uint8 indexed chainType, string method, bool success);
    event PriceFeedUpdated(uint8 indexed chainType, uint256 newPrice);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier whenNotPaused() {
        require(!isPaused, "Contract is paused");
        _;
    }

    modifier validChain(uint8 chainType) {
        require(chainConfigs[chainType].isActive, "Chain not supported");
        _;
    }

    constructor() {
        owner = msg.sender;
        isPaused = false;
        _initializeChains();
    }

    /**
     * @dev Initialize default chain configurations
     */
    function _initializeChains() private {
        // Ethereum Mainnet
        _addChainConfig(ETHEREUM_CHAIN, "Ethereum", "https://eth.llamarpc.com", 1);
        _addRPCEndpoint(ETHEREUM_CHAIN, "https://rpc.ankr.com/eth");
        _addRPCEndpoint(ETHEREUM_CHAIN, "https://ethereum.publicnode.com");
        
        // Polygon
        _addChainConfig(POLYGON_CHAIN, "Polygon", "https://polygon.llamarpc.com", 137);
        _addRPCEndpoint(POLYGON_CHAIN, "https://rpc.ankr.com/polygon");
        _addRPCEndpoint(POLYGON_CHAIN, "https://polygon-rpc.com");
        
        // BSC
        _addChainConfig(BSC_CHAIN, "BSC", "https://bsc.llamarpc.com", 56);
        _addRPCEndpoint(BSC_CHAIN, "https://rpc.ankr.com/bsc");
        _addRPCEndpoint(BSC_CHAIN, "https://bsc-dataseed.binance.org");
        
        // Arbitrum
        _addChainConfig(ARBITRUM_CHAIN, "Arbitrum", "https://arb1.arbitrum.io/rpc", 42161);
        _addRPCEndpoint(ARBITRUM_CHAIN, "https://rpc.ankr.com/arbitrum");
        
        // Optimism
        _addChainConfig(OPTIMISM_CHAIN, "Optimism", "https://mainnet.optimism.io", 10);
        _addRPCEndpoint(OPTIMISM_CHAIN, "https://rpc.ankr.com/optimism");

        // Initialize mock price feeds
        _updatePriceFeed(ETHEREUM_CHAIN, 3000e18, "coingecko");
        _updatePriceFeed(POLYGON_CHAIN, 1e18, "coingecko");
        _updatePriceFeed(BSC_CHAIN, 300e18, "coingecko");
        _updatePriceFeed(ARBITRUM_CHAIN, 3000e18, "coingecko");
        _updatePriceFeed(OPTIMISM_CHAIN, 3000e18, "coingecko");
    }

    /**
     * @dev Add chain configuration
     */
    function _addChainConfig(uint8 chainType, string memory name, string memory rpcUrl, uint256 chainId) private {
        chainConfigs[chainType] = ChainConfig({
            chainType: chainType,
            name: name,
            rpcUrl: rpcUrl,
            chainId: chainId,
            isActive: true
        });
        supportedChainTypes.push(chainType);
    }

    /**
     * @dev Add RPC endpoint for a chain
     */
    function _addRPCEndpoint(uint8 chainType, string memory url) private {
        chainEndpoints[chainType].push(RPCEndpoint({
            url: url,
            maxRetries: maxRetries,
            timeoutMs: defaultTimeout,
            isActive: true,
            lastUsed: 0,
            successCount: 0,
            failureCount: 0
        }));
    }

    /**
     * @dev Update price feed
     */
    function _updatePriceFeed(uint8 chainType, uint256 price, string memory source) private {
        priceFeeds[chainType] = PriceFeed({
            price: price,
            lastUpdated: block.timestamp,
            source: source,
            isActive: true
        });
    }

    /**
     * @dev Fetch balances for specific address across multiple chains
     */
    function getMultiChainBalances(address wallet, uint8[] calldata chains)
        external 
        view 
        override 
        whenNotPaused 
        returns (ChainBalance[] memory balances) 
    {
        balances = new ChainBalance[](chains.length);
        
        for (uint i = 0; i < chains.length; i++) {
            uint8 chainType = chains[i];
            require(chainConfigs[chainType].isActive, "Chain not supported");
            
            uint256 balance = _getBalanceFromCache(wallet, chainType);
            if (balance == 0) {
                balance = _fetchBalanceViaRPC(wallet, chainType);
            }
            
            balances[i] = ChainBalance({
                chainType: chainType,
                tokenSymbol: _getChainTokenSymbol(chainType),
                balance: balance,
                usdValue: _calculateUSDValue(chainType, balance)
            });
        }
        
        return balances;
    }

    /**
     * @dev Execute RPC call to specific chain
     */
    function executeChainRPC(uint8 chainType, string calldata method, bytes calldata params)
        external 
        view 
        override 
        validChain(chainType) 
        whenNotPaused 
        returns (bytes memory result) 
    {
        // In a real implementation, this would make actual RPC calls within the TEE
        // For now, we simulate based on the method
        
        if (keccak256(bytes(method)) == keccak256(bytes("eth_getBalance"))) {
            // Simulate balance query
            address wallet = abi.decode(params, (address));
            uint256 balance = _fetchBalanceViaRPC(wallet, chainType);
            result = abi.encode(balance);
        } else if (keccak256(bytes(method)) == keccak256(bytes("eth_getTransactionCount"))) {
            // Simulate nonce query
            result = abi.encode(uint256(42)); // Mock nonce
        } else if (keccak256(bytes(method)) == keccak256(bytes("eth_gasPrice"))) {
            // Simulate gas price
            uint256 gasPrice = _getMockGasPrice(chainType);
            result = abi.encode(gasPrice);
        } else {
            // Generic RPC response
            result = abi.encode("success", method, params);
        }
        
        return result;
    }

    /**
     * @dev Update RPC endpoints for chains
     */
    function updateChainRPC(uint8 chainType, string calldata rpcUrl) 
        external 
        override 
        onlyOwner 
        validChain(chainType) 
    {
        chainConfigs[chainType].rpcUrl = rpcUrl;
        emit ChainConfigUpdated(chainType, rpcUrl);
    }

    /**
     * @dev Get chain configuration
     */
    function getChainConfig(uint8 chainType) 
        external 
        view 
        override 
        returns (ChainConfig memory config) 
    {
        return chainConfigs[chainType];
    }

    /**
     * @dev Get all supported chains
     */
    function getAllChains() 
        external 
        view 
        override 
        returns (ChainConfig[] memory configs) 
    {
        configs = new ChainConfig[](supportedChainTypes.length);
        for (uint i = 0; i < supportedChainTypes.length; i++) {
            configs[i] = chainConfigs[supportedChainTypes[i]];
        }
        return configs;
    }

    /**
     * @dev Fetch native token balance for address on specific chain
     */
    function getNativeBalance(address wallet, uint8 chainType) 
        external 
        view 
        override 
        validChain(chainType) 
        returns (uint256 balance) 
    {
        // Check cache first
        balance = _getBalanceFromCache(wallet, chainType);
        if (balance == 0) {
            balance = _fetchBalanceViaRPC(wallet, chainType);
        }
        
        return balance;
    }

    /**
     * @dev Batch fetch balances for multiple addresses and chains
     */
    function batchGetBalances(address[] calldata wallets, uint8[] calldata chainTypes)
        external 
        view 
        override 
        returns (uint256[][] memory balances) 
    {
        balances = new uint256[][](wallets.length);
        
        for (uint i = 0; i < wallets.length; i++) {
            balances[i] = new uint256[](chainTypes.length);
            for (uint j = 0; j < chainTypes.length; j++) {
                require(chainConfigs[chainTypes[j]].isActive, "Chain not supported");
                balances[i][j] = _fetchBalanceViaRPC(wallets[i], chainTypes[j]);
            }
        }
        
        return balances;
    }

    /**
     * @dev Add new RPC endpoint for a chain
     */
    function addRPCEndpoint(uint8 chainType, string calldata url) 
        external 
        onlyOwner 
        validChain(chainType) 
    {
        chainEndpoints[chainType].push(RPCEndpoint({
            url: url,
            maxRetries: maxRetries,
            timeoutMs: defaultTimeout,
            isActive: true,
            lastUsed: 0,
            successCount: 0,
            failureCount: 0
        }));
    }

    /**
     * @dev Remove RPC endpoint
     */
    function removeRPCEndpoint(uint8 chainType, uint256 endpointIndex) 
        external 
        onlyOwner 
        validChain(chainType) 
    {
        require(endpointIndex < chainEndpoints[chainType].length, "Invalid endpoint index");
        chainEndpoints[chainType][endpointIndex].isActive = false;
    }

    /**
     * @dev Update price feed for chain
     */
    function updatePriceFeed(uint8 chainType, uint256 price, string calldata source) 
        external 
        onlyOwner 
        validChain(chainType) 
    {
        priceFeeds[chainType] = PriceFeed({
            price: price,
            lastUpdated: block.timestamp,
            source: source,
            isActive: true
        });
        
        emit PriceFeedUpdated(chainType, price);
    }

    /**
     * @dev Get RPC endpoints for a chain
     */
    function getChainEndpoints(uint8 chainType) 
        external 
        view 
        validChain(chainType) 
        returns (RPCEndpoint[] memory endpoints) 
    {
        return chainEndpoints[chainType];
    }

    // Internal helper functions

    /**
     * @dev Get balance from cache if not expired
     */
    function _getBalanceFromCache(address wallet, uint8 chainType) 
        private 
        view 
        returns (uint256) 
    {
        uint256 cacheTime = cacheTimestamps[wallet][chainType];
        if (cacheTime > 0 && block.timestamp - cacheTime < cacheExpiry) {
            return balanceCache[wallet][chainType];
        }
        return 0;
    }

    /**
     * @dev Fetch balance via RPC (simulated)
     */
    function _fetchBalanceViaRPC(address wallet, uint8 chainType) 
        private 
        view 
        returns (uint256) 
    {
        // Mock balance based on wallet address and chain
        uint256 mockBalance = uint256(keccak256(abi.encodePacked(
            wallet,
            chainType,
            block.timestamp / 3600 // Update hourly
        ))) % (10 ether);
        
        return mockBalance;
    }

    /**
     * @dev Calculate USD value for native token
     */
    function _calculateUSDValue(uint8 chainType, uint256 balance) 
        private 
        view 
        returns (uint256) 
    {
        PriceFeed memory feed = priceFeeds[chainType];
        if (feed.isActive && feed.price > 0) {
            return balance * feed.price / 1e18;
        }
        return 0;
    }

    /**
     * @dev Get chain token symbol
     */
    function _getChainTokenSymbol(uint8 chainType) private pure returns (string memory) {
        if (chainType == ETHEREUM_CHAIN) return "ETH";
        if (chainType == POLYGON_CHAIN) return "MATIC";
        if (chainType == BSC_CHAIN) return "BNB";
        if (chainType == ARBITRUM_CHAIN) return "ETH";
        if (chainType == OPTIMISM_CHAIN) return "ETH";
        return "UNKNOWN";
    }

    /**
     * @dev Get mock gas price for chain
     */
    function _getMockGasPrice(uint8 chainType) private pure returns (uint256) {
        if (chainType == ETHEREUM_CHAIN) return 20 gwei;
        if (chainType == POLYGON_CHAIN) return 30 gwei;
        if (chainType == BSC_CHAIN) return 5 gwei;
        if (chainType == ARBITRUM_CHAIN) return 1 gwei;
        if (chainType == OPTIMISM_CHAIN) return 1 gwei;
        return 10 gwei;
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
    function setCacheExpiry(uint256 expiry) external onlyOwner {
        cacheExpiry = expiry;
    }

    function setDefaultTimeout(uint256 timeout) external onlyOwner {
        defaultTimeout = timeout;
    }

    function setMaxRetries(uint256 retries) external onlyOwner {
        maxRetries = retries;
    }

    function pause() external onlyOwner {
        isPaused = true;
    }

    function unpause() external onlyOwner {
        isPaused = false;
    }

    /**
     * @dev Emergency update balance cache
     */
    function updateBalanceCache(address wallet, uint8 chainType, uint256 balance) 
        external 
        onlyOwner 
    {
        balanceCache[wallet][chainType] = balance;
        cacheTimestamps[wallet][chainType] = block.timestamp;
        emit BalanceFetched(wallet, chainType, balance);
    }
}
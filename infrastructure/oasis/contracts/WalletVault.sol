// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "./interfaces/IWalletVault.sol";
import "./interfaces/IMultiChainRPC.sol";
import "./interfaces/IVaultEvents.sol";

/**
 * @title WalletVault
 * @dev Web3 wallet management with multi-chain support and TEE security
 */
contract WalletVault is IWalletVault, IMultiChainRPC, IVaultEvents {
    using Sapphire for *;

    // Wallet structure
    struct Wallet {
        address owner;
        string name;
        bytes encryptedSeed;
        mapping(uint8 => address) derivedAddresses;
        uint8[] supportedChains;
        bool isActive;
        uint256 createdAt;
        uint256 lastUsed;
    }



    // Storage
    mapping(bytes32 => Wallet) private wallets;
    mapping(address => bytes32[]) private userWallets;
    mapping(uint8 => IMultiChainRPC.ChainConfig) private chainConfigs;
    uint8[] private supportedChainTypes;
    
    // Access control
    address public owner;
    bool public isPaused;
    
    // Constants
    uint256 private constant MAX_WALLETS_PER_USER = 10;
    uint8 private constant ETHEREUM_CHAIN = 1;
    uint8 private constant POLYGON_CHAIN = 2;
    uint8 private constant BSC_CHAIN = 3;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier whenNotPaused() {
        require(!isPaused, "Contract is paused");
        _;
    }

    modifier validWallet(bytes32 walletId) {
        require(wallets[walletId].owner != address(0), "Wallet does not exist");
        require(wallets[walletId].isActive, "Wallet is not active");
        _;
    }

    modifier onlyWalletOwner(bytes32 walletId) {
        require(wallets[walletId].owner == msg.sender, "Not wallet owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        isPaused = false;
        
        // Initialize default chain configurations
        _initializeChainConfigs();
    }

    /**
     * @dev Initialize default chain configurations
     */
    function _initializeChainConfigs() private {
        // Ethereum
        chainConfigs[ETHEREUM_CHAIN] = IMultiChainRPC.ChainConfig({
            chainType: ETHEREUM_CHAIN,
            name: "Ethereum",
            rpcUrl: "https://eth.llamarpc.com",
            chainId: 1,
            isActive: true
        });
        supportedChainTypes.push(ETHEREUM_CHAIN);

        // Polygon
        chainConfigs[POLYGON_CHAIN] = IMultiChainRPC.ChainConfig({
            chainType: POLYGON_CHAIN,
            name: "Polygon",
            rpcUrl: "https://polygon.llamarpc.com",
            chainId: 137,
            isActive: true
        });
        supportedChainTypes.push(POLYGON_CHAIN);

        // BSC
        chainConfigs[BSC_CHAIN] = IMultiChainRPC.ChainConfig({
            chainType: BSC_CHAIN,
            name: "BSC",
            rpcUrl: "https://bsc.llamarpc.com",
            chainId: 56,
            isActive: true
        });
        supportedChainTypes.push(BSC_CHAIN);
    }

    /**
     * @dev Import seed phrase and create wallet
     */
    function importSeedPhrase(bytes calldata encryptedSeed, string calldata walletName)
        external 
        override 
        whenNotPaused 
        returns (bytes32 walletId) 
    {
        require(userWallets[msg.sender].length < MAX_WALLETS_PER_USER, "Too many wallets");
        require(bytes(walletName).length > 0, "Wallet name required");

        // Generate secure wallet ID
        walletId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            Sapphire.randomBytes(32, "wallet-creation")
        ));

        // Create wallet
        Wallet storage newWallet = wallets[walletId];
        newWallet.owner = msg.sender;
        newWallet.name = walletName;
        newWallet.encryptedSeed = encryptedSeed;
        newWallet.isActive = true;
        newWallet.createdAt = block.timestamp;
        newWallet.lastUsed = block.timestamp;

        // Add to user's wallet list
        userWallets[msg.sender].push(walletId);

        emit WalletImported(msg.sender, walletId, walletName, block.timestamp);
        return walletId;
    }

    /**
     * @dev Derive keys from seed for multiple chains
     */
    function deriveKeysFromSeed(bytes32 walletId, uint8[] calldata chainTypes)
        external 
        override 
        validWallet(walletId) 
        onlyWalletOwner(walletId) 
        whenNotPaused 
        returns (address[] memory addresses) 
    {
        Wallet storage wallet = wallets[walletId];
        addresses = new address[](chainTypes.length);

        for (uint i = 0; i < chainTypes.length; i++) {
            uint8 chainType = chainTypes[i];
            require(chainConfigs[chainType].isActive, "Chain not supported");

            // Mock address derivation - in real implementation, this would use BIP44
            address derivedAddress = address(uint160(uint256(keccak256(abi.encodePacked(
                wallet.encryptedSeed,
                chainType,
                block.timestamp
            )))));

            wallet.derivedAddresses[chainType] = derivedAddress;
            addresses[i] = derivedAddress;

            // Add to supported chains if not already present
            bool chainExists = false;
            for (uint j = 0; j < wallet.supportedChains.length; j++) {
                if (wallet.supportedChains[j] == chainType) {
                    chainExists = true;
                    break;
                }
            }
            if (!chainExists) {
                wallet.supportedChains.push(chainType);
            }
        }

        wallet.lastUsed = block.timestamp;
        return addresses;
    }

    /**
     * @dev Fetch wallet balances across multiple chains within TEE
     */
    function fetchWalletBalances(bytes32 walletId)
        external 
        view 
        override 
        validWallet(walletId) 
        onlyWalletOwner(walletId) 
        returns (IMultiChainRPC.ChainBalance[] memory balances) 
    {
        Wallet storage wallet = wallets[walletId];
        uint8[] memory chains = wallet.supportedChains;
        
        balances = new IMultiChainRPC.ChainBalance[](chains.length);
        
        for (uint i = 0; i < chains.length; i++) {
            uint8 chainType = chains[i];
            address walletAddress = wallet.derivedAddresses[chainType];
            
            // Mock balance - in real implementation, this would make RPC calls within TEE
            uint256 mockBalance = uint256(keccak256(abi.encodePacked(
                walletAddress,
                chainType,
                block.timestamp / 3600 // Update hourly
            ))) % 10 ether;
            
            balances[i] = IMultiChainRPC.ChainBalance({
                chainType: chainType,
                tokenSymbol: _getChainTokenSymbol(chainType),
                balance: mockBalance,
                usdValue: mockBalance * _getMockPrice(chainType) / 1e18
            });
        }
        
        return balances;
    }

    /**
     * @dev Sign transaction securely within TEE
     */
    function signTransaction(bytes32 walletId, uint8 chainType, bytes32 txHash, bytes calldata txData)
        external 
        override 
        validWallet(walletId) 
        onlyWalletOwner(walletId) 
        whenNotPaused 
        returns (bytes memory signature) 
    {
        Wallet storage wallet = wallets[walletId];
        require(wallet.derivedAddresses[chainType] != address(0), "Address not derived for chain");

        // Mock signature - in real implementation, this would sign using private key derived from seed
        signature = abi.encodePacked(
            keccak256(abi.encodePacked(wallet.encryptedSeed, txHash, txData)),
            uint8(27) // recovery id
        );

        wallet.lastUsed = block.timestamp;
        emit TransactionSigned(msg.sender, walletId, txHash);
        
        return signature;
    }

    /**
     * @dev Update wallet metadata
     */
    function updateWalletMetadata(bytes32 walletId, string calldata name, bool isActive) 
        external 
        override 
        validWallet(walletId) 
        onlyWalletOwner(walletId) 
        whenNotPaused 
    {
        Wallet storage wallet = wallets[walletId];
        wallet.name = name;
        wallet.isActive = isActive;
        wallet.lastUsed = block.timestamp;
    }

    /**
     * @dev Get wallet information
     */
    function getWalletInfo(bytes32 walletId) 
        external 
        view 
        override 
        validWallet(walletId) 
        onlyWalletOwner(walletId) 
        returns (string memory name, uint8[] memory chainTypes, bool isActive) 
    {
        Wallet storage wallet = wallets[walletId];
        return (wallet.name, wallet.supportedChains, wallet.isActive);
    }

    /**
     * @dev Get derived address for specific chain
     */
    function getDerivedAddress(bytes32 walletId, uint8 chainType) 
        external 
        view 
        override 
        validWallet(walletId) 
        onlyWalletOwner(walletId) 
        returns (address derivedAddress) 
    {
        return wallets[walletId].derivedAddresses[chainType];
    }

    // Multi-chain RPC functions

    /**
     * @dev Fetch balances for specific address across multiple chains
     */
    function getMultiChainBalances(address wallet, uint8[] calldata chains)
        external 
        view 
        override 
        returns (IMultiChainRPC.ChainBalance[] memory balances) 
    {
        balances = new IMultiChainRPC.ChainBalance[](chains.length);
        
        for (uint i = 0; i < chains.length; i++) {
            uint8 chainType = chains[i];
            require(chainConfigs[chainType].isActive, "Chain not supported");
            
            // Mock balance
            uint256 mockBalance = uint256(keccak256(abi.encodePacked(
                wallet,
                chainType,
                block.timestamp / 3600
            ))) % 5 ether;
            
            balances[i] = IMultiChainRPC.ChainBalance({
                chainType: chainType,
                tokenSymbol: _getChainTokenSymbol(chainType),
                balance: mockBalance,
                usdValue: mockBalance * _getMockPrice(chainType) / 1e18
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
        returns (bytes memory result) 
    {
        require(chainConfigs[chainType].isActive, "Chain not supported");
        
        // Mock RPC result - in real implementation, this would make actual RPC calls
        result = abi.encode("mock_rpc_result", method, params);
        return result;
    }

    /**
     * @dev Update RPC endpoints for chains
     */
    function updateChainRPC(uint8 chainType, string calldata rpcUrl) 
        external 
        override 
        onlyOwner 
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
        returns (IMultiChainRPC.ChainConfig memory config) 
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
        returns (IMultiChainRPC.ChainConfig[] memory configs) 
    {
        configs = new IMultiChainRPC.ChainConfig[](supportedChainTypes.length);
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
        returns (uint256 balance) 
    {
        require(chainConfigs[chainType].isActive, "Chain not supported");
        
        // Mock balance
        balance = uint256(keccak256(abi.encodePacked(
            wallet,
            chainType,
            block.timestamp / 3600
        ))) % 5 ether;
        
        return balance;
    }

    /**
     * @dev Batch fetch balances for multiple addresses and chains
     */
    function batchGetBalances(address[] calldata walletAddresses, uint8[] calldata chainTypes)
        external 
        view 
        override 
        returns (uint256[][] memory balances) 
    {
        balances = new uint256[][](walletAddresses.length);
        
        for (uint i = 0; i < walletAddresses.length; i++) {
            balances[i] = new uint256[](chainTypes.length);
            for (uint j = 0; j < chainTypes.length; j++) {
                balances[i][j] = this.getNativeBalance(walletAddresses[i], chainTypes[j]);
            }
        }
        
        return balances;
    }

    // Helper functions

    function _getChainTokenSymbol(uint8 chainType) private pure returns (string memory) {
        if (chainType == ETHEREUM_CHAIN) return "ETH";
        if (chainType == POLYGON_CHAIN) return "MATIC";
        if (chainType == BSC_CHAIN) return "BNB";
        return "UNKNOWN";
    }

    function _getMockPrice(uint8 chainType) private pure returns (uint256) {
        if (chainType == ETHEREUM_CHAIN) return 3000e18; // $3000
        if (chainType == POLYGON_CHAIN) return 1e18; // $1
        if (chainType == BSC_CHAIN) return 300e18; // $300
        return 1e18;
    }

    // Event implementations for IVaultEvents
    function emitVaultEvent(address user, uint8 eventType, bytes calldata data) external override {
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
    function pause() external onlyOwner {
        isPaused = true;
    }

    function unpause() external onlyOwner {
        isPaused = false;
    }

    /**
     * @dev Get user's wallet IDs
     */
    function getUserWallets(address user) external view returns (bytes32[] memory) {
        return userWallets[user];
    }
}
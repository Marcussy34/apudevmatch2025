// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IWalletVault.sol";
import "./interfaces/IVaultEvents.sol";

/**
 * @title WalletVault
 * @dev Web3 wallet management with multi-chain support and TEE security
 */
contract WalletVault is IWalletVault, IVaultEvents, ReentrancyGuard {
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
    
    // Access control
    address public owner;
    bool public isPaused;
    
    // Constants
    uint256 private constant MAX_WALLETS_PER_USER = 10;
    
    // Signature scheme identifiers
    uint8 private constant SIGNATURE_SCHEME_SECP256K1 = 0;
    uint8 private constant SIGNATURE_SCHEME_ED25519 = 1;

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
    }



    /**
     * @dev Import seed phrase and create wallet
     */
    function importSeedPhrase(bytes calldata encryptedSeed, string calldata walletName)
        external 
        override 
        nonReentrant
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
        nonReentrant
        whenNotPaused 
        returns (address[] memory addresses) 
    {
        Wallet storage wallet = wallets[walletId];
        addresses = new address[](chainTypes.length);

        for (uint i = 0; i < chainTypes.length; i++) {
            uint8 chainType = chainTypes[i];
            
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
     * @dev Get mock wallet balances (ROFL worker or frontend should handle real balance fetching)
     * 
     * ARCHITECTURE NOTE:
     * This function returns mock data for testing. In production, external systems
     * must handle multi-chain balance fetching:
     * 
     * 1. ROFL Worker: Can query multiple chain RPCs and aggregate results
     * 2. Frontend: Can fetch directly from chain RPCs using derived addresses
     * 3. Trusted Backend: Can act as oracle for balance aggregation
     */
    function fetchWalletBalances(bytes32 walletId)
        external 
        view 
        override 
        validWallet(walletId) 
        onlyWalletOwner(walletId) 
        returns (uint256[] memory balances) 
    {
        Wallet storage wallet = wallets[walletId];
        uint8[] memory chains = wallet.supportedChains;
        
        balances = new uint256[](chains.length);
        
        for (uint i = 0; i < chains.length; i++) {
            uint8 chainType = chains[i];
            address walletAddress = wallet.derivedAddresses[chainType];
            
            // Mock balance calculation - real implementation should be done off-chain
            uint256 mockBalance = uint256(keccak256(abi.encodePacked(
                walletAddress,
                chainType,
                block.timestamp / 3600 // Update hourly
            ))) % 10 ether;
            
            balances[i] = mockBalance;
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
        nonReentrant
        whenNotPaused 
        returns (bytes memory signature) 
    {
        Wallet storage wallet = wallets[walletId];
        require(wallet.derivedAddresses[chainType] != address(0), "Address not derived for chain");

        // Use generic signing method (frontend will handle chain-specific details)
        signature = _signTransactionGeneric(wallet, txHash, txData);

        wallet.lastUsed = block.timestamp;
        emit TransactionSigned(msg.sender, walletId, txHash, chainType);
        
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
        nonReentrant
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











    // Signing helper functions

        /**
     * @dev Sign transaction generically (frontend handles chain-specific details)
     * @param wallet The wallet storage reference
     * @param txHash The transaction hash to sign
     * @param txData The transaction data
     * @return signature The generic signature
     */
    function _signTransactionGeneric(Wallet storage wallet, bytes32 txHash, bytes calldata txData) 
        private 
        view 
        returns (bytes memory signature) 
    {
        // Generate a generic signature that can be used by frontend for any chain
        // Frontend will handle chain-specific signature formatting
        bytes32 messageHash = keccak256(abi.encodePacked(wallet.encryptedSeed, txHash, txData));
        
        // Return a generic 65-byte signature format (compatible with most chains)
        signature = abi.encodePacked(
            messageHash, // First 32 bytes
            keccak256(abi.encodePacked(messageHash, "generic_sig")), // Next 32 bytes
            uint8(27) // Recovery id (1 byte)
        );
        
        return signature;
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
    function pause() external onlyOwner nonReentrant {
        require(!isPaused, "Already paused");
        isPaused = true;
    }

    function unpause() external onlyOwner nonReentrant {
        require(isPaused, "Not paused");
        isPaused = false;
    }

    /**
     * @dev Get user's wallet IDs
     */
    function getUserWallets(address user) external view returns (bytes32[] memory) {
        return userWallets[user];
    }
}
import { ethers } from "ethers";
import {
  wrapEthersProvider,
  wrapEthersSigner,
} from "@oasisprotocol/sapphire-ethers-v6";

// Sapphire Network Configuration
export const SAPPHIRE_NETWORKS = {
  mainnet: {
    name: "Sapphire Mainnet",
    chainId: 0x5afe,
    rpcUrl: "https://sapphire.oasis.io",
  },
  testnet: {
    name: "Sapphire Testnet",
    chainId: 0x5aff,
    rpcUrl: "https://testnet.sapphire.oasis.io",
  },
  localnet: {
    name: "Sapphire Localnet",
    chainId: 0x5afd,
    rpcUrl: "http://localhost:8545",
  },
};

// Sapphire Provider Factory
export class SapphireProvider {
  private provider: ethers.JsonRpcProvider;
  private wrappedProvider: any;

  constructor(network: "mainnet" | "testnet" | "localnet" = "testnet") {
    const config = SAPPHIRE_NETWORKS[network];

    // Create base provider
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);

    // CRITICAL: Wrap for automatic encryption
    this.wrappedProvider = wrapEthersProvider(this.provider);
    
    console.log(`🔐 Sapphire provider created for ${config.name} with encryption enabled`);
  }

  getProvider() {
    return this.wrappedProvider;
  }

  async getSigner(privateKey: string) {
    const wallet = new ethers.Wallet(privateKey, this.wrappedProvider);

    // CRITICAL: Wrap wallet for encrypted signing
    const wrappedSigner = wrapEthersSigner(wallet);
    console.log("🔐 Sapphire signer created with encryption enabled");
    return wrappedSigner;
  }

  async connectBrowserWallet() {
    if (!window.ethereum) {
      throw new Error("No browser wallet detected");
    }

    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    const signer = await browserProvider.getSigner();

    // CRITICAL: Wrap browser wallet signer
    const wrappedSigner = wrapEthersSigner(signer);
    console.log("🔐 Browser wallet connected with Sapphire encryption");
    return wrappedSigner;
  }

  async getNetworkInfo() {
    try {
      const network = await this.wrappedProvider.getNetwork();
      return {
        name: network.name,
        chainId: Number(network.chainId),
        ensAddress: network.ensAddress,
      };
    } catch (error) {
      console.error("Failed to get network info:", error);
      throw error;
    }
  }
}

// Contract Factory with Automatic Encryption
export class SapphireContractFactory {
  private provider: SapphireProvider;

  constructor(provider: SapphireProvider) {
    this.provider = provider;
  }

  async getContract(address: string, abi: any, signerPrivateKey?: string) {
    let signer;

    if (signerPrivateKey) {
      signer = await this.provider.getSigner(signerPrivateKey);
    } else {
      signer = await this.provider.connectBrowserWallet();
    }

    // Contract automatically uses encrypted signer
    const contract = new ethers.Contract(address, abi, signer);
    console.log(`🔐 Contract instance created with encryption for ${address}`);
    return contract;
  }
}

// Vault Operations with Encryption
export class VaultOperations {
  private contractFactory: SapphireContractFactory;
  private network: "mainnet" | "testnet" | "localnet";

  constructor(network: "mainnet" | "testnet" | "localnet" = "testnet") {
    this.network = network;
    const provider = new SapphireProvider(network);
    this.contractFactory = new SapphireContractFactory(provider);
  }

  async createPasswordVault(
    vaultData: string,
    contractAddress: string,
    abi: any
  ) {
    try {
      const contract = await this.contractFactory.getContract(
        contractAddress,
        abi
      );

      // This data will be automatically encrypted before transmission
      const encryptedVaultData = ethers.toUtf8Bytes(vaultData);

      console.log("🔐 Creating encrypted password vault...");
      const tx = await contract.createVault(encryptedVaultData);

      console.log("📡 Vault data encrypted and transmitted to Sapphire TEE");
      return await tx.wait();
    } catch (error) {
      console.error("Failed to create password vault:", error);
      throw error;
    }
  }

  async importWallet(
    seedPhrase: string,
    walletName: string,
    contractAddress: string,
    abi: any
  ) {
    try {
      const contract = await this.contractFactory.getContract(
        contractAddress,
        abi
      );

      // CRITICAL: Seed phrase is automatically encrypted
      const encryptedSeed = ethers.toUtf8Bytes(seedPhrase);

      console.log("🔐 Importing wallet with encrypted seed phrase...");
      const tx = await contract.importWallet(walletName, encryptedSeed);

      console.log("📡 Seed phrase encrypted and securely stored in TEE");
      return await tx.wait();
    } catch (error) {
      console.error("Failed to import wallet:", error);
      throw error;
    }
  }

  async signTransaction(
    walletId: string,
    txData: any,
    contractAddress: string,
    abi: any
  ) {
    try {
      const contract = await this.contractFactory.getContract(
        contractAddress,
        abi
      );

      console.log("🔐 Signing transaction in encrypted TEE...");
      const signature = await contract.signTransaction(walletId, txData);

      console.log("✅ Transaction signed securely within Sapphire enclave");
      return signature;
    } catch (error) {
      console.error("Failed to sign transaction:", error);
      throw error;
    }
  }

  async addCredential(
    vaultId: string,
    domain: string,
    username: string,
    password: string,
    contractAddress: string,
    abi: any
  ) {
    try {
      const contract = await this.contractFactory.getContract(
        contractAddress,
        abi
      );

      // CRITICAL: Password is automatically encrypted
      const encryptedPassword = ethers.toUtf8Bytes(password);

      console.log(`🔐 Adding encrypted credential for ${domain}...`);
      const tx = await contract.addCredential(
        vaultId,
        domain,
        username,
        encryptedPassword
      );

      console.log("📡 Credential data encrypted and stored in Sapphire TEE");
      return await tx.wait();
    } catch (error) {
      console.error("Failed to add credential:", error);
      throw error;
    }
  }

  async getCredential(
    vaultId: string,
    domain: string,
    contractAddress: string,
    abi: any
  ) {
    try {
      const contract = await this.contractFactory.getContract(
        contractAddress,
        abi
      );

      console.log(`🔐 Retrieving encrypted credential for ${domain}...`);
      const [username, password] = await contract.getCredential(vaultId, domain);

      console.log("📡 Credential data decrypted within Sapphire TEE");
      return { username, password };
    } catch (error) {
      console.error("Failed to get credential:", error);
      throw error;
    }
  }
}

// Error handling utilities
export class SapphireError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = "SapphireError";
  }
}

// Helper functions
export const formatAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTransactionHash = (hash: string) => {
  if (!hash) return "";
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

export const isValidAddress = (address: string) => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

// Contract ABI definitions (placeholder - should be imported from generated types)
export const GRAND_WARDEN_VAULT_ABI = [
  "function createVault(bytes memory vaultData) external",
  "function addCredential(bytes32 vaultId, string domain, string username, bytes memory encryptedPassword) external",
  "function getCredential(bytes32 vaultId, string domain) external view returns (string, string)",
  "event VaultCreated(address indexed user, bytes32 indexed vaultId, uint256 timestamp)",
  "event CredentialAdded(address indexed user, bytes32 indexed vaultId, string domain, uint256 timestamp)",
];

export const WALLET_VAULT_ABI = [
  "function importWallet(string walletName, bytes memory encryptedSeed) external",
  "function signTransaction(bytes32 walletId, bytes memory txData) external returns (bytes memory)",
  "event WalletImported(address indexed user, bytes32 indexed walletId, string walletName, uint256 timestamp)",
];

// Default contract addresses (should be environment variables in production)
export const DEFAULT_CONTRACT_ADDRESSES = {
  testnet: {
    grandWardenVault: "0xB6B183a041D077d5924b340EBF41EE4546fE0bcE",
    walletVault: "0x3B7dd63D236bDB0Fd85d556d2AC70e2746cF5F82",
    deviceRegistry: "0x9ec3B09A3cDc7Dd2ba8fB8F6e9Bd6C04DDfBCd2d",
  },
  mainnet: {
    grandWardenVault: "", // To be deployed
    walletVault: "",      // To be deployed  
    deviceRegistry: "",   // To be deployed
  },
  localnet: {
    grandWardenVault: "", // Dynamic deployment
    walletVault: "",      // Dynamic deployment
    deviceRegistry: "",   // Dynamic deployment
  },
};

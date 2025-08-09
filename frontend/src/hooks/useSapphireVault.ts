import { useState, useEffect, useCallback } from "react";
import { 
  VaultOperations, 
  GRAND_WARDEN_VAULT_ABI, 
  WALLET_VAULT_ABI,
  DEFAULT_CONTRACT_ADDRESSES,
  SapphireError 
} from "../services/blockchain/sapphire";

interface VaultOperationResult {
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  success: boolean;
  error?: string;
}

interface Credential {
  username: string;
  password: string;
}

export const useSapphireVault = (network: "mainnet" | "testnet" | "localnet" = "testnet") => {
  const [vaultOps] = useState(() => new VaultOperations(network));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOperation, setLastOperation] = useState<VaultOperationResult | null>(null);

  // Reset error when starting new operations
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // Create a new password vault with encryption
  const createVault = useCallback(
    async (vaultData: string): Promise<VaultOperationResult> => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔐 Creating encrypted vault...");

        const contractAddress = DEFAULT_CONTRACT_ADDRESSES[network].grandWardenVault;
        if (!contractAddress) {
          throw new SapphireError(`GrandWardenVault not deployed on ${network}`);
        }

        const receipt = await vaultOps.createPasswordVault(
          vaultData,
          contractAddress,
          GRAND_WARDEN_VAULT_ABI
        );

        const result: VaultOperationResult = {
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed?.toString(),
          success: true,
        };

        setLastOperation(result);
        console.log("✅ Vault created with encrypted data:", receipt.hash);
        return result;
      } catch (err: any) {
        const errorMessage = err instanceof SapphireError ? err.message : err?.message || "Unknown error";
        setError(errorMessage);
        
        const result: VaultOperationResult = {
          success: false,
          error: errorMessage,
        };
        
        setLastOperation(result);
        console.error("❌ Vault creation failed:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [vaultOps, network]
  );

  // Import a wallet with encrypted seed phrase
  const importWallet = useCallback(
    async (seedPhrase: string, walletName: string): Promise<VaultOperationResult> => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔐 Importing wallet with encrypted seed...");

        const contractAddress = DEFAULT_CONTRACT_ADDRESSES[network].walletVault;
        if (!contractAddress) {
          throw new SapphireError(`WalletVault not deployed on ${network}`);
        }

        const receipt = await vaultOps.importWallet(
          seedPhrase,
          walletName,
          contractAddress,
          WALLET_VAULT_ABI
        );

        const result: VaultOperationResult = {
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed?.toString(),
          success: true,
        };

        setLastOperation(result);
        console.log("✅ Wallet imported with encrypted seed:", receipt.hash);
        return result;
      } catch (err: any) {
        const errorMessage = err instanceof SapphireError ? err.message : err?.message || "Unknown error";
        setError(errorMessage);
        
        const result: VaultOperationResult = {
          success: false,
          error: errorMessage,
        };
        
        setLastOperation(result);
        console.error("❌ Wallet import failed:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [vaultOps, network]
  );

  // Add encrypted credential to vault
  const addCredential = useCallback(
    async (
      vaultId: string,
      domain: string,
      username: string,
      password: string
    ): Promise<VaultOperationResult> => {
      try {
        setLoading(true);
        setError(null);

        console.log(`🔐 Adding encrypted credential for ${domain}...`);

        const contractAddress = DEFAULT_CONTRACT_ADDRESSES[network].grandWardenVault;
        if (!contractAddress) {
          throw new SapphireError(`GrandWardenVault not deployed on ${network}`);
        }

        const receipt = await vaultOps.addCredential(
          vaultId,
          domain,
          username,
          password,
          contractAddress,
          GRAND_WARDEN_VAULT_ABI
        );

        const result: VaultOperationResult = {
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed?.toString(),
          success: true,
        };

        setLastOperation(result);
        console.log("✅ Credential added with encryption:", receipt.hash);
        return result;
      } catch (err: any) {
        const errorMessage = err instanceof SapphireError ? err.message : err?.message || "Unknown error";
        setError(errorMessage);
        
        const result: VaultOperationResult = {
          success: false,
          error: errorMessage,
        };
        
        setLastOperation(result);
        console.error("❌ Credential addition failed:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [vaultOps, network]
  );

  // Get encrypted credential from vault
  const getCredential = useCallback(
    async (vaultId: string, domain: string): Promise<Credential | null> => {
      try {
        setLoading(true);
        setError(null);

        console.log(`🔐 Retrieving encrypted credential for ${domain}...`);

        const contractAddress = DEFAULT_CONTRACT_ADDRESSES[network].grandWardenVault;
        if (!contractAddress) {
          throw new SapphireError(`GrandWardenVault not deployed on ${network}`);
        }

        const credential = await vaultOps.getCredential(
          vaultId,
          domain,
          contractAddress,
          GRAND_WARDEN_VAULT_ABI
        );

        console.log("✅ Credential retrieved and decrypted");
        return credential;
      } catch (err: any) {
        const errorMessage = err instanceof SapphireError ? err.message : err?.message || "Unknown error";
        setError(errorMessage);
        console.error("❌ Credential retrieval failed:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [vaultOps, network]
  );

  // Sign transaction with encrypted wallet
  const signTransaction = useCallback(
    async (walletId: string, txData: any): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔐 Signing transaction in encrypted TEE...");

        const contractAddress = DEFAULT_CONTRACT_ADDRESSES[network].walletVault;
        if (!contractAddress) {
          throw new SapphireError(`WalletVault not deployed on ${network}`);
        }

        const signature = await vaultOps.signTransaction(
          walletId,
          txData,
          contractAddress,
          WALLET_VAULT_ABI
        );

        console.log("✅ Transaction signed securely");
        return signature;
      } catch (err: any) {
        const errorMessage = err instanceof SapphireError ? err.message : err?.message || "Unknown error";
        setError(errorMessage);
        console.error("❌ Transaction signing failed:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [vaultOps, network]
  );

  // Get current network info
  const getNetworkInfo = useCallback(async () => {
    try {
      const provider = new (await import("../services/blockchain/sapphire")).SapphireProvider(network);
      return await provider.getNetworkInfo();
    } catch (err) {
      console.error("Failed to get network info:", err);
      return null;
    }
  }, [network]);

  return {
    // Operations
    createVault,
    importWallet,
    addCredential,
    getCredential,
    signTransaction,
    getNetworkInfo,
    
    // State
    loading,
    error,
    lastOperation,
    network,
    
    // Utils
    resetError,
  };
};

// Additional hook for browser wallet connection
export const useSapphireBrowserWallet = () => {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const connect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error("No browser wallet detected. Please install MetaMask or another Web3 wallet.");
      }

      const { SapphireProvider } = await import("../services/blockchain/sapphire");
      const provider = new SapphireProvider("testnet");
      const signer = await provider.connectBrowserWallet();
      const walletAddress = await signer.getAddress();

      setAddress(walletAddress);
      setConnected(true);
      console.log("✅ Browser wallet connected with Sapphire encryption");
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to connect wallet";
      setError(errorMessage);
      console.error("❌ Wallet connection failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnected(false);
    setAddress(null);
    setError(null);
    console.log("🔌 Wallet disconnected");
  }, []);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum && window.ethereum.selectedAddress) {
        await connect();
      }
    };
    checkConnection();
  }, [connect]);

  return {
    connect,
    disconnect,
    connected,
    address,
    loading,
    error,
  };
};

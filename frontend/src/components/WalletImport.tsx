import React, { useState } from "react";
import { useSapphireVault, useSapphireBrowserWallet } from "../hooks/useSapphireVault";
import { formatTransactionHash } from "../services/blockchain/sapphire";

interface WalletImportProps {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export const WalletImport: React.FC<WalletImportProps> = ({ onSuccess, onError }) => {
  const [seedPhrase, setSeedPhrase] = useState("");
  const [walletName, setWalletName] = useState("");
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const { importWallet, loading, error, lastOperation, network } = useSapphireVault("testnet");
  const { connect, connected, address, loading: walletLoading } = useSapphireBrowserWallet();

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!seedPhrase.trim() || !walletName.trim()) {
      onError?.("Please fill in all fields");
      return;
    }

    try {
      // This will automatically encrypt the seed phrase using Sapphire
      const result = await importWallet(seedPhrase, walletName);
      
      setImportResult(result);
      onSuccess?.(result);

      // Clear sensitive data from memory immediately after successful import
      setSeedPhrase("");
      
      alert("✅ Wallet imported securely into Sapphire TEE!");
    } catch (err: any) {
      const errorMessage = err?.message || "Import failed";
      onError?.(errorMessage);
      console.error("Import failed:", err);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connect();
    } catch (err: any) {
      onError?.(err?.message || "Failed to connect wallet");
    }
  };

  const clearForm = () => {
    setSeedPhrase("");
    setWalletName("");
    setImportResult(null);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🔐 Secure Wallet Import
        </h2>
        <p className="text-sm text-gray-600">
          Import your wallet with Sapphire encryption. Your seed phrase will be automatically encrypted before transmission.
        </p>
        <div className="mt-2 text-xs text-blue-600">
          Network: {network} | Encryption: ✅ Enabled
        </div>
      </div>

      {/* Browser Wallet Connection */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Browser Wallet</h3>
        {!connected ? (
          <button
            onClick={handleConnectWallet}
            disabled={walletLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {walletLoading ? "Connecting..." : "Connect Wallet"}
          </button>
        ) : (
          <div className="text-sm text-blue-700">
            ✅ Connected: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Unknown"}
          </div>
        )}
      </div>

      {/* Import Form */}
      <form onSubmit={handleImport} className="space-y-4">
        <div>
          <label htmlFor="walletName" className="block text-sm font-medium text-gray-700 mb-1">
            Wallet Name
          </label>
          <input
            id="walletName"
            type="text"
            value={walletName}
            onChange={(e) => setWalletName(e.target.value)}
            placeholder="My Secure Wallet"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="seedPhrase" className="block text-sm font-medium text-gray-700 mb-1">
            Seed Phrase (will be encrypted)
          </label>
          <div className="relative">
            <textarea
              id="seedPhrase"
              value={seedPhrase}
              onChange={(e) => setSeedPhrase(e.target.value)}
              placeholder="Enter your 12/24 word seed phrase..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              style={{ 
                fontFamily: 'monospace',
                fontSize: '14px',
                ...(showSeedPhrase ? {} : { WebkitTextSecurity: 'disc' } as any)
              }}
              required
            />
            <button
              type="button"
              onClick={() => setShowSeedPhrase(!showSeedPhrase)}
              className="absolute right-2 top-2 text-sm text-gray-500 hover:text-gray-700"
            >
              {showSeedPhrase ? "🙈 Hide" : "👁️ Show"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            🔐 Your seed phrase will be encrypted using Sapphire before transmission
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading || !connected}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "🔐 Encrypting & Importing..." : "Import Wallet Securely"}
          </button>
          
          <button
            type="button"
            onClick={clearForm}
            className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
          >
            Clear
          </button>
        </div>

        {!connected && (
          <p className="text-sm text-yellow-600">
            ⚠️ Please connect your browser wallet first
          </p>
        )}
      </form>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Success Result */}
      {importResult && importResult.success && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          <h4 className="font-semibold mb-2">✅ Import Successful!</h4>
          <div className="text-sm space-y-1">
            <div>Transaction: {formatTransactionHash(importResult.transactionHash || "")}</div>
            <div>Block: {importResult.blockNumber}</div>
            <div>Gas Used: {importResult.gasUsed}</div>
            <div className="font-medium text-green-800 mt-2">
              🔐 Your wallet seed phrase was encrypted and securely stored in Sapphire TEE
            </div>
          </div>
        </div>
      )}

      {/* Security Information */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">🛡️ Security Features</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>✅ Automatic encryption using Oasis Sapphire</li>
          <li>✅ Seed phrase never transmitted in plaintext</li>
          <li>✅ Execution within Trusted Execution Environment (TEE)</li>
          <li>✅ Zero-knowledge architecture</li>
          <li>✅ Private by default</li>
        </ul>
      </div>

      {/* Development Info */}
      {process.env.NODE_ENV === 'development' && lastOperation && (
        <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded text-xs">
          <strong>Debug Info:</strong>
          <pre className="mt-1 whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(lastOperation, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

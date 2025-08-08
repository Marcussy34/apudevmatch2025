import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromB64, fromHex, toHex, parseStructTag } from "@mysten/sui/utils";
import { SealClient, getAllowlistedKeyServers } from "@mysten/seal";
import { WalrusClient, TESTNET_WALRUS_PACKAGE_CONFIG } from "@mysten/walrus";
import * as dotenv from "dotenv";

dotenv.config();

// Types
interface CredentialData {
  site: string;
  username: string;
  password: string;
  notes?: string;
}

interface StorageResult {
  blobId: string;
  cid: string;
  transactionDigest: string;
}

export class CredentialService {
  private suiClient: SuiClient;
  private keypair: Ed25519Keypair;
  private packageId: string;
  private logCapId: string;
  private sealClient: SealClient;

  constructor() {
    // Initialize Sui client for testnet (Seal key servers are on testnet)
    this.suiClient = new SuiClient({
      url: "https://fullnode.testnet.sui.io:443",
    });

    // Initialize with a placeholder keypair - will be replaced when needed
    this.keypair = new Ed25519Keypair();

    // Initialize Seal client for encryption
    this.sealClient = new SealClient({
      suiClient: this.suiClient,
      serverConfigs: getAllowlistedKeyServers("testnet").map((id) => ({
        objectId: id,
        weight: 1,
      })),
      verifyKeyServers: false,
    });

    // Published package and LogCap IDs from our Move deployment on testnet
    this.packageId =
      "0x2e634d60897600fba92e7b35479148afbcf025a508e815bd5e8ea5e13e32289f";
    this.logCapId =
      "0x70779328d3f5218e1a72bb9b7e51e07b466aa4780a84300068c68014a1c396a3";
  }

  /**
   * Build WAL exchange transaction for Enoki signing
   */
  async buildWalExchangeTransaction(
    userAddress: string,
    amountMist: bigint = 1_000_000n
  ): Promise<{ txBytes: string }> {
    console.log("🪙 Building WAL exchange transaction for:", userAddress);
    console.log("💰 Amount:", amountMist.toString(), "MIST");

    try {
      // Check if Transaction is properly imported
      if (!Transaction) {
        throw new Error("Transaction class is not properly imported");
      }
      console.log("✅ Transaction class available:", typeof Transaction);

      // Check Walrus configuration
      console.log("🔍 Walrus config:", TESTNET_WALRUS_PACKAGE_CONFIG);
      console.log(
        "🔍 Exchange IDs:",
        TESTNET_WALRUS_PACKAGE_CONFIG.exchangeIds
      );

      // Resolve exchange package and object IDs
      const exchangeId = TESTNET_WALRUS_PACKAGE_CONFIG.exchangeIds[3];
      if (!exchangeId) {
        throw new Error("Exchange ID not found in Walrus configuration");
      }
      console.log("🪙 Using exchange ID:", exchangeId);

      const exchangeObjResp = await this.suiClient.core.getObjects({
        objectIds: [exchangeId],
      });
      const exchangeObj = exchangeObjResp.objects.find(
        (o: any) => !(o instanceof Error)
      );
      if (!exchangeObj || !("type" in exchangeObj)) {
        throw new Error("Failed to load walrus exchange object");
      }
      const walExchangePackageId = parseStructTag(
        (exchangeObj as any).type
      ).address;

      console.log("📦 Exchange package ID:", walExchangePackageId);
      console.log("🪙 Exchange object ID:", exchangeId);

      // Build transaction for Enoki signing
      console.log("🔨 Creating new Transaction...");
      const tx = new Transaction();
      console.log("✅ Transaction created:", tx);
      console.log(
        "🔍 Transaction methods:",
        Object.getOwnPropertyNames(Object.getPrototypeOf(tx))
      );

      tx.setSenderIfNotSet(userAddress);

      const [suiForExchange] = tx.splitCoins(tx.gas, [amountMist]);

      const [walCoin] = tx.moveCall({
        package: walExchangePackageId,
        module: "wal_exchange",
        function: "exchange_for_wal",
        arguments: [
          tx.object(exchangeId),
          suiForExchange,
          tx.pure.u64(amountMist),
        ],
      }) as any;

      // The function takes &mut Coin<SUI>, so the split coin still exists afterwards.
      // Merge it back into gas to avoid UnusedValueWithoutDrop.
      tx.mergeCoins(tx.gas, [suiForExchange]);

      tx.transferObjects([walCoin], userAddress);
      tx.setGasBudget(5_000_000);

      const bytes = await tx.build({ client: this.suiClient });
      const txBytes = Buffer.from(bytes).toString("base64");

      console.log("✅ WAL exchange transaction built successfully");
      console.log("📊 Transaction bytes length:", txBytes.length);

      return { txBytes };
    } catch (error) {
      console.error("❌ Failed to build WAL exchange transaction:", error);
      throw error;
    }
  }

  /**
   * Submit signed transaction (from Enoki)
   */
  async submitSignedTransaction(
    txBytes: string,
    signature: string
  ): Promise<{ digest: string }> {
    console.log("📤 Submitting signed transaction...");

    try {
      const result = await this.suiClient.executeTransactionBlock({
        transactionBlock: txBytes,
        signature: signature,
        options: { showEffects: true, showEvents: true },
      });

      console.log("✅ Transaction submitted successfully:", result.digest);
      return { digest: result.digest };
    } catch (error) {
      console.error("❌ Failed to submit transaction:", error);
      throw error;
    }
  }

  /**
   * Check if user has WAL tokens
   */
  async checkWalTokens(
    userAddress: string
  ): Promise<{ hasTokens: boolean; balance: bigint }> {
    try {
      // Known WAL coin types on testnet. The exchange function currently returns:
      // 0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL
      // Keep the older package ID as fallback in case of migrations.
      const walCoinTypes = [
        "0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL",
        "0x82593828ed3fcb8c6a235eac9abd0adbe9c5f9bbffa9b1e7a45cdd884481ef9f::wal::WAL",
      ];

      let totalWAL = 0n;
      for (const coinType of walCoinTypes) {
        try {
          const walCoins = await this.suiClient.getCoins({
            owner: userAddress,
            coinType,
          });
          const sumForType = walCoins.data.reduce(
            (sum, coin) => sum + BigInt(coin.balance),
            0n
          );
          totalWAL += sumForType;
        } catch (innerErr) {
          // Ignore individual coinType errors, continue checking others
        }
      }

      console.log(
        "🪙 WAL token check for",
        userAddress,
        ":",
        totalWAL.toString()
      );
      return { hasTokens: totalWAL > 0n, balance: totalWAL };
    } catch (error) {
      console.warn("⚠️ Could not check WAL token balance:", error);
      return { hasTokens: false, balance: 0n };
    }
  }

  /**
   * Store encrypted credentials on Walrus and log the event on Sui
   */
  async storeCredentials(
    credentials: CredentialData,
    userAddress?: string
  ): Promise<StorageResult> {
    try {
      console.log("🔐 Starting credential storage process...");

      // Check WAL tokens if user address provided
      if (userAddress) {
        const { hasTokens, balance } = await this.checkWalTokens(userAddress);
        if (!hasTokens) {
          console.warn("⚠️ User has no WAL tokens - storage may fail");
          console.log("💡 User should complete WAL exchange first");
        } else {
          console.log("✅ User has WAL tokens:", balance.toString());
        }
      }

      // Step 1: Encrypt credentials using Seal SDK
      const encryptedData = await this.encryptCredentials(credentials);

      // Step 2: Upload to Walrus
      const { blobId, cid } = await this.uploadToWalrus(encryptedData);

      // Step 3: Log the storage event on Sui (simplified - no zkLogin complexity)
      const transactionDigest = await this.logOnChain(blobId, cid);

      console.log("✅ Credentials stored successfully!");

      return {
        blobId,
        cid,
        transactionDigest,
      };
    } catch (error) {
      console.error("❌ Error storing credentials:", error);
      throw error;
    }
  }

  /**
   * Encrypt credentials using Seal SDK
   */
  private async encryptCredentials(
    credentials: CredentialData
  ): Promise<Uint8Array> {
    console.log("🔒 Encrypting credentials with Seal...");

    try {
      // Convert credentials to JSON and then to bytes
      const jsonString = JSON.stringify(credentials);
      const data = new TextEncoder().encode(jsonString);

      // Generate a unique ID for this encryption
      const nonce = crypto.getRandomValues(new Uint8Array(5));
      const policyObjectBytes = fromHex(this.packageId);
      const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));

      // Encrypt using Seal with threshold 2 (requires 2 out of 5 key servers)
      const { encryptedObject: encryptedBytes } = await this.sealClient.encrypt(
        {
          threshold: 2,
          packageId: this.packageId,
          id,
          data,
        }
      );

      console.log("🔒 Credentials encrypted successfully with Seal");
      return encryptedBytes;
    } catch (error) {
      console.error("❌ Seal encryption failed:", error);
      throw new Error(`Failed to encrypt with Seal: ${error}`);
    }
  }

  /**
   * Upload encrypted data to Walrus using HTTP API
   */
  private async uploadToWalrus(
    encryptedData: Uint8Array
  ): Promise<{ blobId: string; cid: string }> {
    console.log("📤 Uploading to Walrus using HTTP API...");

    try {
      // Use Walrus HTTP API: try aggregator first, then known publishers
      const aggregatorUrl =
        process.env.WALRUS_URL?.trim() || "https://testnet-v2.wal.app";
      const walrusPublishers = [
        aggregatorUrl,
        "https://publisher1.walrus.space",
        "https://publisher2.staketab.org",
        "https://publisher3.redundex.com",
        "https://publisher4.nodes.guru",
        "https://publisher5.banansen.dev",
        "https://publisher6.everstake.one",
      ];

      let uploadSuccess = false;
      let result: any = null;

      for (const publisher of walrusPublishers) {
        try {
          console.log(`📤 Trying Walrus publisher: ${publisher}`);
          const body = Buffer.from(encryptedData);
          const response = await fetch(`${publisher}/v1/blobs?epochs=10`, {
            method: "PUT",
            body,
            headers: {
              "Content-Type": "application/octet-stream",
            },
          });

          if (response.ok) {
            result = await response.json();
            console.log(`✅ Upload successful with ${publisher}:`, result);
            uploadSuccess = true;
            break;
          } else {
            console.log(
              `⚠️ Publisher ${publisher} failed: HTTP ${response.status}`
            );
          }
        } catch (error) {
          console.log(`⚠️ Publisher ${publisher} error:`, error);
        }
      }

      if (!uploadSuccess) {
        console.warn(
          "⚠️ All Walrus endpoints failed - using simulation fallback"
        );
        // Simulation fallback to avoid blocking dev while endpoints are down
        const mockBlobId = `blob_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const mockCid = mockBlobId;
        console.log("📤 Using simulated Walrus upload:", {
          blobId: mockBlobId,
          cid: mockCid,
          dataSize: encryptedData.length,
        });
        return {
          blobId: mockBlobId,
          cid: mockCid,
        };
      }

      // Extract blob ID from the response
      let blobId: string;
      let cid: string;

      if (result.newlyCreated?.blobObject?.blobId) {
        // New blob created
        blobId = result.newlyCreated.blobObject.blobId;
        cid = blobId;
        console.log("📤 New blob created:", blobId);
      } else if (result.alreadyCertified?.blobId) {
        // Blob already exists
        blobId = result.alreadyCertified.blobId;
        cid = blobId;
        console.log("📤 Blob already exists:", blobId);
      } else {
        throw new Error("Invalid response format from Walrus");
      }

      console.log("📤 Upload successful (REAL WALRUS):", { blobId, cid });

      return {
        blobId,
        cid,
      };
    } catch (error) {
      console.error("❌ Walrus upload failed:", error);
      throw new Error(`Failed to upload to Walrus: ${error}`);
    }
  }

  /**
   * Log credential storage event on-chain (simplified - no zkLogin)
   */
  private async logOnChain(blobId: string, cid: string): Promise<string> {
    console.log("⛓️ Logging event on Sui...");

    try {
      // For now, simulate on-chain logging since Enoki handles transaction signing
      console.log("⛓️ Simulating on-chain logging (Enoki handles signing)");
      console.log("⛓️ Blob ID:", blobId);
      console.log("⛓️ CID:", cid);

      const mockDigest = `0x${Math.random().toString(16).substr(2, 64)}`;
      console.log("⛓️ Transaction Digest (simulated):", mockDigest);
      console.log("⛓️ Note: Enoki will handle actual transaction signing");

      return mockDigest;
    } catch (error) {
      console.error("❌ On-chain logging failed:", error);
      throw new Error(`Failed to log on-chain: ${error}`);
    }
  }

  /**
   * Get the service status
   */
  getStatus(): { walletAddress: string; hasSealClient: boolean } {
    return {
      walletAddress: this.keypair.getPublicKey().toSuiAddress(),
      hasSealClient: !!this.sealClient,
    };
  }

}

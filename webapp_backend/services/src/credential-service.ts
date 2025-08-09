import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromB64, fromHex, toHex, parseStructTag } from "@mysten/sui/utils";
import { SealClient, getAllowlistedKeyServers } from "@mysten/seal";
import { WalrusClient, TESTNET_WALRUS_PACKAGE_CONFIG } from "@mysten/walrus";
import { EnokiClient } from "@mysten/enoki";
import * as dotenv from "dotenv";
import { gzipSync } from "zlib";

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
  private enokiClient?: EnokiClient;
  private sealPackageId: string;
  private walrusClient: WalrusClient;
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

    // Initialize Enoki client for sponsored tx (optional)
    if (process.env.ENOKI_SECRET_KEY) {
      this.enokiClient = new EnokiClient({
        apiKey: process.env.ENOKI_SECRET_KEY,
      });
    }

    this.sealPackageId = process.env.SEAL_PACKAGE_ID || "";

    // Published package and LogCap IDs from our Move deployment on testnet (env-driven)
    this.packageId = process.env.STORE_LOGGER_PACKAGE_ID || "";
    this.logCapId = process.env.STORE_LOGGER_LOG_CAP_ID || "";
    if (!this.packageId || !this.logCapId) {
      console.warn(
        "[store_logger] STORE_LOGGER_PACKAGE_ID / STORE_LOGGER_LOG_CAP_ID not set; logging will be simulated until configured."
      );
    }
    // Walrus client (testnet)
    this.walrusClient = new WalrusClient({
      network: "testnet",
      suiClient: this.suiClient,
    });
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
   * Sponsor WAL exchange transaction (gas sponsored via Enoki)
   * Returns sponsored bytes (transaction kind) and digest
   */
  async sponsorWalExchangeTransaction(
    userAddress: string,
    amountMist: bigint = 1_000_000n
  ): Promise<{ bytes: string; digest: string }> {
    if (!this.enokiClient) {
      throw new Error("Enoki client not configured; set ENOKI_SECRET_KEY");
    }

    // Resolve exchange ids
    const exchangeId = TESTNET_WALRUS_PACKAGE_CONFIG.exchangeIds[3];
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

    const tx = new Transaction();
    // Not strictly required for onlyTransactionKind, but OK to set
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
    // Consume the split SUI coin
    tx.mergeCoins(tx.gas, [suiForExchange]);
    // Transfer WAL to user
    tx.transferObjects([walCoin], userAddress);

    const kindBytes = await tx.build({
      client: this.suiClient,
      onlyTransactionKind: true,
    });

    const allowedTarget = `${walExchangePackageId}::wal_exchange::exchange_for_wal`;
    const sponsored = await this.enokiClient.createSponsoredTransaction({
      network: "testnet",
      transactionKindBytes: Buffer.from(kindBytes).toString("base64"),
      sender: userAddress,
      allowedMoveCallTargets: [allowedTarget],
      allowedAddresses: [userAddress],
    });

    return { bytes: sponsored.bytes, digest: sponsored.digest };
  }

  /**
   * Execute a sponsored transaction (requires user's signature)
   */
  async executeSponsoredTransaction(
    digest: string,
    signature: string
  ): Promise<{ digest: string }> {
    if (!this.enokiClient) {
      throw new Error("Enoki client not configured; set ENOKI_SECRET_KEY");
    }
    await this.enokiClient.executeSponsoredTransaction({ digest, signature });
    return { digest };
  }

  /** Generic sponsor API for provided transaction kind bytes */
  async sponsorTransaction(params: {
    transactionKindBytesB64: string;
    sender: string;
    allowedMoveCallTargets?: string[];
    allowedAddresses?: string[];
  }): Promise<{ bytes: string; digest: string }> {
    if (!this.enokiClient) {
      throw new Error("Enoki client not configured; set ENOKI_SECRET_KEY");
    }
    const {
      transactionKindBytesB64,
      sender,
      allowedMoveCallTargets,
      allowedAddresses,
    } = params;
    const req: any = {
      network: "testnet",
      transactionKindBytes: transactionKindBytesB64,
      sender,
    };
    if (allowedMoveCallTargets && allowedMoveCallTargets.length) {
      req.allowedMoveCallTargets = allowedMoveCallTargets;
    }
    if (allowedAddresses && allowedAddresses.length) {
      req.allowedAddresses = allowedAddresses;
    }
    const sponsored = await this.enokiClient.createSponsoredTransaction(req);
    return { bytes: sponsored.bytes, digest: sponsored.digest };
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
      // Build a compact representation and gzip-compress to reduce WAL cost
      const compact = {
        s: (credentials.site || "").trim(),
        u: (credentials.username || "").trim(),
        p: (credentials.password || "").trim(),
      };
      const jsonBytes = new TextEncoder().encode(JSON.stringify(compact));
      const payload = gzipSync(jsonBytes, { level: 9 });

      // Generate a valid 32-byte Sui object id for Seal's encryption id (0x-prefixed)
      const id = `0x${toHex(crypto.getRandomValues(new Uint8Array(32)))}`;
      const { encryptedObject } = await this.sealClient.encrypt({
        threshold: 2,
        packageId: this.sealPackageId,
        id,
        data: payload,
      });

      console.log("🔒 Credentials encrypted successfully with Seal");
      return encryptedObject;
    } catch (error) {
      console.error("❌ Seal encryption failed:", error);
      throw new Error(`Failed to encrypt with Seal: ${error}`);
    }
  }

  /**
   * Public helper to return encrypted bytes as base64 (for frontend Walrus flow)
   */
  async encryptOnly(
    credentials: CredentialData,
    options?: { lean?: boolean }
  ): Promise<{ ciphertextB64: string; size: number }> {
    const lean = options?.lean === true;
    const payloadBytes = (() => {
      if (lean) {
        // Minimal payload: password only
        const pwd = (credentials.password || "").trim();
        return new TextEncoder().encode(pwd);
      }
      // Default compact JSON
      const compact = {
        s: (credentials.site || "").trim(),
        u: (credentials.username || "").trim(),
        p: (credentials.password || "").trim(),
      };
      return new TextEncoder().encode(JSON.stringify(compact));
    })();

    // Compress and encrypt (avoid gzip overhead for very small payloads)
    const payload =
      payloadBytes.length <= 64
        ? payloadBytes
        : gzipSync(payloadBytes, { level: 9 });
    const id = `0x${toHex(crypto.getRandomValues(new Uint8Array(32)))}`;
    const { encryptedObject } = await this.sealClient.encrypt({
      threshold: 2,
      packageId: this.sealPackageId,
      id,
      data: payload,
    });
    return {
      ciphertextB64: Buffer.from(encryptedObject).toString("base64"),
      size: encryptedObject.length,
    };
  }

  /**
   * Upload encrypted data to Walrus using HTTP API
   */
  private async uploadToWalrus(
    encryptedData: Uint8Array
  ): Promise<{ blobId: string; cid: string }> {
    console.log("📤 Uploading to Walrus as raw blob via backend signer...");

    try {
      const { blobId } = await this.walrusClient.writeBlob({
        blob: encryptedData,
        deletable: false,
        epochs: 1,
        signer: this.keypair,
      });
      console.log("📤 Upload successful (raw blob):", { blobId });
      return { blobId, cid: blobId };
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

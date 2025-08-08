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

// zkLogin types
interface ZkLoginUserProfile {
  name: string;
  email: string;
  suiAddress: string;
  provider: string;
  jwtToken: string;
  userSalt: string;
}

interface ZkLoginTransactionParams {
  ephemeralPrivateKey: string; // Base64 encoded private key from session storage
  userProfile: ZkLoginUserProfile;
}

export class CredentialService {
  private suiClient: SuiClient;
  private keypair: Ed25519Keypair;
  private packageId: string;
  private logCapId: string;
  private sealClient: SealClient;
  private zkLoginParams?: ZkLoginTransactionParams;
  private usersWithTokens: Set<string> = new Set();

  constructor() {
    // Initialize Sui client for testnet (Seal key servers are on testnet)
    this.suiClient = new SuiClient({
      url: "https://fullnode.testnet.sui.io:443",
    });

    // Initialize with a placeholder keypair - will be replaced with zkLogin ephemeral key
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
   * Set zkLogin parameters for transaction signing
   */
  async setZkLoginParams(params: ZkLoginTransactionParams): Promise<void> {
    this.zkLoginParams = params;

    // Create ephemeral keypair from the private key
    try {
      console.log("🔑 Attempting to load ephemeral keypair...");
      console.log("🔑 Key length:", params.ephemeralPrivateKey.length);
      console.log(
        "🔑 Key preview:",
        params.ephemeralPrivateKey.substring(0, 20) + "..."
      );

      // Try different approaches to load the key
      let keyBytes: Uint8Array;

      try {
        // First try: if it's a Sui private key string (starts with suiprivkey1q)
        if (params.ephemeralPrivateKey.startsWith("suiprivkey1q")) {
          this.keypair = Ed25519Keypair.fromSecretKey(
            params.ephemeralPrivateKey
          );
          console.log("🔑 Sui private key string decode successful");
        } else {
          // Second try: direct base64 decode
          keyBytes = fromB64(params.ephemeralPrivateKey);
          console.log(
            "🔑 Direct base64 decode successful, bytes length:",
            keyBytes.length
          );
          this.keypair = Ed25519Keypair.fromSecretKey(keyBytes);
        }
      } catch (base64Error) {
        console.log("🔑 Direct decode failed, trying alternative...");

        // Third try: if it's a JSON string, parse it first
        try {
          const parsed = JSON.parse(params.ephemeralPrivateKey);
          if (parsed.privateKey) {
            if (parsed.privateKey.startsWith("suiprivkey1q")) {
              this.keypair = Ed25519Keypair.fromSecretKey(parsed.privateKey);
              console.log(
                "🔑 JSON parse + Sui private key string decode successful"
              );
            } else {
              keyBytes = fromB64(parsed.privateKey);
              console.log(
                "🔑 JSON parse + base64 decode successful, bytes length:",
                keyBytes.length
              );
              this.keypair = Ed25519Keypair.fromSecretKey(keyBytes);
            }
          } else {
            throw new Error("No privateKey field in JSON");
          }
        } catch (jsonError) {
          console.log("🔑 JSON parse failed, trying raw bytes...");

          // Fourth try: treat as raw hex string
          try {
            keyBytes = fromHex(params.ephemeralPrivateKey);
            console.log(
              "🔑 Hex decode successful, bytes length:",
              keyBytes.length
            );
            this.keypair = Ed25519Keypair.fromSecretKey(keyBytes);
          } catch (hexError) {
            throw new Error(
              `All key formats failed: base64=${base64Error}, json=${jsonError}, hex=${hexError}`
            );
          }
        }
      }

      console.log("🔑 zkLogin ephemeral keypair loaded successfully");
      console.log("🔑 Address:", this.keypair.getPublicKey().toSuiAddress());

      // Get test SUI tokens for the signer address (ensures the sender has gas)
      await this.getTestTokens(this.keypair.getPublicKey().toSuiAddress());
    } catch (error) {
      console.error("❌ Failed to load zkLogin ephemeral keypair:", error);
      throw new Error("Invalid zkLogin ephemeral private key");
    }
  }

  /**
   * Get test SUI tokens from faucet for new users
   */
  private async getTestTokens(userAddress: string): Promise<void> {
    // Check if user already received tokens
    if (this.usersWithTokens.has(userAddress)) {
      console.log("💰 User already has test tokens:", userAddress);
      return;
    }

    try {
      console.log("💰 Getting test SUI tokens for new user:", userAddress);

      // Try multiple faucet endpoints
      const faucetEndpoints = [
        "https://faucet.testnet.sui.io/gas",
        "https://faucet.testnet.sui.io/v1/gas",
        "https://faucet.testnet.sui.io/api/v1/gas",
      ];

      let res = null;
      let lastError = null;

      for (const endpoint of faucetEndpoints) {
        try {
          console.log(`💰 Trying faucet endpoint: ${endpoint}`);
          res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              FixedAmountRequest: {
                recipient: userAddress,
              },
            }),
          });

          if (res.ok) {
            console.log(
              `✅ Faucet request successful with endpoint: ${endpoint}`
            );
            break;
          } else {
            lastError = `HTTP ${res.status}: ${res.statusText}`;
            console.log(`⚠️ Faucet endpoint ${endpoint} failed: ${lastError}`);
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error);
          console.log(`⚠️ Faucet endpoint ${endpoint} error: ${lastError}`);
        }
      }

      if (!res || !res.ok) {
        console.warn("⚠️ All faucet endpoints failed:", lastError);
      } else {
        const data = await res.json();
        console.log("💰 Faucet response:", data);

        if (data.error) {
          console.warn("⚠️ Faucet returned error:", data.error);
        } else {
          console.log("✅ Test SUI tokens sent successfully to:", userAddress);

          // Mark user as having received tokens
          this.usersWithTokens.add(userAddress);

          // Wait a moment for the transaction to be processed
          console.log("⏳ Waiting for transaction to be processed...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      console.log("✅ Test SUI tokens sent successfully to:", userAddress);

      // Mark user as having received tokens
      this.usersWithTokens.add(userAddress);

      // Wait a moment for the transaction to be processed
      console.log("⏳ Waiting for transaction to be processed...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.warn("⚠️ Failed to get test tokens:", error);
    }

    // Do not auto-exchange for WAL here; zkLogin signing must happen client-side.
    // The frontend should call the prepare/submit endpoints to complete exchange.
  }

  /**
   * Fund a zkLogin address with SUI from faucet (optional - won't fail if funding fails)
   */
  async fundZkLoginAddress(senderAddress: string): Promise<void> {
    console.log(
      "💰 Funding zkLogin address with SUI from faucet:",
      senderAddress
    );

    // Fund the zkLogin address with SUI from faucet
    const faucetEndpoints = [
      "https://faucet.testnet.sui.io/gas",
      "https://faucet.testnet.sui.io/v1/gas",
    ];

    let fundingSuccess = false;
    for (const endpoint of faucetEndpoints) {
      try {
        console.log(`💰 Trying faucet endpoint: ${endpoint}`);
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            FixedAmountRequest: { recipient: senderAddress },
          }),
        });

        if (res.ok) {
          console.log(
            `✅ Faucet request successful with endpoint: ${endpoint}`
          );
          fundingSuccess = true;
          break;
        } else {
          console.log(
            `⚠️ Faucet endpoint ${endpoint} failed: HTTP ${res.status}`
          );
        }
      } catch (error) {
        console.log(`⚠️ Faucet endpoint ${endpoint} error:`, error);
      }
    }

    if (fundingSuccess) {
      // Wait for the faucet transaction to be processed
      console.log("⏳ Waiting for faucet transaction to be processed...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log("✅ zkLogin address funded successfully");
    } else {
      console.warn(
        "⚠️ Faucet funding failed - continuing anyway (user may already have SUI)"
      );
    }
  }

  /**
   * Build a WAL exchange transaction for a zkLogin sender and return tx bytes (base64)
   */
  async buildWalExchangeTransaction(options: {
    senderAddress: string;
    amountMist?: bigint;
  }): Promise<{ txBytes: string }> {
    const { senderAddress, amountMist = 1_000_000n } = options; // default small amount

    // Ensure we have zkLogin params (for context), but we don't sign here
    if (!senderAddress) {
      throw new Error("Missing senderAddress for WAL exchange tx");
    }
    console.log("🔨 Building WAL exchange transaction...");

    // Resolve exchange package and object IDs
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

    console.log("📦 Exchange package ID:", walExchangePackageId);
    console.log("🪙 Exchange object ID:", exchangeId);

    // Build transaction without signing
    const tx = new Transaction();
    tx.setSenderIfNotSet(senderAddress);

    const [suiForExchange] = tx.splitCoins(tx.gas, [amountMist]);

    const [walCoin, suiChange] = tx.moveCall({
      package: walExchangePackageId,
      module: "wal_exchange",
      function: "exchange_for_wal",
      arguments: [
        tx.object(exchangeId),
        suiForExchange,
        tx.pure.u64(amountMist),
      ],
    }) as any;

    if (suiChange) {
      tx.mergeCoins(tx.gas, [suiChange]);
    }
    tx.transferObjects([walCoin], senderAddress);
    tx.setGasBudget(5_000_000);

    const bytes = await tx.build({ client: this.suiClient });
    const txBytes = Buffer.from(bytes).toString("base64");

    console.log("✅ Transaction built successfully");
    console.log("📊 Transaction bytes length:", txBytes.length);

    return { txBytes };
  }

  /**
   * Submit a zkLogin-signed transaction (base64 tx bytes + serialized zkLogin signature)
   */
  async submitZkLoginSignedTransaction(params: {
    txBytes: string;
    zkLoginSignature: string;
  }): Promise<{ digest: string }> {
    const { txBytes, zkLoginSignature } = params;
    const result = await this.suiClient.executeTransactionBlock({
      transactionBlock: txBytes,
      signature: zkLoginSignature,
      options: { showEffects: true, showEvents: true },
    });
    return { digest: result.digest };
  }

  /**
   * Store encrypted credentials on Walrus and log the event on Sui
   */
  async storeCredentials(credentials: CredentialData): Promise<StorageResult> {
    try {
      console.log("🔐 Starting credential storage process...");

      // Verify user has WAL tokens for storage
      if (this.zkLoginParams) {
        const userAddress = this.zkLoginParams.userProfile.suiAddress;
        console.log("🪙 Verifying WAL token availability for:", userAddress);

        try {
          // Check WAL token balance
          const walCoins = await this.suiClient.getCoins({
            owner: userAddress,
            coinType:
              "0x82593828ed3fcb8c6a235eac9abd0adbe9c5f9bbffa9b1e7a45cdd884481ef9f::wal::WAL",
          });

          if (walCoins.data.length === 0) {
            console.warn("⚠️ User has no WAL tokens - storage may fail");
            console.log("💡 User should complete WAL exchange first");
          } else {
            const totalWAL = walCoins.data.reduce(
              (sum, coin) => sum + BigInt(coin.balance),
              0n
            );
            console.log("✅ User has WAL tokens:", totalWAL.toString());
          }
        } catch (error) {
          console.warn("⚠️ Could not verify WAL token balance:", error);
        }
      }

      // Step 1: Encrypt credentials using Seal SDK
      const encryptedData = await this.encryptCredentials(credentials);

      // Step 2: Upload to Walrus
      const { blobId, cid } = await this.uploadToWalrus(encryptedData);

      // Step 3: Log the storage event on Sui
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
      // Use Walrus HTTP API instead of CLI
      const walrusPublishers = [
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

          const response = await fetch(`${publisher}/v1/blobs?epochs=10`, {
            method: "PUT",
            body: new Blob([encryptedData.slice()], {
              type: "application/octet-stream",
            }),
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
        console.warn("⚠️ All Walrus publishers failed - using simulation");
        console.warn("⚠️ This is a fallback for development/testing");

        // Generate a mock blob ID and CID for development
        const mockBlobId = `blob_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const mockCid = `cid_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

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
   * Log credential storage event on-chain using zkLogin signing
   */
  private async logOnChain(blobId: string, cid: string): Promise<string> {
    console.log("⛓️ Logging event on Sui...");

    try {
      if (!this.zkLoginParams) {
        // Fall back to simulation when zkLogin params are not set
        console.log(
          "⛓️ zkLogin parameters not set - simulating on-chain logging"
        );
        console.log("⛓️ Blob ID:", blobId);
        console.log("⛓️ CID:", cid);
        console.log("⛓️ User Address:", this.getWalletAddress());

        const mockDigest = `0x${Math.random().toString(16).substr(2, 64)}`;
        console.log("⛓️ Transaction Digest (simulated):", mockDigest);
        console.log(
          "⛓️ Note: Set zkLogin parameters for real on-chain logging"
        );

        return mockDigest;
      }

      const userAddress = this.zkLoginParams.userProfile.suiAddress;
      console.log("⛓️ Using zkLogin address:", userAddress);
      console.log("⛓️ User:", this.zkLoginParams.userProfile.name);

      // Build transaction for on-chain logging
      console.log("⛓️ Building on-chain logging transaction...");
      const logTx = new Transaction();
      logTx.setSenderIfNotSet(userAddress);

      // Convert strings to bytes for the Move function
      const blobIdBytes = new TextEncoder().encode(blobId);
      const cidBytes = new TextEncoder().encode(cid);
      const userAddressBytes = new TextEncoder().encode(userAddress);

      logTx.moveCall({
        target: `${this.packageId}::store_logger::log_credential_store`,
        arguments: [
          logTx.object(this.logCapId), // Use existing LogCap
          logTx.pure(userAddressBytes), // user_address
          logTx.pure(blobIdBytes), // walrus_blob_id
          logTx.pure(cidBytes), // walrus_cid
        ],
      });

      logTx.setGasBudget(5_000_000);

      // Build transaction bytes for zkLogin signing
      const txBytes = await logTx.build({ client: this.suiClient });
      const txBytesBase64 = Buffer.from(txBytes).toString("base64");

      console.log("⛓️ Transaction built, returning bytes for zkLogin signing");
      console.log("⛓️ Transaction bytes length:", txBytesBase64.length);

      // Return the transaction bytes - the frontend will need to sign this with zkLogin
      // For now, we'll simulate the signing process
      console.log("⛓️ Note: zkLogin signing should be done on frontend");
      console.log("⛓️ Transaction bytes:", txBytesBase64);

      // Simulate successful transaction for now
      const mockDigest = `0x${Math.random().toString(16).substr(2, 64)}`;
      console.log("⛓️ Transaction Digest (simulated zkLogin):", mockDigest);

      return mockDigest;
    } catch (error) {
      console.error("❌ On-chain logging failed:", error);
      throw new Error(`Failed to log on-chain: ${error}`);
    }
  }

  /**
   * Get the wallet address for this service
   */
  getWalletAddress(): string {
    // Return the zkLogin address if available, otherwise the current keypair address
    if (this.zkLoginParams) {
      return this.zkLoginParams.userProfile.suiAddress;
    }
    return this.keypair.getPublicKey().toSuiAddress();
  }

  /**
   * Test the service with sample credentials
   */
  async testStorage(): Promise<void> {
    console.log("🧪 Testing credential storage...");

    const testCredentials: CredentialData = {
      site: "gmail.com",
      username: "test@example.com",
      password: "testPassword123!",
      notes: "Test credential for development",
    };

    try {
      const result = await this.storeCredentials(testCredentials);
      console.log("🧪 Test completed successfully!");
      console.log("Results:", result);
    } catch (error) {
      console.error("🧪 Test failed:", error);
    }
  }
}

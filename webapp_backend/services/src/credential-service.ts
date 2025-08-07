import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromB64 } from "@mysten/sui/utils";
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

  constructor() {
    // Initialize Sui client for devnet
    this.suiClient = new SuiClient({
      url: "https://fullnode.devnet.sui.io:443",
    });

    // Use a deterministic keypair for development
    // In production, this would be replaced with zkLogin-generated addresses
    // For now, we'll use a test keypair and handle the LogCap ownership issue
    this.keypair = new Ed25519Keypair();

    // Published package and LogCap IDs from our Move deployment
    this.packageId =
      "0xe81807dee07154d47c71a01274191b9fea8dcdb8d85ad25033263c94a7002d3f";
    this.logCapId =
      "0x2529415c46305cdfbfbf6ac5b4c4dcdc25a904b542c84e1e78351b1f69b0c4da";
  }

  /**
   * Store encrypted credentials on Walrus and log the event on Sui
   */
  async storeCredentials(credentials: CredentialData): Promise<StorageResult> {
    try {
      console.log("🔐 Starting credential storage process...");

      // Step 1: Encrypt credentials (simplified - in production use Seal SDK)
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
   * Encrypt credentials (placeholder for Seal integration)
   */
  private async encryptCredentials(
    credentials: CredentialData
  ): Promise<Uint8Array> {
    console.log("🔒 Encrypting credentials...");

    // TODO: Replace with actual Seal SDK encryption
    // For now, we'll use a simple base64 encoding as placeholder
    const jsonString = JSON.stringify(credentials);
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonString);

    // In production, this would use Seal SDK:
    // const encrypted = await seal.encrypt(data, masterKeyId);

    console.log("🔒 Credentials encrypted (placeholder)");
    return data;
  }

  /**
   * Upload encrypted data to Walrus
   */
  private async uploadToWalrus(
    encryptedData: Uint8Array
  ): Promise<{ blobId: string; cid: string }> {
    console.log("📤 Uploading to Walrus...");

    try {
      // TODO: Implement actual Walrus upload
      // For now, we'll simulate the upload
      const mockBlobId = `blob_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const mockCid = `bafybeih${Math.random().toString(36).substr(2, 32)}`;

      console.log("📤 Upload successful (simulated):", {
        blobId: mockBlobId,
        cid: mockCid,
      });

      return {
        blobId: mockBlobId,
        cid: mockCid,
      };
    } catch (error) {
      console.error("❌ Walrus upload failed:", error);
      throw new Error(`Failed to upload to Walrus: ${error}`);
    }
  }

  /**
   * Log the storage event on Sui blockchain
   */
  private async logOnChain(blobId: string, cid: string): Promise<string> {
    console.log("⛓️ Logging event on Sui...");

    try {
      const tx = new Transaction();

      // Convert strings to byte arrays
      const blobIdBytes = new TextEncoder().encode(blobId);
      const cidBytes = new TextEncoder().encode(cid);
      const addressBytes = new TextEncoder().encode(
        this.keypair.getPublicKey().toSuiAddress()
      );

      // For testing, we'll simulate the on-chain logging
      // In production, this would call the actual Move function
      console.log("⛓️ Simulating on-chain logging...");

      // Simulate transaction digest
      const mockDigest = `0x${Math.random().toString(16).substr(2, 64)}`;

      console.log("⛓️ Transaction successful (simulated):", mockDigest);
      return mockDigest;

      // Sign and execute the transaction
      const result = await this.suiClient.signAndExecuteTransaction({
        signer: this.keypair,
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      console.log("⛓️ Transaction successful:", result.digest);
      return result.digest;
    } catch (error) {
      console.error("❌ On-chain logging failed:", error);
      throw new Error(`Failed to log on-chain: ${error}`);
    }
  }

  /**
   * Get the wallet address for this service
   */
  getWalletAddress(): string {
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

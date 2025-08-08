import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromB64 } from "@mysten/sui/utils";
import {
  getExtendedEphemeralPublicKey,
  getZkLoginSignature,
} from "@mysten/zklogin";
import {
  KEY_PAIR_SESSION_STORAGE_KEY,
  RANDOMNESS_SESSION_STORAGE_KEY,
  MAX_EPOCH_LOCAL_STORAGE_KEY,
  JWT_TOKEN_KEY,
  USER_SALT_LOCAL_STORAGE_KEY,
  SUI_PROVER_TESTNET_ENDPOINT,
} from "../constants/zklogin";
import { ZkLoginUserProfile } from "./zklogin";

export async function autoWalExchange(options: {
  senderAddress: string;
  amountMist?: number;
}): Promise<{ digest: string }> {
  const { senderAddress, amountMist = 500_000 } = options;

  console.log("🪙 [autoWalExchange] Starting WAL exchange for:", senderAddress);
  console.log("💰 [autoWalExchange] Amount:", amountMist, "MIST");

  // 1) Prepare tx on backend
  console.log("📡 [autoWalExchange] Preparing transaction on backend...");
  const prepareRes = await fetch(
    "http://localhost:3001/api/walrus/exchange/prepare",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderAddress, amountMist }),
    }
  );
  if (!prepareRes.ok) {
    throw new Error(`Prepare failed: ${await prepareRes.text()}`);
  }
  const { txBytes } = await prepareRes.json();
  console.log(
    "✅ [autoWalExchange] Received txBytes (base64 length):",
    txBytes.length
  );

  // 2) Load zkLogin state from storage
  console.log("🔑 [autoWalExchange] Loading zkLogin session data...");
  const jwtToken = localStorage.getItem(JWT_TOKEN_KEY);
  const userSalt = localStorage.getItem(USER_SALT_LOCAL_STORAGE_KEY);
  const randomness = sessionStorage.getItem(RANDOMNESS_SESSION_STORAGE_KEY);
  const maxEpochStr =
    localStorage.getItem(MAX_EPOCH_LOCAL_STORAGE_KEY) ??
    sessionStorage.getItem(MAX_EPOCH_LOCAL_STORAGE_KEY);
  const ephemeralPriv = sessionStorage.getItem(KEY_PAIR_SESSION_STORAGE_KEY);
  if (!jwtToken || !userSalt || !randomness || !maxEpochStr || !ephemeralPriv) {
    throw new Error("Missing zkLogin session data; please log in again.");
  }
  const maxEpoch = Number(maxEpochStr);
  console.log("✅ [autoWalExchange] zkLogin session data loaded");

  // 3) Recreate ephemeral key and fetch zk proof
  console.log("🔐 [autoWalExchange] Recreating ephemeral key...");
  const ephemeral = Ed25519Keypair.fromSecretKey(ephemeralPriv);
  const extended = getExtendedEphemeralPublicKey(ephemeral.getPublicKey());
  console.log("✅ [autoWalExchange] Ephemeral key ready");

  console.log("🔍 [autoWalExchange] Fetching zkLogin proof...");
  const proofRes = await fetch(SUI_PROVER_TESTNET_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jwt: jwtToken,
      extendedEphemeralPublicKey: extended,
      maxEpoch,
      jwtRandomness: randomness,
      salt: userSalt,
      keyClaimName: "sub",
    }),
  });
  if (!proofRes.ok) {
    throw new Error(`Proof fetch failed: ${await proofRes.text()}`);
  }
  const partial = await proofRes.json();
  console.log("✅ [autoWalExchange] zkLogin proof fetched");

  // 4) Create user signature and zkLogin signature
  console.log("✍️ [autoWalExchange] Creating user signature...");
  const { signature: userSignature } = await ephemeral.signTransaction(
    fromB64(txBytes)
  );
  console.log("✅ [autoWalExchange] User signature created");

  console.log("🔐 [autoWalExchange] Creating zkLogin signature...");
  console.log("🔐 [autoWalExchange] zkLogin signature inputs:", {
    partial,
    userSignature,
    maxEpoch,
  });

  // Validate all required parameters
  if (!partial) {
    throw new Error("ZK proof partial is undefined");
  }
  if (!userSignature) {
    throw new Error("User signature is undefined");
  }
  if (!maxEpoch) {
    throw new Error("Max epoch is undefined");
  }

  const zkLoginSignature = getZkLoginSignature({
    inputs: partial,
    userSignature,
    maxEpoch,
  });
  console.log(
    "✅ [autoWalExchange] zkLogin signature created (base64 length):",
    zkLoginSignature.length
  );

  // 5) Submit
  console.log("📤 [autoWalExchange] Submitting transaction...");
  const submitRes = await fetch(
    "http://localhost:3001/api/walrus/exchange/submit",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txBytes, zkLoginSignature }),
    }
  );
  if (!submitRes.ok) {
    throw new Error(`Submit failed: ${await submitRes.text()}`);
  }
  const { digest } = await submitRes.json();
  console.log("🎉 [autoWalExchange] Transaction submitted successfully!");
  console.log("📊 [autoWalExchange] Transaction digest:", digest);
  return { digest };
}

// Backend API configuration
const BACKEND_API_URL = "http://localhost:3001";

export interface CredentialData {
  site: string;
  username: string;
  password: string;
  notes?: string;
}

export interface StorageResult {
  blobId: string;
  cid: string;
  transactionDigest: string;
}

export interface BackendResponse {
  success: boolean;
  data: StorageResult;
  message: string;
}

export class BackendIntegrationService {
  /**
   * Extract zkLogin parameters from browser storage
   */
  static extractZkLoginParams(): {
    ephemeralPrivateKey: string;
    userProfile: ZkLoginUserProfile;
  } | null {
    try {
      // Get ephemeral private key from session storage
      const ephemeralPrivateKey = sessionStorage.getItem("zklogin-keypair");
      if (!ephemeralPrivateKey) {
        console.error("No ephemeral private key found in session storage");
        return null;
      }

      // Get user profile from localStorage
      const userProfileStr = localStorage.getItem("userProfile");
      if (!userProfileStr) {
        console.error("No user profile found in localStorage");
        return null;
      }

      const userProfile: ZkLoginUserProfile = JSON.parse(userProfileStr);

      return {
        ephemeralPrivateKey,
        userProfile,
      };
    } catch (error) {
      console.error("Failed to extract zkLogin parameters:", error);
      return null;
    }
  }

  /**
   * Store credentials with zkLogin integration
   */
  static async storeCredentials(
    credentials: CredentialData
  ): Promise<StorageResult> {
    try {
      console.log("🔐 Storing credentials with zkLogin integration...");

      // Extract zkLogin parameters
      const zkLoginParams = this.extractZkLoginParams();

      if (!zkLoginParams) {
        throw new Error(
          "zkLogin parameters not available. Please log in first."
        );
      }

      console.log("💰 zkLogin Address:", zkLoginParams.userProfile.suiAddress);
      console.log("👤 User:", zkLoginParams.userProfile.name);

      // Prepare request payload
      const payload = {
        credentials,
        zkLoginParams,
      };

      // Send request to backend
      const response = await fetch(`${BACKEND_API_URL}/api/store-credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result: BackendResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to store credentials");
      }

      console.log("✅ Credentials stored successfully!");
      console.log("📊 Results:", result.data);

      return result.data;
    } catch (error) {
      console.error("❌ Failed to store credentials:", error);
      throw error;
    }
  }

  /**
   * Store credentials without zkLogin (simulation mode)
   */
  static async storeCredentialsWithoutZkLogin(
    credentials: CredentialData
  ): Promise<StorageResult> {
    try {
      console.log("🔐 Storing credentials in simulation mode...");

      // Send request to backend without zkLogin params
      const payload = {
        credentials,
      };

      const response = await fetch(`${BACKEND_API_URL}/api/store-credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result: BackendResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to store credentials");
      }

      console.log("✅ Credentials stored successfully (simulation mode)!");
      console.log("📊 Results:", result.data);

      return result.data;
    } catch (error) {
      console.error("❌ Failed to store credentials:", error);
      throw error;
    }
  }

  /**
   * Check backend service status
   */
  static async checkBackendStatus(): Promise<{
    status: string;
    walletAddress: string;
    hasZkLoginParams: boolean;
  }> {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/status`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Failed to check backend status:", error);
      throw error;
    }
  }
}

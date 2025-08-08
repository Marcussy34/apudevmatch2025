/**
 * Backend Integration Service for Grand Warden
 * Simplified for Enoki SDK integration
 */

import { Transaction } from "@mysten/sui/transactions";
import { TESTNET_WALRUS_PACKAGE_CONFIG } from "@mysten/walrus";

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

interface BackendResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface WalBalanceResponse {
  hasTokens: boolean;
  balance: string;
}

/**
 * Store credentials in Walrus via backend
 * Enoki handles all wallet management and transaction signing
 */
export async function storeCredentials(
  credentials: CredentialData,
  userAddress?: string
): Promise<StorageResult> {
  console.log("🔐 [backend] Storing credentials:", credentials.site);

  try {
    const response = await fetch(
      "http://localhost:3001/api/store-credentials",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credentials, userAddress }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${errorText}`);
    }

    const result: BackendResponse<StorageResult> = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Backend returned failure");
    }

    console.log("✅ [backend] Credentials stored successfully:", result.data);
    return result.data!;
  } catch (error) {
    console.error("❌ [backend] Failed to store credentials:", error);
    throw error;
  }
}

/**
 * Prepare WAL exchange transaction for Enoki signing
 */
export async function prepareWalExchange(
  userAddress: string,
  amountMist: number = 1_000_000
): Promise<{ txBytes: string }> {
  console.log("🪙 [backend] Preparing WAL exchange for:", userAddress);

  try {
    const response = await fetch(
      "http://localhost:3001/api/walrus/exchange/prepare",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userAddress, amountMist }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${errorText}`);
    }

    const result: BackendResponse<{ txBytes: string }> = await response.json();
    console.log("🔍 [backend] Raw response:", result);

    if (!result.success) {
      throw new Error(result.error || "Backend returned failure");
    }

    if (!result.data || !result.data.txBytes) {
      console.error("❌ [backend] Invalid response structure:", result);
      throw new Error(
        "Backend returned invalid response structure - missing txBytes"
      );
    }

    console.log("✅ [backend] WAL exchange transaction prepared");
    console.log("📊 [backend] txBytes length:", result.data.txBytes.length);
    return result.data;
  } catch (error) {
    console.error("❌ [backend] Failed to prepare WAL exchange:", error);
    throw error;
  }
}

/**
 * Submit signed WAL exchange transaction
 */
export async function submitWalExchange(
  txBytes: string,
  signature: string
): Promise<{ digest: string }> {
  console.log("📤 [backend] Submitting signed WAL exchange transaction");

  try {
    const response = await fetch(
      "http://localhost:3001/api/walrus/exchange/submit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ txBytes, signature }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${errorText}`);
    }

    const result: BackendResponse<{ digest: string }> = await response.json();
    console.log("🔍 [backend] Submit response:", result);

    if (!result.success) {
      throw new Error(result.error || "Backend returned failure");
    }

    if (!result.data || !result.data.digest) {
      console.error("❌ [backend] Invalid submit response structure:", result);
      throw new Error(
        "Backend returned invalid response structure - missing digest"
      );
    }

    console.log(
      "✅ [backend] WAL exchange submitted successfully:",
      result.data
    );
    return result.data;
  } catch (error) {
    console.error("❌ [backend] Failed to submit WAL exchange:", error);
    throw error;
  }
}

/**
 * Check WAL token balance for a user
 */
export async function checkWalBalance(
  userAddress: string
): Promise<WalBalanceResponse> {
  console.log("🪙 [backend] Checking WAL balance for:", userAddress);

  try {
    const response = await fetch(
      `http://localhost:3001/api/walrus/balance/${userAddress}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${errorText}`);
    }

    const result: BackendResponse<WalBalanceResponse> = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Backend returned failure");
    }

    console.log("✅ [backend] WAL balance checked:", result.data);
    return result.data!;
  } catch (error) {
    console.error("❌ [backend] Failed to check WAL balance:", error);
    throw error;
  }
}

/**
 * Complete WAL exchange flow using Enoki wallet
 */
export async function completeWalExchange(
  userAddress: string,
  signAndExecuteTransaction: any,
  amountMist: number = 1_000_000
): Promise<{ digest: string }> {
  console.log("🪙 [walrus] Starting WAL exchange flow for:", userAddress);

  try {
    // Step 1: Get transaction bytes from backend (which works)
    console.log("📋 [walrus] Step 1: Getting transaction from backend...");
    const { txBytes } = await prepareWalExchange(userAddress, amountMist);

    // Step 2: Convert transaction bytes to Transaction object
    console.log(
      "🔄 [walrus] Step 2: Converting transaction bytes to Transaction object..."
    );
    const transactionBytes = Uint8Array.from(atob(txBytes), (c) =>
      c.charCodeAt(0)
    );
    const transaction = Transaction.from(transactionBytes);

    // Step 3: Sign and execute with Enoki using dapp-kit hook
    console.log("✍️ [walrus] Step 3: Signing and executing with Enoki...");

    // Use the signAndExecuteTransaction hook as shown in Enoki docs
    const result = await signAndExecuteTransaction({
      transaction: transaction,
    });

    console.log("🎉 [walrus] WAL exchange completed successfully!");
    console.log("📊 [walrus] Transaction result:", result);

    return { digest: result.digest };
  } catch (error) {
    console.error("❌ [walrus] WAL exchange failed:", error);
    throw error;
  }
}

/**
 * Get backend service status
 */
export async function getBackendStatus(): Promise<{
  status: string;
  walletAddress: string;
  hasSealClient: boolean;
}> {
  try {
    const response = await fetch("http://localhost:3001/api/status");

    if (!response.ok) {
      throw new Error(`Backend status check failed: ${response.status}`);
    }

    const result = await response.json();
    console.log("📊 [backend] Status:", result);
    return result;
  } catch (error) {
    console.error("❌ [backend] Status check failed:", error);
    throw error;
  }
}

/**
 * Health check for backend connectivity
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch("http://localhost:3001/health");
    return response.ok;
  } catch (error) {
    console.error("❌ [backend] Health check failed:", error);
    return false;
  }
}

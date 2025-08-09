/**
 * Backend Integration Service for Grand Warden
 * Simplified for Enoki SDK integration
 */

import { Transaction } from "@mysten/sui/transactions";
import { WalrusClient, WalrusFile } from "@mysten/walrus";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { toB64, fromB64 } from "@mysten/sui/utils";
import walrusWasmUrl from "@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url";

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

// Current WAL coin type used by Walrus testnet
export const CURRENT_WAL_COIN_TYPE =
  "0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL";

export const WAL_BASE_UNITS = 1_000_000_000n; // 1 WAL = 1e9 base units (FROST)

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

// --- Walrus write flow (frontend, Enoki signs) ---

export async function encryptOnlyPrecheck(
  credentials: CredentialData
): Promise<{
  ciphertextB64: string;
  size: number;
  estimatedWalHuman: number;
  estimatedWalBaseUnits: string;
}> {
  const resp = await fetch("http://localhost:3001/api/encrypt-only", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credentials, lean: true }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  const result: BackendResponse<{
    ciphertextB64: string;
    size: number;
    estimatedWalHuman: number;
    estimatedWalBaseUnits: string;
  }> = await resp.json();
  if (!result.success || !result.data)
    throw new Error(result.error || "encrypt-only precheck failed");
  return result.data;
}

async function encryptOnly(credentials: CredentialData): Promise<string> {
  const resp = await fetch("http://localhost:3001/api/encrypt-only", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credentials }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  const result: BackendResponse<{ ciphertextB64: string }> = await resp.json();
  if (!result.success || !result.data)
    throw new Error(result.error || "encrypt-only failed");
  return result.data.ciphertextB64;
}

let cachedClients: { suiClient: SuiClient; walrus: any } | undefined;
function getWalrusClient() {
  if (cachedClients) return cachedClients;
  const suiClient = new SuiClient({
    url: getFullnodeUrl("testnet"),
    network: "testnet",
  });
  const extended = suiClient.$extend(
    WalrusClient.experimental_asClientExtension({
      uploadRelay: {
        host: "https://upload-relay.testnet.walrus.space",
        // tip in MIST to reduce relay throttling/timeouts
        sendTip: { max: 5000000 },
      },
      // increase timeouts and surface inner storage errors
      storageNodeClientOptions: {
        timeout: 180_000,
        onError: (error: any) =>
          console.warn("[Walrus storage node error]", error?.message || error),
      },
      wasmUrl: walrusWasmUrl,
    })
  );
  // Some versions expose methods directly; others under `.walrus`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walrus: any = (extended as any).writeFilesFlow
    ? extended
    : (extended as any).walrus;
  if (!walrus?.writeFilesFlow) {
    throw new Error("Walrus API not available on client – check SDK version");
  }
  cachedClients = { suiClient, walrus };
  return cachedClients;
}

async function getWalBalances(
  userAddress: string,
  suiClient: SuiClient
): Promise<{
  total: bigint;
  largest: { coinObjectId: string; balance: bigint } | null;
}> {
  let cursor: string | null | undefined = undefined;
  let total = 0n;
  const coins: { coinObjectId: string; balance: bigint }[] = [];
  do {
    const res = await suiClient.getCoins({
      owner: userAddress,
      coinType: CURRENT_WAL_COIN_TYPE,
      cursor,
    });
    for (const c of res.data) {
      const bal = BigInt(c.balance);
      total += bal;
      coins.push({ coinObjectId: c.coinObjectId, balance: bal });
    }
    cursor = res.nextCursor;
  } while (cursor);
  const largest = coins.length
    ? coins.reduce((a, b) => (a.balance > b.balance ? a : b))
    : null;
  return { total, largest };
}

/**
 * Merge WAL coin objects until there is at least one coin >= required amount.
 */
async function mergeWalCoinsIfNeeded(
  userAddress: string,
  requiredBaseUnits: bigint,
  signTransaction: any,
  suiClient: SuiClient,
  signAndExecute?: any
): Promise<void> {
  // Fetch WAL coins for current type
  let cursor: string | null | undefined = undefined;
  const coins: { coinObjectId: string; balance: bigint }[] = [];
  do {
    const res = await suiClient.getCoins({
      owner: userAddress,
      coinType: CURRENT_WAL_COIN_TYPE,
      cursor,
    });
    for (const c of res.data) {
      coins.push({ coinObjectId: c.coinObjectId, balance: BigInt(c.balance) });
    }
    cursor = res.nextCursor;
  } while (cursor);

  if (coins.length === 0) return;

  // If any single coin already satisfies requirement, we're done
  const largest = coins.reduce((a, b) => (a.balance > b.balance ? a : b));
  if (largest.balance >= requiredBaseUnits) return;

  // Merge ALL other coins into the largest in one shot
  const sources = coins
    .filter((c) => c.coinObjectId !== largest.coinObjectId)
    .map((c) => c.coinObjectId);
  if (sources.length === 0) return;

  const tx = new Transaction();
  tx.setSender(userAddress);
  tx.mergeCoins(
    tx.object(largest.coinObjectId),
    sources.map((id) => tx.object(id))
  );

  await sponsorAndExecuteTransaction(
    tx,
    userAddress,
    signTransaction,
    suiClient,
    { useSponsor: false, signAndExecute }
  );
}

/**
 * Get WAL balance for the specific, current WAL coin type
 */
export async function checkWalBalanceByType(
  userAddress: string,
  coinType: string = CURRENT_WAL_COIN_TYPE
): Promise<bigint> {
  const { suiClient } = getWalrusClient();
  let cursor: string | null | undefined = undefined;
  let total: bigint = 0n;
  do {
    const res = await suiClient.getCoins({
      owner: userAddress,
      coinType,
      cursor,
    });
    for (const c of res.data) total += BigInt(c.balance);
    cursor = res.nextCursor;
  } while (cursor);
  return total;
}

async function sponsorAndExecuteTransaction(
  tx: any,
  userAddress: string,
  signTransaction: any,
  suiClient: SuiClient,
  opts?: { useSponsor?: boolean; signAndExecute?: any }
): Promise<string> {
  // Ensure sender is set for correct coin selection (WAL coins)
  if (typeof tx.setSender === "function") {
    tx.setSender(userAddress);
  }

  // Non-sponsored path: sign and execute directly with the wallet
  if (opts?.useSponsor === false) {
    if (!opts?.signAndExecute) {
      throw new Error("signAndExecute is required when useSponsor is false");
    }
    const result = await opts.signAndExecute({ transaction: tx });
    return result.digest as string;
  }

  let bytes: Uint8Array;
  try {
    bytes = await tx.build({
      client: suiClient,
      onlyTransactionKind: true,
    });
  } catch (e) {
    console.error("[Walrus] tx.build failed for sender", userAddress, e);
    throw e;
  }
  // Determine allow-listing strategy for Enoki
  const targets: string[] = extractTargetsFromTx(tx);
  const dataForLog = tx.getData?.();
  const hasIntents = Array.isArray((dataForLog as any)?.commands)
    ? (dataForLog as any).commands.some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any) => c && typeof c === "object" && "$Intent" in c
      )
    : false;
  if (hasIntents) {
    console.log(
      "[Enoki Allow-List] Intent-only PTB detected (no MoveCall targets)",
      dataForLog
    );
  } else if (targets.length > 0) {
    console.log("[Enoki Allow-List] Move targets:", targets);
  } else {
    console.log(
      "[Enoki Allow-List] No MoveCall targets detected; proceeding with address-only allow-list",
      dataForLog
    );
  }

  const sponsorBody: any = {
    transactionKindBytesB64: toB64(bytes),
    sender: userAddress,
    // Always include address allow-list to satisfy portal policies
    allowedAddresses: [userAddress],
  };
  // Only include allowedMoveCallTargets when real MoveCall targets exist
  if (!hasIntents && targets.length > 0) {
    sponsorBody.allowedMoveCallTargets = targets;
  }

  const sponsorResp = await fetch("http://localhost:3001/api/walrus/sponsor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sponsorBody),
  });
  const sponsorText = await sponsorResp.text();
  console.log("[Sponsor] HTTP", sponsorResp.status, sponsorText);
  if (!sponsorResp.ok) {
    console.error("Sponsorship failed (HTTP):", sponsorText);
    throw new Error(sponsorText);
  }
  let sponsorJson: any;
  try {
    sponsorJson = JSON.parse(sponsorText);
  } catch (e) {
    console.error("Sponsorship parse error:", e);
    throw new Error("Invalid sponsor JSON: " + sponsorText);
  }
  if (
    !sponsorJson?.success ||
    !sponsorJson?.data?.bytes ||
    !sponsorJson?.data?.digest
  ) {
    throw new Error(
      `Sponsorship failed: ${
        typeof sponsorJson === "string"
          ? sponsorJson
          : JSON.stringify(sponsorJson)
      }`
    );
  }
  const { bytes: sponsoredBytes, digest } = sponsorJson.data;
  let signResult: any;
  try {
    signResult = await signTransaction({
      transaction: Transaction.from(fromB64(sponsoredBytes)),
    });
  } catch (e) {
    console.error("Wallet signTransaction error:", e);
    throw e;
  }
  if (!signResult?.signature)
    throw new Error("No signature returned by wallet");
  const execResp = await fetch("http://localhost:3001/api/walrus/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ digest, signature: signResult.signature }),
  });
  const execText = await execResp.text();
  console.log("[Execute] HTTP", execResp.status, execText);
  if (!execResp.ok) {
    console.error("Execute failed (HTTP):", execText);
    throw new Error(execText);
  }
  let execJson: any;
  try {
    execJson = JSON.parse(execText);
  } catch (e) {
    console.error("Execute parse error:", e);
    throw new Error("Invalid execute JSON: " + execText);
  }
  if (!execJson?.success) {
    throw new Error(
      `Execute failed: ${
        typeof execJson === "string" ? execJson : JSON.stringify(execJson)
      }`
    );
  }
  return digest as string;
}

// Extract move call targets from a Transaction (helper for discovery)
function extractTargetsFromTx(tx: any): string[] {
  try {
    const data = tx.getData();
    const targets: string[] = [];
    // New PTB shape uses `commands`
    if (Array.isArray((data as any)?.commands)) {
      for (const cmd of (data as any).commands) {
        if (cmd && typeof cmd === "object" && "MoveCall" in cmd) {
          const mc = (cmd as any).MoveCall;
          if (mc?.package && mc?.module && mc?.function) {
            targets.push(`${mc.package}::${mc.module}::${mc.function}`);
          }
        }
      }
    }
    // Older shape uses `transactions`
    if (targets.length === 0 && Array.isArray((data as any)?.transactions)) {
      for (const t of (data as any).transactions) {
        if (t && typeof t === "object" && "MoveCall" in t) {
          const mc = (t as any).MoveCall;
          if (mc?.package && mc?.module && mc?.function) {
            targets.push(`${mc.package}::${mc.module}::${mc.function}`);
          }
        }
      }
    }
    return targets;
  } catch {
    return [];
  }
}

// Build minimal Walrus PTBs and return move targets without executing them
export async function discoverWalrusTargets(
  userAddress: string
): Promise<string[]> {
  const { walrus } = getWalrusClient();
  const probe = new Uint8Array([0]);
  const flow = walrus.writeFilesFlow({
    files: [WalrusFile.from({ contents: probe, identifier: "probe" })],
  });
  await flow.encode();
  const registerTx = flow.register({
    epochs: 1,
    owner: userAddress,
    deletable: false,
  });
  const certifyTx = flow.certify({ owner: userAddress });
  const targets = [
    ...extractTargetsFromTx(registerTx),
    ...extractTargetsFromTx(certifyTx),
  ];
  const unique = Array.from(new Set(targets));
  console.log("[Enoki Allow-List] Discovered Walrus targets:", unique);
  return unique;
}

export async function writeCredentialsToWalrus(
  credentials: CredentialData,
  userAddress: string,
  signTransaction: any,
  ciphertextB64?: string,
  signAndExecute?: any
): Promise<{ blobId: string }> {
  if (!signAndExecute) {
    throw new Error(
      "signAndExecute callback is required for Walrus register/certify"
    );
  }
  // 1) Encrypt via backend (reuse precheck ciphertext if provided)
  const b64 = ciphertextB64 ?? (await encryptOnly(credentials));
  if (!b64 || b64.length === 0) {
    throw new Error("encrypt-only returned empty ciphertext");
  }
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  if (!bytes || bytes.length === 0) {
    throw new Error("No payload bytes to encode");
  }

  // 2) Walrus write flow
  const { suiClient, walrus } = getWalrusClient();
  const flow = walrus.writeFilesFlow({
    files: [
      WalrusFile.from({ contents: bytes, identifier: "credential.json" }),
    ],
  });
  const encRes = await flow.encode();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flowAny: any = flow as any;
  console.log("[Walrus] flow.encode complete", {
    bytes: bytes.length,
    encResKeys: encRes ? Object.keys(encRes as any) : [],
    flowKeys: Object.keys(flowAny || {}),
  });

  // For intent-based PTBs, required WAL cannot be extracted reliably.
  // Consolidate all WAL coins up-front so tx.build can select a single coin.
  try {
    const beforeAll = await getWalBalances(userAddress, suiClient);
    await mergeWalCoinsIfNeeded(
      userAddress,
      beforeAll.total, // merge all small coins into largest
      signTransaction,
      suiClient,
      signAndExecute
    );
    await new Promise((r) => setTimeout(r, 1200));
    const afterAll = await getWalBalances(userAddress, suiClient);
    console.log(
      "[Walrus] consolidated before register total:",
      afterAll.total.toString(),
      "largest:",
      afterAll.largest?.balance.toString()
    );
  } catch (e) {
    console.warn("[Walrus] consolidate step before register skipped:", e);
  }

  // Execute register via flow so it records the digest internally
  console.log("[Walrus] register: callback-style execution");
  let registerDigest: string = "";
  await (flow as any).register(
    { epochs: 1, owner: userAddress, deletable: false },
    {
      signAndExecute: async (tx: any) => {
        const res = await signAndExecute({ transaction: tx });
        console.log("[Walrus] register: wallet result:", res);
        if (!res || !res.digest) throw new Error("Register returned no digest");
        registerDigest = res.digest as string;
        return res;
      },
    }
  );

  // Use SDK flow upload with the register digest so flow has the context
  // Upload with one retry on TimeoutError, then publisher fallback
  try {
    await (flow as any).upload({ digest: registerDigest });
  } catch (e: any) {
    const msg = e?.message || String(e);
    console.warn("[Walrus] upload() failed (first attempt):", msg);
    // optional reset if available
    try {
      (walrus as any)?.reset?.();
    } catch {}
    // small backoff
    await new Promise((r) => setTimeout(r, 1500));
    try {
      await (flow as any).upload({ digest: registerDigest });
    } catch (e2: any) {
      console.warn(
        "[Walrus] upload() failed again, attempting publisher fallback:",
        e2?.message || e2
      );
      // Fallback to HTTP Publisher API per docs
      const publisherUrl =
        "https://publisher.walrus-testnet.walrus.space/v1/blobs" +
        `?epochs=1&deletable=false&send_object_to=${encodeURIComponent(
          userAddress
        )}`;
      const resp = await fetch(publisherUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: bytes,
      });
      const bodyText = await resp.text();
      if (!resp.ok)
        throw new Error(bodyText || `Publisher HTTP ${resp.status}`);
      let bodyJson: any;
      try {
        bodyJson = JSON.parse(bodyText);
      } catch {
        throw new Error("Publisher returned non-JSON: " + bodyText);
      }
      const fallbackBlobId =
        bodyJson?.newlyCreated?.blobObject?.blobId ||
        bodyJson?.newlyCreated?.blobId ||
        bodyJson?.alreadyCertified?.blobId ||
        "";
      if (!fallbackBlobId)
        throw new Error("Publisher response missing blobId: " + bodyText);
      // Short-circuit: return immediately with publisher blobId (publisher certifies itself)
      return { blobId: fallbackBlobId };
    }
  }

  // Execute certify via flow so it records the digest internally
  console.log("[Walrus] certify: callback-style execution");
  const certifyResult = await (flow as any).certify(
    { owner: userAddress },
    {
      signAndExecute: async (tx: any) => {
        const res = await signAndExecute({ transaction: tx });
        console.log("[Walrus] certify: wallet result:", res);
        if (!res || !res.digest) throw new Error("Certify returned no digest");
        return res;
      },
    }
  );

  // Verify certify transaction on-chain (optional diagnostics)
  try {
    const certTx = await suiClient.getTransactionBlock({
      digest: certifyResult.digest,
      options: { showEffects: true, showEvents: true },
    });
    console.log("[Walrus] certify tx status:", certTx.effects?.status);
    console.log("[Walrus] certify events:", certTx.events);
  } catch (e) {
    console.warn("[Walrus] certify tx fetch failed:", e);
  }

  // After certify, list files to get blob id (per docs)
  let finalBlobId = "";
  try {
    const files = await flowAny.listFiles?.();
    if (Array.isArray(files) && files.length > 0) {
      finalBlobId = (files[0] as any).blobId || (files[0] as any).id || "";
    }
  } catch (e) {
    console.warn("[Walrus] listFiles() failed after certify:", e);
  }
  if (!finalBlobId) {
    // as a last resort try older shapes
    finalBlobId =
      (encRes as any)?.blobId ||
      (encRes as any)?.files?.[0]?.blobId ||
      flowAny?.blobId ||
      flowAny?.files?.[0]?.blobId ||
      "";
  }
  if (!finalBlobId) throw new Error("Failed to determine blobId after certify");
  return { blobId: finalBlobId };
}

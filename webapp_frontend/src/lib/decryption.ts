import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { SealClient, SessionKey, getAllowlistedKeyServers } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
import { TESTNET_WALRUS_PACKAGE_CONFIG, WalrusClient } from "@mysten/walrus";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import walrusWasmUrl from "@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url";
const API_BASE = (import.meta as any).env?.VITE_API_BASE as string | undefined;

const SEAL_PACKAGE_ID = (import.meta as any).env
  ?.VITE_SEAL_PACKAGE_ID as string;
const SEAL_POLICY_ID = (import.meta as any).env?.VITE_SEAL_POLICY_ID as string; // hex identity used at encrypt
const SEAL_APPROVE_MODULE = (import.meta as any).env
  ?.VITE_SEAL_APPROVE_MODULE as string; // e.g. "patterns::tle"

async function getWalrusPackageId(suiClient: SuiClient): Promise<string> {
  const sysId = TESTNET_WALRUS_PACKAGE_CONFIG.systemObjectId;
  const obj = await suiClient.getObject({
    id: sysId,
    options: { showType: true },
  });
  const type = (obj as any)?.data?.type as string;
  return type.split("::")[0];
}

async function listUserWalrusObjectIds(
  suiClient: SuiClient,
  owner: string
): Promise<string[]> {
  const pkgId = await getWalrusPackageId(suiClient);
  const result: string[] = [];
  let cursor: string | null = null;
  do {
    const page = await suiClient.getOwnedObjects({
      owner,
      cursor: cursor ?? undefined,
      limit: 50,
      options: { showType: true },
    });
    for (const it of page.data) {
      const t = (it as any)?.data?.type as string | undefined;
      if (
        t &&
        t.startsWith(pkgId) &&
        (t.includes("::blob::Blob") || t.includes("::shared_blob::SharedBlob"))
      ) {
        result.push((it as any).data.objectId);
      }
    }
    cursor = page.hasNextPage ? page.nextCursor ?? null : null;
  } while (cursor);
  return result;
}

function u256DecimalToBase64Url(dec: string): string {
  let v = BigInt(dec);
  const bytes = new Uint8Array(32);
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(v & 0xffn);
    v = v >> 8n;
  }
  // base64url encode
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function readCredentialFileBytes(
  suiClient: SuiClient,
  objectId: string
): Promise<Uint8Array> {
  // Resolve blobId from on-chain object
  const obj = await suiClient.getObject({
    id: objectId,
    options: { showContent: true },
  });
  const content = (obj as any)?.data?.content;
  const fields = content?.fields ?? {};
  // Handle both Blob and SharedBlob shapes (SharedBlob stores inner Blob under `blob`)
  const metaFields = (fields as any)?.blob?.fields ?? fields;
  // Prefer certified info if present, but do not hard-fail if missing
  // const cert = (metaFields as any)?.certified_epoch ?? (metaFields as any)?.certifiedEpoch;
  // Derive blob id (decimal) from either root or nested blob
  const blobIdDec: string | undefined =
    metaFields?.blob_id ?? metaFields?.blobId ?? metaFields?.blobid;
  if (!blobIdDec) throw new Error("blob_id not found on object");
  const blobId = u256DecimalToBase64Url(String(blobIdDec));

  const walrus = new WalrusClient({
    network: "testnet",
    suiClient,
    wasmUrl: walrusWasmUrl,
  });
  const blob = await walrus.getBlob({ blobId });
  const files = await blob.files();
  // Prefer our known identifier
  let file = files[0];
  for (const f of files) {
    const id = await f.getIdentifier();
    if (id === "credential.json") {
      file = f;
      break;
    }
  }
  return await file.bytes();
}

async function decryptWithSeal(
  suiClient: SuiClient,
  userAddress: string,
  encrypted: Uint8Array,
  signPersonalMessage: (args: {
    message: Uint8Array;
  }) => Promise<{ signature: string }>,
  idHexOverride?: string
) {
  const seal = new SealClient({
    suiClient,
    serverConfigs: getAllowlistedKeyServers("testnet").map((id) => ({
      objectId: id,
      weight: 1,
    })),
  });

  const sessionKey = new SessionKey({
    address: userAddress,
    packageId: SEAL_PACKAGE_ID,
    ttlMin: 1,
    suiClient,
  });
  const pm = sessionKey.getPersonalMessage();
  const { signature } = await signPersonalMessage({ message: pm });
  sessionKey.setPersonalMessageSignature(signature);

  const tx = new Transaction();
  // Approve per your policy module
  tx.moveCall({
    target: `${SEAL_PACKAGE_ID}::${SEAL_APPROVE_MODULE}::seal_approve`,
    arguments: [
      // Pass the same id identity bytes you used at encrypt
      tx.pure.vector(
        "u8",
        Array.from(
          (() => {
            const chosen =
              idHexOverride && idHexOverride.length > 0
                ? idHexOverride
                : SEAL_POLICY_ID || "";
            const s = chosen.replace(/^0x/, "");
            const out = new Uint8Array(s.length / 2);
            for (let i = 0; i < out.length; i++)
              out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
            return out;
          })()
        )
      ),
      // Many policies (e.g., TLE) require the Sui clock shared object
      tx.object("0x6"),
    ],
  });
  const txBytes = await tx.build({
    client: suiClient,
    onlyTransactionKind: true,
  });

  return await seal.decrypt({ data: encrypted, sessionKey, txBytes });
}

export async function getAllUserCredentials(
  userAddress: string,
  signPersonalMessage: (args: {
    message: Uint8Array;
  }) => Promise<{ signature: string }>
) {
  const suiClient = new SuiClient({
    url:
      (import.meta as any).env?.VITE_SUI_RPC_URL || getFullnodeUrl("testnet"),
    network: "testnet",
  });
  const objectIds = await listUserWalrusObjectIds(suiClient, userAddress);
  const results: Array<{
    objectId: string;
    plaintext: Uint8Array;
    text: string;
    json?: any;
  }> = [];
  for (const oid of objectIds) {
    const plain = await (async () => {
      const attempts = 3;
      let lastErr: any;
      for (let i = 0; i < attempts; i++) {
        try {
          const enc = await readCredentialFileBytes(suiClient, oid);
          return await decryptWithSeal(
            suiClient,
            userAddress,
            enc,
            signPersonalMessage
          );
        } catch (e: any) {
          const msg = String(e?.message || e);
          if (
            msg.includes("BlobNotCertified") ||
            msg.includes("blob_not_certified")
          ) {
            // Wait and retry certification propagation
            await new Promise((r) => setTimeout(r, 2000));
            lastErr = e;
            continue;
          }
          throw e;
        }
      }
      throw lastErr || new Error("BlobNotCertifiedError");
    })();
    const text = new TextDecoder().decode(plain);
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {}
    results.push({ objectId: oid, plaintext: plain, text, json });
  }
  return results;
}

export async function getCredentialByBlobId(
  blobId: string,
  userAddress: string,
  signPersonalMessage: (args: {
    message: Uint8Array;
  }) => Promise<{ signature: string }>
) {
  const suiClient = new SuiClient({
    url:
      (import.meta as any).env?.VITE_SUI_RPC_URL || getFullnodeUrl("testnet"),
    network: "testnet",
  });
  const walrus = new WalrusClient({
    network: "testnet",
    suiClient,
    wasmUrl: walrusWasmUrl,
  });
  const blob = await walrus.getBlob({ blobId });
  let files = await blob.files({ identifiers: ["credential.json"] });
  if (!files.length) files = await blob.files();
  const file = files[0];
  const encrypted = await file.bytes();
  const plaintext = await decryptWithSeal(
    suiClient,
    userAddress,
    encrypted,
    signPersonalMessage
  );
  const text = new TextDecoder().decode(plaintext);
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {}
  return { plaintext, text, json };
}

export async function getCredentialByBlobIdViaProxy(
  blobId: string,
  userAddress: string,
  signPersonalMessage: (args: {
    message: Uint8Array;
  }) => Promise<{ signature: string }>,
  idHexOverride?: string
) {
  if (!API_BASE) throw new Error("API base not configured");
  const r = await fetch(
    `${API_BASE}/api/quilt/${encodeURIComponent(
      blobId
    )}/credential?attempts=12&delayMs=3000`
  );
  if (!r.ok) {
    let info: any = undefined;
    try {
      info = await r.json();
    } catch {}
    const msg = info?.error || info?.message || r.statusText;
    throw new Error(`proxy_read_failed:${r.status}${msg ? ":" + msg : ""}`);
  }
  const encrypted = new Uint8Array(await r.arrayBuffer());
  const suiClient = new SuiClient({
    url:
      (import.meta as any).env?.VITE_SUI_RPC_URL || getFullnodeUrl("testnet"),
    network: "testnet",
  });
  const plaintext = await decryptWithSeal(
    suiClient,
    userAddress,
    encrypted,
    signPersonalMessage,
    idHexOverride
  );
  const text = new TextDecoder().decode(plaintext);
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {}
  return { plaintext, text, json };
}

export async function getAllUserCredentialsViaProxy(
  userAddress: string,
  signPersonalMessage: (args: {
    message: Uint8Array;
  }) => Promise<{ signature: string }>
) {
  const suiClient = new SuiClient({
    url:
      (import.meta as any).env?.VITE_SUI_RPC_URL || getFullnodeUrl("testnet"),
    network: "testnet",
  });
  const objectIds = await listUserWalrusObjectIds(suiClient, userAddress);
  const results: Array<{
    objectId: string;
    blobId: string;
    plaintext: Uint8Array;
    text: string;
    json?: any;
  }> = [];
  for (const oid of objectIds) {
    // Resolve blobId from object
    const obj = await suiClient.getObject({
      id: oid,
      options: { showContent: true },
    });
    const content = (obj as any)?.data?.content;
    const fields = content?.fields ?? {};
    const metaFields = (fields as any)?.blob?.fields ?? fields;
    const dec = metaFields?.blob_id ?? metaFields?.blobId ?? metaFields?.blobid;
    if (!dec) continue;
    const blobId = u256DecimalToBase64Url(String(dec));
    // Read via backend proxy and decrypt
    try {
      const { plaintext, text, json } = await getCredentialByBlobIdViaProxy(
        blobId,
        userAddress,
        signPersonalMessage
      );
      results.push({ objectId: oid, blobId, plaintext, text, json });
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (
        msg.includes("BlobNotCertified") ||
        msg.includes("blob_not_certified")
      ) {
        // skip for now
        continue;
      }
      throw e;
    }
  }
  return results;
}

export async function getCredentialBytesViaProxy(blobId) {
  const attempts = Number(process.env.NEXT_PUBLIC_WALRUS_RETRY_ATTEMPTS || 20);
  const delayMs = Number(process.env.NEXT_PUBLIC_WALRUS_RETRY_DELAY_MS || 4000);
  const r = await fetch(
    `/api/quilt/${encodeURIComponent(
      blobId
    )}/credential?attempts=${attempts}&delayMs=${delayMs}`
  );
  if (!r.ok) {
    let info = null;
    try {
      info = await r.json();
    } catch {}
    const msg = info?.error || info?.message || r.statusText;
    throw new Error(`proxy_read_failed:${r.status}${msg ? ":" + msg : ""}`);
  }
  return new Uint8Array(await r.arrayBuffer());
}

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { SealClient, SessionKey, getAllowlistedKeyServers } from "@mysten/seal";

function hexToBytes(hex) {
  const s = String(hex || "").replace(/^0x/, "");
  const out = new Uint8Array(Math.floor(s.length / 2));
  for (let i = 0; i < out.length; i++)
    out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function decryptWithSeal({
  suiClient,
  userAddress,
  encrypted,
  signPersonalMessage,
  idHexOverride,
}) {
  const seal = new SealClient({
    suiClient,
    serverConfigs: getAllowlistedKeyServers("testnet").map((id) => ({
      objectId: id,
      weight: 1,
    })),
  });

  const packageId = process.env.NEXT_PUBLIC_SEAL_PACKAGE_ID;
  const approveModule = process.env.NEXT_PUBLIC_SEAL_APPROVE_MODULE; // e.g. patterns::tle
  const policyIdHex =
    idHexOverride || process.env.NEXT_PUBLIC_SEAL_POLICY_ID || "";

  const sessionKey = new SessionKey({
    address: userAddress,
    packageId,
    ttlMin: 1,
    suiClient,
  });
  const pm = sessionKey.getPersonalMessage();
  const { signature } = await signPersonalMessage({ message: pm });
  sessionKey.setPersonalMessageSignature(signature);

  const tx = new Transaction();
  if (packageId && approveModule) {
    tx.moveCall({
      target: `${packageId}::${approveModule}::seal_approve`,
      arguments: [
        tx.pure.vector("u8", Array.from(hexToBytes(policyIdHex))),
        tx.object("0x6"),
      ],
    });
  }
  const txBytes = await tx.build({
    client: suiClient,
    onlyTransactionKind: true,
  });
  return await seal.decrypt({ data: encrypted, sessionKey, txBytes });
}

async function listUserWalrusObjectIds(suiClient, owner) {
  const result = [];
  let cursor = null;
  do {
    const page = await suiClient.getOwnedObjects({
      owner,
      cursor: cursor ?? undefined,
      limit: 50,
      options: { showType: true },
    });
    for (const it of page.data) {
      const t = it?.data?.type;
      if (
        t &&
        (t.includes("::blob::Blob") || t.includes("::shared_blob::SharedBlob"))
      ) {
        result.push(it.data.objectId);
      }
    }
    cursor = page.hasNextPage ? page.nextCursor ?? null : null;
  } while (cursor);
  return result;
}

function u256DecimalToBase64Url(dec) {
  let v = BigInt(dec);
  const bytes = new Uint8Array(32);
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function getCredentialByBlobIdViaProxy(
  blobId,
  userAddress,
  signPersonalMessage,
  idHexOverride
) {
  const encrypted = await getCredentialBytesViaProxy(blobId);
  const suiClient = new SuiClient({
    url: process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl("testnet"),
    network: "testnet",
  });
  const plaintext = await decryptWithSeal({
    suiClient,
    userAddress,
    encrypted,
    signPersonalMessage,
    idHexOverride,
  });
  const text = new TextDecoder().decode(plaintext);
  let json;
  try {
    json = JSON.parse(text);
  } catch {}
  return { plaintext, text, json };
}

export async function getAllUserCredentialsViaProxy(
  userAddress,
  signPersonalMessage
) {
  const suiClient = new SuiClient({
    url: process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl("testnet"),
    network: "testnet",
  });
  const objectIds = await listUserWalrusObjectIds(suiClient, userAddress);
  const results = [];
  for (const oid of objectIds) {
    try {
      const obj = await suiClient.getObject({
        id: oid,
        options: { showContent: true },
      });
      const content = obj?.data?.content;
      const fields = content?.fields ?? {};
      const metaFields = fields?.blob?.fields ?? fields;
      const dec =
        metaFields?.blob_id ?? metaFields?.blobId ?? metaFields?.blobid;
      if (!dec) continue;
      const blobId = u256DecimalToBase64Url(String(dec));
      const { plaintext, text, json } = await getCredentialByBlobIdViaProxy(
        blobId,
        userAddress,
        signPersonalMessage
      );
      results.push({ objectId: oid, blobId, plaintext, text, json });
    } catch (e) {
      const msg = String(e?.message || e);
      if (msg.includes("blob_not_certified")) continue;
      throw e;
    }
  }
  return results;
}

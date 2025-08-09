## Secure Credential Vault (Frontend Only) — Implementation Guide

This guide explains how to build a testnet-only frontend that lets a user:

- connect a Sui wallet (Slush-compatible)
- add credential modules (username, password, website URL, email)
- client-side encrypt them with Seal
- upload the encrypted blob to Walrus via HTTP
- capture the returned Walrus Blob ID for later on-chain logging or AI audit

Scope: frontend-first for hackathon. A minimal backend is recommended where it improves UX/security (proxy Walrus uploads, integrity logging). No Move contracts or AI/ROFL in this phase.

### Tech stack

- React + Vite + TypeScript
- Sui SDK and dApp integration
  - Option A: `@mysten/dapp-kit` (first-party hooks, Slush supported via Wallet Standard)
  - Option B: `@suiet/wallet-kit` (includes Slush Web Wallet integration helper)
- Encryption: `@mysten/seal` client
- Storage: Walrus publisher/aggregator HTTP API (Testnet)

### Install dependencies

Run in your web frontend (e.g., `webapp_frontend/`):

```sh
npm i @mysten/sui @tanstack/react-query
npm i @mysten/dapp-kit
npm i @mysten/seal
```

If you prefer Suiet Wallet Kit (Option B):

```sh
npm i @suiet/wallet-kit @mysten/sui
```

### Network and endpoints (Testnet)

- Sui fullnode RPC (Testnet): `https://fullnode.testnet.sui.io:443`
- Walrus Testnet services:
  - Aggregator: `https://aggregator.walrus-testnet.walrus.space`
  - Publisher: `https://publisher.walrus-testnet.walrus.space`

Define env vars in your frontend `.env` (Vite-style):

```env
VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
VITE_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
VITE_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
VITE_API_BASE=http://localhost:3001
```

### Wallet connection (Slush-compatible)

You can use either Mysten dApp Kit (Option A) or Suiet Wallet Kit (Option B). Both support Sui Wallet Standard and Slush.

- dApp Kit providers setup [source]: `@tanstack/react-query`, `SuiClientProvider`, `WalletProvider`.

```tsx
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";

const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl("testnet") },
});
const queryClient = new QueryClient();

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
```

- Connect UI with Slush detection [source: dApp Kit + Slush]:

```tsx
import { ConnectButton, useCurrentWallet } from "@mysten/dapp-kit";
import { SLUSH_WALLET_NAME } from "@mysten/slush-wallet";

export function ConnectWallet() {
  const { currentWallet, connectionStatus } = useCurrentWallet();
  const isSlush = currentWallet?.name === SLUSH_WALLET_NAME;
  return (
    <div>
      <ConnectButton />
      <div>Status: {connectionStatus}</div>
      {isSlush && <div>Connected via Slush</div>}
    </div>
  );
}
```

- Suiet Wallet Kit with Slush (Option B) [source: Suiet]:

```tsx
import {
  WalletProvider,
  defineSlushWallet,
  AllDefaultWallets,
  ConnectButton,
} from "@suiet/wallet-kit";
import "@suiet/wallet-kit/style.css";

const slushWebWallet = defineSlushWallet({
  appName: "Secure Credential Vault",
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider defaultWallets={[...AllDefaultWallets, slushWebWallet]}>
      {children}
    </WalletProvider>
  );
}

export function ConnectWallet() {
  return <ConnectButton />;
}
```

[dApp Kit: ConnectButton, hooks, providers] — `@mysten/dapp-kit` docs.
[Slush detection] — Mysten TS SDK docs.
[Suiet: Slush wallet integration] — Suiet Wallet Kit docs.

### Backend layer (recommended responsibilities)

Validation: Keep Seal encryption client-side. Moving encryption server-side breaks the privacy-preserving goal because the server would see plaintext. Seal’s decryption access is designed to require end-user consent (session key + personal message signature), which a backend cannot perform on behalf of the user.

What the backend should do:

- Proxy Walrus uploads to avoid CORS, hide publisher URL, and centralize rate limiting.
- Enforce payload limits and basic validation (content length, epochs >= 1).
- Optional: compute and store integrity metadata (sha256 of encrypted bytes, `blobId`, `address`, `timestamp`).
- Optional: centralized config to swap publishers/aggregators without frontend changes.

Minimal API surface:

- POST `/api/walrus/upload` — body: `{ address, epochs, encryptedBase64 }`; forwards to `${PUBLISHER}/v1/blobs?epochs=...&send_object_to=<address>` as PUT body bytes.
- GET `/api/walrus/blob/:blobId` (optional passthrough for reads).

Example Node/Express server

```ts
// server/index.ts
import express from "express";
import crypto from "node:crypto";
import { fetch } from "undici";

const app = express();
app.use(express.json({ limit: "20mb" }));

const PUBLISHER =
  process.env.WALRUS_PUBLISHER ||
  "https://publisher.walrus-testnet.walrus.space";

app.post("/api/walrus/upload", async (req, res) => {
  try {
    const { address, epochs = 1, encryptedBase64 } = req.body ?? {};
    if (!address || !encryptedBase64)
      return res
        .status(400)
        .json({ error: "address and encryptedBase64 required" });
    if (!Number.isInteger(epochs) || epochs < 1)
      return res.status(400).json({ error: "epochs must be >= 1" });

    const bytes = Buffer.from(encryptedBase64, "base64");
    if (bytes.length === 0)
      return res.status(400).json({ error: "empty payload" });
    if (bytes.length > 10 * 1024 * 1024)
      return res.status(413).json({ error: "payload too large" });

    const url = `${PUBLISHER}/v1/blobs?epochs=${epochs}&send_object_to=${address}`;
    const upstream = await fetch(url, { method: "PUT", body: bytes });
    const text = await upstream.text();

    const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
    // persist { sha256, at: new Date().toISOString(), address } if desired

    res
      .status(upstream.status)
      .type(upstream.headers.get("content-type") || "application/json")
      .send(text);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "upload failed" });
  }
});

app.get("/api/walrus/blob/:id", async (req, res) => {
  const AGGREGATOR =
    process.env.WALRUS_AGGREGATOR ||
    "https://aggregator.walrus-testnet.walrus.space";
  const r = await fetch(
    `${AGGREGATOR}/v1/blobs/${encodeURIComponent(req.params.id)}`
  );
  res.status(r.status);
  r.headers.forEach((v, k) => res.setHeader(k, v));
  r.body?.pipe(res);
});

app.listen(process.env.PORT || 3001, () => console.log("API listening"));
```

Frontend usage of the backend proxy

```ts
function u8toBase64(u8: Uint8Array) {
  let s = "";
  u8.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

export async function uploadViaBackend(
  apiBase: string,
  address: string,
  epochs: number,
  encrypted: Uint8Array
) {
  const res = await fetch(`${apiBase}/api/walrus/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address,
      epochs,
      encryptedBase64: u8toBase64(encrypted),
    }),
  });
  if (!res.ok) throw new Error(`backend upload failed: ${res.status}`);
  return res.json();
}
```

### Credential module model

```ts
export type CredentialModule = {
  username: string;
  password: string; // encrypt client-side before upload
  websiteUrl: string;
  email: string;
  createdAt: string; // ISO timestamp
};
```

### Seal: client-side encryption

Initialize Sui + Seal client with allowlisted key servers (Testnet) [source: Seal UsingSeal.md].

```ts
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { SealClient, getAllowlistedKeyServers } from "@mysten/seal";

export async function createSealClient() {
  const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });
  const client = new SealClient({
    suiClient,
    serverConfigs: getAllowlistedKeyServers("testnet").map((id) => ({
      objectId: id,
    })),
  });
  return client;
}
```

Encrypt credentials (returns encrypted bytes and backup key) [source: Seal].

```ts
import { fromHEX } from "@mysten/seal";

export async function encryptCredentials(
  client: SealClient,
  pkgIdHex: string,
  policyIdHex: string,
  data: Uint8Array
) {
  const { encryptedObject, key } = await client.encrypt({
    threshold: 2,
    packageId: fromHEX(pkgIdHex),
    id: fromHEX(policyIdHex),
    data,
  });
  return { encryptedBytes: encryptedObject, backupKey: key };
}
```

Notes:

- For this phase, you only need encryption. Decryption (via `SessionKey` and `seal_approve` Move hooks) is for the AI layer later [source: Seal session key].
- `packageId` and `id` (policy/access id) can reference a simple time-lock or allowlist access policy if desired; for hackathon, you may reuse existing example policies from Seal docs or set an app-specific ID convention.

### Walrus: HTTP upload (Testnet)

Publisher and Aggregator endpoints:

- `VITE_WALRUS_PUBLISHER` for PUT /v1/blobs
- `VITE_WALRUS_AGGREGATOR` for reading

Minimal upload (encrypted bytes) [source: Walrus Web API example].

```ts
export async function walrusPutBlob(params: {
  publisherUrl: string;
  body: Blob | Uint8Array;
  epochs: number; // storage duration (>=1)
  sendObjectTo?: string; // optional Sui address to receive the blob object
}) {
  const { publisherUrl, body, epochs, sendObjectTo } = params;
  const sendParam = sendObjectTo ? `&send_object_to=${sendObjectTo}` : "";
  const res = await fetch(
    `${publisherUrl}/v1/blobs?epochs=${epochs}${sendParam}`,
    {
      method: "PUT",
      body,
    }
  );
  if (!res.ok) throw new Error(`Walrus upload failed: ${res.status}`);
  return res.json(); // see response shapes below
}
```

Successful responses [source: Walrus]:

- Newly created blob returns `newlyCreated.blobObject.blobId` (base64url) and storage epochs
- Already certified returns `alreadyCertified.blobId` and the cert event

Reading by blob ID [source: Walrus]:

```ts
export async function walrusReadBlob(aggregatorUrl: string, blobId: string) {
  const res = await fetch(`${aggregatorUrl}/v1/blobs/${blobId}`);
  if (!res.ok) throw new Error("Walrus read failed");
  return res.arrayBuffer();
}
```

### WAL tokens on Testnet (required to store)

Walrus storage requires WAL. On Testnet, obtain WAL via CLI [source: Walrus networks]:

```sh
# Install testnet client
curl -sSf https://docs.wal.app/setup/walrus-install.sh | sh -s -- -n testnet

# Exchange SUI->WAL (1:1 on testnet)
walrus get-wal

# Verify balances via Sui client
sui client gas
sui client balance
```

Notes:

- For the hackathon, instruct users to acquire WAL beforehand using the CLI. Building an in-app exchange is optional and out-of-scope here.
- When using the public Testnet Publisher, include `send_object_to=<connected Sui address>` so the user receives the Blob object on Sui [source: Walrus PUT].

### End-to-end React example

This component connects a wallet, collects credentials, encrypts them with Seal, uploads to Walrus, and shows the returned Blob ID.

```tsx
import { useState } from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { SealClient, getAllowlistedKeyServers, fromHEX } from "@mysten/seal";

type CredentialModule = {
  username: string;
  password: string;
  websiteUrl: string;
  email: string;
  createdAt: string;
};

function toBytes(cm: CredentialModule) {
  return new TextEncoder().encode(JSON.stringify(cm));
}

async function getSealClient() {
  const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });
  return new SealClient({
    suiClient,
    serverConfigs: getAllowlistedKeyServers("testnet").map((id) => ({
      objectId: id,
    })),
  });
}

async function encryptWithSeal(
  client: SealClient,
  pkgIdHex: string,
  policyIdHex: string,
  data: Uint8Array
) {
  const { encryptedObject } = await client.encrypt({
    threshold: 2,
    packageId: fromHEX(pkgIdHex),
    id: fromHEX(policyIdHex),
    data,
  });
  return encryptedObject; // Uint8Array
}

async function walrusPutBlob(
  publisherUrl: string,
  bytes: Uint8Array,
  epochs: number,
  sendTo?: string
) {
  const send = sendTo ? `&send_object_to=${sendTo}` : "";
  const res = await fetch(`${publisherUrl}/v1/blobs?epochs=${epochs}${send}`, {
    method: "PUT",
    body: bytes,
  });
  if (!res.ok) throw new Error(`Walrus upload failed: ${res.status}`);
  return res.json();
}

export function CredentialUploader() {
  const account = useCurrentAccount();
  const [form, setForm] = useState<CredentialModule>({
    username: "",
    password: "",
    websiteUrl: "",
    email: "",
    createdAt: new Date().toISOString(),
  });
  const [status, setStatus] = useState<string>("");
  const [blobId, setBlobId] = useState<string>("");

  const publisher = import.meta.env.VITE_WALRUS_PUBLISHER as string;
  const apiBase = (import.meta as any).env.VITE_API_BASE as string | undefined;
  const sealPkgId = "0x0"; // replace with your Seal package or policy package
  const accessId = "0x53e66d756e6472206672f3f069"; // demo id policy; replace as needed

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!account?.address) return setStatus("Connect wallet first");
    setStatus("Encrypting…");
    const client = await getSealClient();
    const bytes = toBytes(form);
    const encrypted = await encryptWithSeal(client, sealPkgId, accessId, bytes);

    setStatus("Uploading to Walrus…");
    const resp = apiBase
      ? await uploadViaBackend(apiBase, account.address, 1, encrypted)
      : await walrusPutBlob(publisher, encrypted, 1, account.address);
    const id =
      resp?.newlyCreated?.blobObject?.blobId || resp?.alreadyCertified?.blobId;
    setBlobId(id ?? "");
    setStatus(id ? "Uploaded" : "Uploaded (no id?)");
  }

  return (
    <div>
      <ConnectButton />
      <form onSubmit={onSubmit}>
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <input
          placeholder="Website URL"
          value={form.websiteUrl}
          onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <button type="submit">Encrypt & Upload</button>
      </form>
      <div>{status}</div>
      {blobId && <div>Walrus Blob ID: {blobId}</div>}
    </div>
  );
}
```

### References (authoritative snippets)

- dApp Kit providers and ConnectButton:

  - Install + providers + hooks: `npm i @mysten/dapp-kit @mysten/sui @tanstack/react-query` and provider setup. [Mysten TS SDK]
  - `ConnectButton` usage and wallet hooks (`useCurrentWallet`, `useCurrentAccount`). [Mysten TS SDK]
  - Detecting Slush: compare `currentWallet.name` to `SLUSH_WALLET_NAME`. [Mysten TS SDK]

- Suiet Wallet Kit (alternative):

  - `WalletProvider`, `ConnectButton`, `useWallet` basics and Slush wallet integration via `defineSlushWallet`. [Suiet Wallet Kit]

- Seal client:

  - Initialize `SealClient` with allowlisted key servers on testnet. [Seal UsingSeal.md]
  - `client.encrypt({ threshold, packageId, id, data })` returns encrypted bytes and backup key. [Seal UsingSeal.md]
  - Session key + `seal_approve` (for future decryption/AI phase). [Seal UsingSeal.md]

- Walrus HTTP API:
  - PUT `/v1/blobs?epochs=<n>[&send_object_to=<addr>]` stores bytes; read via GET `/v1/blobs/{blobId}`. [Walrus docs]
  - Responses for `newlyCreated` vs `alreadyCertified`. [Walrus docs]
  - Testnet aggregator/publisher endpoints and helper examples. [Walrus docs]
  - `walrus get-wal` to acquire WAL on testnet. [Walrus docs]

### Security and UX notes

- Never send plaintext credentials over the network; always encrypt in the browser.
- Consider basic client-side validation and strength hints for passwords (no telemetry).
- Store only the Walrus Blob ID and timestamp in local app state; avoid persisting unencrypted data.
- If you later add on-chain logging, build a small Move module to emit events storing `blob_id`, `timestamp`, `hash(encrypted)`.

### Next steps (post-frontend)

- AI/ROFL worker: fetch by Blob ID from Walrus aggregator, decrypt via Seal session key and approved Move policy, check breach DBs, return verdict.
- If verdict is "safe": call a mint function (Move module) to issue a non-transferable NFT as a security proof.

---

Footnotes: Selected authoritative snippets from SDK docs

- dApp Kit providers setup

```ts
// From Mysten TS SDK dapp-kit README
// npm i --save @mysten/dapp-kit @mysten/sui @tanstack/react-query
// import '@mysten/dapp-kit/dist/index.css'
```

- Slush detection using dApp Kit

```ts
// From Mysten TS SDK: Detecting Slush Wallet with dapp-kit
// const walletIsSlushWallet = currentWallet?.name === SLUSH_WALLET_NAME;
```

- Suiet + Slush wallet inclusion

```ts
// From Suiet Wallet Kit: defineSlushWallet + defaultWallets
```

- Seal client encrypt

```ts
// From Seal UsingSeal.md: client.encrypt({ threshold, packageId, id, data })
```

- Walrus HTTP store

```ts
// From Walrus examples: PUT /v1/blobs?epochs=... [&send_object_to=...]
```

# Backend Setup Guide: Sui + zkLogin + Walrus + Seal

This document walks you through preparing a local / CI environment capable of:

1. Compiling & running **Sui** (Devnet / Localnet)
2. Generating **zkLogin** proofs that map OAuth identities ⟶ Sui wallets
3. Encrypting data with **Seal** and storing blobs on **Walrus** Testnet v2
4. Submitting on-chain log transactions

> All steps assume **macOS or Linux**. Windows users can follow the same flow inside WSL2.

---

## 1. Prerequisites

| Tool            | Minimum Version | Install                         |
| --------------- | --------------- | ------------------------------- | --- |
| **Rust**        | 1.74            | `curl https://sh.rustup.rs -sSf | sh` |
| **Node.js**     | ≥ 18 LTS        | <https://nodejs.org>            |
| **Yarn or npm** | Latest          | `npm i -g yarn`                 |
| **Docker**      | ≥ 24 (optional) | <https://docs.docker.com/>      |
| **Git**         | ≥ 2.40          | `brew install git`              |

Add Cargo’s `~/.cargo/bin` to your `PATH` **after** installing Rust.

```bash
# ~/.zshrc
export PATH="$HOME/.cargo/bin:$PATH"
```

---

## 2. Sui CLI & Localnet

1. **Clone & build**

```bash
git clone https://github.com/MystenLabs/sui.git
cd sui && cargo build --release --bin sui
```

> Building Sui from source takes ~10 min on a 4-core machine.

2. **Install the CLI globally** (optional)

```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git sui
```

3. **Start a local network** (hot-reload Move contracts)

```bash
sui start --network localnet --enable-event-processing | cat
```

The CLI prints the RPC endpoint (default `http://127.0.0.1:9000`). Fund your dev wallet:

```bash
sui client new-address ed25519  # generates keypair
sui client gas --address <ADDR>
```

4. **TypeScript SDK**

```bash
mkdir backend && cd backend
npm init -y
npm install @mysten/sui.js@latest
```

---

## 3. zkLogin Toolkit

`zkLogin` transforms standard OAuth credentials into an on-chain Sui address.

1. **Clone toolkit (under Sui repo)**

```bash
cd sui/sdk/zkLogin
cargo build --release --bin zklogin
```

2. **Create OAuth credentials**

Generate **Client ID** / **Client Secret** for Google or GitHub. Set environment variables:

```bash
export OAUTH_CLIENT_ID="<client-id>"
export OAUTH_CLIENT_SECRET="<client-secret>"
export REDIRECT_URL="http://localhost:5173/callback"
```

3. **Run helper server** (Dev only)

```bash
./target/release/zklogin oauth --provider google --port 5173
```

4. **Generate proof & keypair**

After OAuth redirects back, capture the JWT and invoke:

```bash
./target/release/zklogin prove --jwt <JWT> --key-file wallet.key
```

The command outputs:

- `proof.json` – SNARK proof
- `derived.pem` – Ed25519 keypair ⇒ **Sui address**

You can now airdrop gas on Devnet to that address.

---

## 4. Seal SDK Setup

**Seal** provides threshold encryption so that Walrus-stored blobs remain private.

```bash
npm install @mysten/seal-sdk@latest
```

Create `seal.config.ts`:

```typescript
export const KEY_SERVERS = [
  "https://key1.testnet.seal.mystenlabs.com",
  "https://key2.testnet.seal.mystenlabs.com",
  "https://key3.testnet.seal.mystenlabs.com",
  "https://key4.testnet.seal.mystenlabs.com",
  "https://key5.testnet.seal.mystenlabs.com",
];
```

Test encryption:

```typescript
import { Seal } from "@mysten/seal-sdk";
import { KEY_SERVERS } from "./seal.config";

(async () => {
  const seal = await Seal.init({ keyServerUrls: KEY_SERVERS });
  const cipher = await seal.encrypt("Hello Seal ✨");
  console.log("Ciphertext bytes", cipher.ciphertext.length);
})();
```

> See Seal README for quota limits & key-server verification steps [[Seal Repo](https://github.com/MystenLabs/seal?tab=readme-ov-file)].

---

## 5. Walrus Client

Walrus handles decentralized blob storage with Sui for coordination.

1. **Binary release (fastest)**

```bash
curl -L https://wal.app/install.sh | bash  # installs `walrus` into ~/.cargo/bin
```

2. **Connect to Testnet v2** (free quota) [[Walrus Docs](https://docs.wal.app/#1-5-announcing-testnet-v2)]

```bash
walrus config set network testnet-v2
```

3. **Upload an encrypted blob**

```bash
walrus blob put encrypted.bin --mime application/octet-stream
# → returns OBJECT_ID & CID written to Sui chain
```

4. **HTTP API alternative**

```bash
curl -X POST https://testnet.wal.app/api/v1/blobs \
     -H "Content-Type: application/octet-stream" \
     --data-binary @encrypted.bin
```

Response example (`201 Created`):

```json
{
  "object_id": "0x8f2…abcd",
  "cid": "bafybeigd…"
}
```

---

## 6. End-to-End Smoke Test

Create `smoke.ts`:

```typescript
import {
  Keypair,
  Ed25519Keypair,
  JsonRpcProvider,
  TransactionBlock,
} from "@mysten/sui.js";
import { Seal } from "@mysten/seal-sdk";
import fetch from "node-fetch";
import { KEY_SERVERS } from "./seal.config";

(async () => {
  // 🔑 Fake wallet (until zkLogin ready)
  const wallet = Ed25519Keypair.generate();
  console.log("Wallet:", wallet.getPublicKey().toSuiAddress());

  // 📦 1. Encrypt sample credential
  const seal = await Seal.init({ keyServerUrls: KEY_SERVERS });
  const blob = await seal.encrypt(JSON.stringify({ foo: "bar" }));

  // 🛰️ 2. Upload to Walrus
  const res = await fetch("https://testnet.wal.app/api/v1/blobs", {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: blob.ciphertext,
  });
  const { object_id, cid } = await res.json();
  console.log("Walrus object:", object_id, cid);

  // ⛓️ 3. Log on Sui Devnet
  const provider = new JsonRpcProvider("https://fullnode.devnet.sui.io:443");
  const tx = new TransactionBlock();
  tx.moveCall({
    target: "grandwarden::store_logger::log",
    arguments: [
      tx.pure.address(wallet.getPublicKey().toSuiAddress()),
      tx.pure.utf8(object_id),
      tx.pure.utf8(cid),
    ],
  });
  await provider.signAndExecuteTransactionBlock({
    signer: wallet,
    transactionBlock: tx,
  });
})();
```

```bash
node smoke.ts
```

Expect output:

```
Wallet: 0x123…abcd
Walrus object: 0x8f2…abcd bafybeigd…
✅  Tx confirmed on Devnet
```

---

## 7. Environment Variables

```bash
# .env
SUI_RPC_URL=https://fullnode.devnet.sui.io:443
WALRUS_NETWORK=testnet-v2
KEY_SERVER_1=https://key1.testnet.seal.mystenlabs.com
KEY_SERVER_2=…
OAUTH_CLIENT_ID=…
OAUTH_CLIENT_SECRET=…
REDIRECT_URL=http://localhost:5173/callback
```

Load with `dotenv` in Node:

```bash
npm i dotenv
env $(cat .env | xargs) node smoke.ts
```

---

## 8. Troubleshooting

| Symptom                       | Likely Cause                          | Fix                                                 |
| ----------------------------- | ------------------------------------- | --------------------------------------------------- |
| `Error: gas budget`           | Wallet has no SUI                     | `sui client faucet <ADDR>`                          |
| `Walrus 402 Payment Required` | Out of storage quota                  | Claim fresh testnet credits or delete old blobs     |
| `Seal threshold error`        | Less than **t** key servers reachable | Remove downed servers or lower threshold (dev only) |

---

## 9. Next Steps

1. Switch smoke test to real **zkLogin** wallet once proof flow is connected.
2. Containerise Walrus CLI & Seal SDK for CI with **GitHub Actions**.
3. Automate Move module publishing in devnets.

---

**Happy hacking!**

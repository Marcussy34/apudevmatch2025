# Backend Design: zkLogin + Walrus + Seal + Sui On-Chain Logging

This document lays out the end-to-end backend flow for Grand Warden when a user authenticates via **zkLogin**, stores their encrypted credentials on **Walrus** using **Seal**, and finally logs the storage event **on-chain on Sui**.  
Focus is placed on Walrus + Seal integration and a test-first development strategy.

---

## 1. High-level Flow

```mermaid
graph TD
    A[User signs-in with Google / GitHub (OAuth)] --> B(zkLogin Proof Generation)
    B --> C(Create / fetch Sui wallet address)
    C --> D[Encrypt credentials<br/>with Seal SDK]
    D --> E[Upload encrypted blob to Walrus]
    E --> F[Obtain Blob Object ID & CID]
    F --> G[Submit on-chain<br/>Sui Tx ‑ LogStoreEvent]
```

1. **User Authentication** – Obtain an OAuth token from a provider (Google, GitHub…).
2. **zkLogin** – Generate a zero-knowledge proof that links the OAuth identity to a fresh Sui **wallet address** ([Sui zkLogin](https://github.com/MystenLabs/sui/tree/main/sdk/zkLogin)).
3. **Encrypt Credentials with Seal** – Use the [Seal TypeScript SDK](https://github.com/MystenLabs/seal?tab=readme-ov-file) to encrypt the user’s credential blob (JSON) under the Walrus-selected **Seal Master Key**.
4. **Store on Walrus** – POST the ciphertext (≤4 MiB) to a Walrus storage node ([Walrus HTTP API §4.3](https://docs.wal.app/#4-3-using-the-client-http-api)). Walrus returns a **Blob Object ID** and **CID** recorded on Sui.
5. **On-chain Log** – Submit a Sui transaction (`LogStoreEvent`) that stores `(user_addr, walrus_blob_object_id, timestamp)` inside a Move object; this is later queryable for audits.

---

## 2. Environments & Networks

| Layer      | Test Target                                                                 | Notes                    |
| ---------- | --------------------------------------------------------------------------- | ------------------------ |
| **Sui**    | _Devnet_ (`sui_devnet`)                                                     | Cheap gas, fast finality |
| **Walrus** | _Testnet v2_ ([docs §1.5](https://docs.wal.app/#1-5-announcing-testnet-v2)) | Free storage grants      |
| **Seal**   | _Public test key servers_ (see `verified-servers.json` in repo)             | Threshold t = 3/5        |

---

## 3. Detailed Steps

### 3.1 Generate a **Fake Test Wallet** (Bootstrap)

While zkLogin integration is under development we can bootstrap with a deterministic test key pair:

```typescript
import { Ed25519Keypair } from "@mysten/sui.js/cryptography";
const TEST_KEY = Ed25519Keypair.generate();
console.log(TEST_KEY.getPublicKey().toSuiAddress()); // Use as wallet addr
```

> ❗ **Never** use this key in production – it is committed to source control for CI only.

### 3.2 Encrypt & Store Credentials

```typescript
// 1️⃣  Collect credentials
const cred = {
  site: "gmail.com",
  username: "jon@example.com",
  password: "S3cRe7!",
};

// 2️⃣  Seal encryption (threshold t = 3, n = 5)
import { Seal } from "@mysten/seal-sdk";
const seal = await Seal.init({ keyServerUrls: VERIFIED_SERVERS });
const encrypted = await seal.encrypt(JSON.stringify(cred));

// 3️⃣  Upload to Walrus
import fetch from "node-fetch";
const res = await fetch("https://testnet.wal.app/api/v1/blobs", {
  method: "POST",
  headers: { "Content-Type": "application/octet-stream" },
  body: encrypted.ciphertext,
});
const { object_id, cid } = await res.json();
```

Reference: Walrus **HTTP API** upload (`POST /blobs`) [[Walrus §4.3](https://docs.wal.app/#4-3-using-the-client-http-api)].

### 3.3 Log the Event on Sui

Create a simple Move module `store_logger.move`:

```move
module grandwarden::store_logger {
    struct StoreEvent has key {
        id: UID,
        owner: address,
        blob: vector<u8>, // Walrus object ID (bcs-encoded)
        cid: vector<u8>,  // Content ID (multihash)
        timestamp: u64,
    }

    public entry fun log(owner: address, blob: vector<u8>, cid: vector<u8>) {
        let event = StoreEvent {
            id: object::new_uid(),
            owner,
            blob,
            cid,
            timestamp: std::time::now_seconds(),
        };
        move_to(&owner, event);
    }
}
```

Client side submission:

```typescript
import { JsonRpcProvider, TransactionBlock } from "@mysten/sui.js";
const tx = new TransactionBlock();
tx.moveCall({
  target: "grandwarden::store_logger::log",
  arguments: [
    tx.pure.address(testWallet.address),
    tx.pure.utf8(object_id),
    tx.pure.utf8(cid),
  ],
});
await provider.signAndExecuteTransactionBlock({
  signer: testWallet,
  transactionBlock: tx,
});
```

---

## 4. Error Handling & Retries

| Stage           | Possible Failure            | Mitigation                                       |
| --------------- | --------------------------- | ------------------------------------------------ |
| Seal encryption | Key server offline          | Retry with back-off, rotate to alternate servers |
| Walrus upload   | `HTTP 5xx` / quota limit    | Retry; fall back to secondary Walrus network     |
| On-chain tx     | Gas failure / network split | Auto-re-sign up to 3 times; surface to UI        |

---

## 5. Test Plan

1. **Unit** – Mock Seal & Walrus responses; assert ciphertext length ≤ input + 5%.
2. **Integration (CI)**
   1. Generate test key pair
   2. Encrypt dummy credential
   3. Upload to Walrus Testnet (expect 201 & object_id).
   4. Submit Sui devnet transaction; query `store_logger::StoreEvent` and assert fields.
3. **End-to-End (Staging)** – Switch to live zkLogin flow; validate wallet address matches on-chain owner field.

---

## 6. Security Notes

- **Public Blobs** – Walrus blobs are **publicly discoverable** [[Walrus §Data Security](https://docs.wal.app/#5-5-data-security)]. Always encrypt with Seal _before_ upload.
- **Seal Non-Goals** – Do not attempt to store wallet private keys in Seal; see _Seal README – Non-goals_.
- **PII Handling** – OAuth tokens must never be written to disk; keep in memory only.

---

## 7. Future Work

| Idea                                  | Rationale                                              |
| ------------------------------------- | ------------------------------------------------------ |
| **DRM-style Seal**                    | Off-chain decrypt in secure enclave for mobile clients |
| **Walrus + Seal replication metrics** | Query storage proofs periodically & raise alerts       |
| **Move ZKP verification**             | Verify Seal encryption integrity on-chain              |

---

## 8. References

- Walrus Developer Docs: <https://docs.wal.app/>
- Seal SDK & Design: <https://github.com/MystenLabs/seal>
- Sui Blockchain & zkLogin: <https://github.com/MystenLabs/sui>
- Walrus HTTP API (§4.3) – Uploading Blobs
- Walrus Testnet v2 Announcement (§1.5)

# 🔒 Grand Warden – Product Requirements Document (v4)

_Last updated: 25 Jul 2025 – v4: Wallet Vault + **Sui Event Mirroring via Sapphire (ROFL)**_

---

## 1 · Executive Summary

**Grand Warden** is a privacy-first security suite delivered as a browser extension (with PWA fallback). It bundles two core pillars under one UX:

1. **Password Vault** – Cloud-synced, zero-knowledge credential manager
2. **Wallet Vault** – Always-encrypted storage & enclave-based signing for Web3 keys

A mandatory third pillar is a **live, cross-chain data layer powered by The Graph**. This layer indexes all relevant security events via a **GraphQL endpoint**, used by the client for UI state, notifications, and analytics.

> **Note:** Since The Graph cannot index Sui natively, we use an **Oasis ROFL off-chain worker** to mirror Sui events to Sapphire, where synthetic events are emitted and indexed.

---

### Core Infrastructure

- **Sui** – Public state (Move objects, device registry, CID pointers)
- **Oasis Sapphire** – Confidential compute & remote-attested key custody
- **Oasis ROFL** – Trusted off-chain worker that mirrors Sui events into Sapphire
- **Walrus + Seal** – Decentralized blob storage & ACL
- **Sui zkLogin** – Seed-phrase-free onboarding (Google/Apple identity)
- **The Graph** – Self-hosted node with custom Sapphire emulator for real-time indexing

#### Updated Event & Mirroring Model

- Sui emits canonical public events (no secrets) that include `eventId` and per-source `seq` for ordering:

  - `DeviceRegistered(user, deviceId, deviceName, publicKey, registeredAt, eventId, seq)`
  - `DeviceStatusChanged(user, deviceId, newStatus, changedAt, reason?, eventId, seq)`
  - `VaultPointerCreated(user, vaultId, walrusCid, metadataHash, createdAt, eventId, seq)`
  - `VaultPointerSet(user, vaultId, walrusCid, metadataHash, stage, updatedAt, eventId, seq)` where `stage ∈ {Provisional|Finalized|RolledBack}`
  - `BlobACLUpdated(user, blobId, policy, authorizedDevices[], updatedAt, eventId, seq)`
  - `RecoveryInitiated/Approved/Completed(..., eventId, seq)`

- ROFL Worker:

  - Computes/validates `eventId`, enforces exactly-once and monotonic `seq`.
  - Maintains durable cursor/replay; exposes metrics (lag, queue depth, success rate).
  - Calls Sapphire with attested identity or allowlisted key.

- Sapphire (MirrorInbox):

  - `mirrorEvent(user, eventType, payload, eventId, seq, attestation)` or typed methods.
  - Verifies attestation/allowlist, idempotency (`processed[eventId]`) and ordering (`lastSeq[user]`).
  - Dispatches to domain contracts and emits canonical EVM events.

- Canonical ABI: `TransactionSigned(address user, bytes32 walletId, bytes32 txHash, uint8 chainType)` across contracts/ABIs.

- Atomic 3‑phase flow: Walrus provisional → Sui pointer update → finalize/rollback, with Sapphire emitting `AtomicUpdateCompleted`/`OperationRolledBack`.

### Technology Roles & Responsibilities

#### 🔵 Sui - Public Coordination and State Layer

**Role:** Source of truth for all public, on-chain user actions and configurations. The client application writes directly to Sui for these operations.

**Responsibilities:**

- **Public State Management:** Hosts on-chain Move objects that represent the public-facing aspects of the system
- **Device Registry:** Manages a user's list of authorized devices, including their public keys and status (active, revoked). This is a public, auditable log
- **Data Pointers:** Stores public pointers (Content Identifiers, or CIDs) that reference the user's encrypted data blobs stored on Walrus
- **Source of Events:** Acts as the origin for key user actions like creating a vault or registering a new device. These Sui events are the starting point for the data mirroring pipeline
- **Recovery Logic:** Coordinates the social recovery process by managing guardian lists and recovery thresholds

#### 🔐 Sui zkLogin - Primary Authentication and Onboarding Mechanism

**Role:** Creates a seed-phrase-free user experience through Web2 social login integration.

**Responsibilities:**

- **User Onboarding:** Allows users to create a non-custodial Sui wallet address by authenticating with their existing Web2 accounts (e.g., Google, Apple)
- **Seedless Experience:** Eliminates the need for users to manage a seed phrase, linking account access directly to their familiar social logins
- **Account Recovery:** Serves as a foundational component of the account recovery flow, combined with social recovery shares

#### 🟣 Oasis Sapphire - Confidential Compute and Private Logic Layer

**Role:** Secure TEE (Trusted Execution Environment) where all sensitive data is processed and all private operations are executed.

**Responsibilities:**

- **Enclave-Based Operations:** Hosts the core Password Vault and Wallet Vault smart contracts. All sensitive logic, like password decryption or transaction signing, happens inside its secure enclave
- **Private Key Custody & Signing:** Securely stores decryption keys for user vaults. When a user wants to sign a transaction (for EVM or Sui), the encrypted private key is loaded into the Sapphire enclave, used for signing, and then immediately purged. The key is never exposed
- **Simplified Multi-Chain Support:** Provides generic transaction signing capabilities while frontend handles chain-specific RPC calls and balance fetching for better flexibility and performance
- **Synthetic Event Emission:** Acts as the destination for the ROFL mirror. It receives translated data from Sui and emits corresponding standard EVM events (e.g., VaultCreated, DeviceRegistered, BreachAlert)
- **Data Source for Indexing:** These EVM events emitted by Sapphire are the sole data source that The Graph indexes to build its real-time data layer

Implementation notes:

- Add `MirrorInbox` contract (attestation/allowlist, idempotency, ordering; payload.version).
- `GrandWardenVault`: TEE decrypt on view paths; never emit secrets.
- `WalletVault`: generic transaction signing; frontend handles chain-specific details and RPC calls.

#### 🌉 Oasis ROFL - Critical Data Bridge

**Role:** Connects the Sui and Sapphire ecosystems, enabling a unified data view across both chains.

**Responsibilities:**

- **Sui Event Mirroring:** Runs as a trusted off-chain worker that constantly listens to the Sui network for relevant events (like new vaults or device changes)
- **Cross-Chain Translation:** When a Sui event is detected, ROFL translates it into a format that the Sapphire smart contracts can understand
- **Triggering Synthetic Events:** It calls a specific function on a Sapphire smart contract (e.g., `emitSyntheticEvent()`) which then emits the corresponding EVM event for The Graph to index
- **Enabling Sui Indexing:** Its primary purpose is to solve the problem that The Graph cannot natively index Sui. By mirroring events to Sapphire, it makes Sui's activity "visible" to the EVM-centric Graph Node

#### 💾 Walrus + Seal - Decentralized Storage and Access Control Layer

**Role:** Provides secure, decentralized storage for all encrypted user data with fine-grained access control.

**Responsibilities:**

- **Walrus (Storage):** Provides decentralized, content-addressed blob storage. It is responsible for persistently storing the large, encrypted blobs containing the user's password vault and wallet keys
- **Seal (Access Control):** Acts as the gatekeeper for Walrus. It enforces the access control policies defined on Sui, ensuring that only authorized devices can fetch the encrypted data blobs

#### 📊 The Graph - Real-Time Data Layer

**Role:** Provides unified, queryable access to all system events and state changes through GraphQL.

**Responsibilities:**

- **Event Indexing:** Indexes all EVM events emitted by Sapphire contracts (including synthetic events mirrored from Sui via ROFL)
- **Real-Time Subscriptions:** Enables WebSocket subscriptions for instant UI updates when events occur
- **Query Interface:** Provides a unified GraphQL endpoint for the frontend to query user activity, breach alerts, and system analytics
- **Data Aggregation:** Combines and correlates events from multiple sources into coherent user and system-level metrics

---

## 2 · Expanded Problem Statement

| Pain                            | Legacy Tools                    | Grand Warden Fix                    |
| ------------------------------- | ------------------------------- | ----------------------------------- |
| Password reuse & vault breaches | SaaS vaults expose metadata     | TEE-protected Password Vault        |
| Wallet seed loss / phishing     | Paper backups, hot-wallet leaks | Wallet Vault with enclave signing   |
| Split UX for security signals   | Poll RPCs or run nodes          | Single GraphQL stream via The Graph |

---

## 3 · Goals & Success Metrics

| Goal             | KPI                                   | Target (M+6) |
| ---------------- | ------------------------------------- | ------------ |
| 🚀 User adoption | Monthly Active Vaults                 | 35 k         |
| 🔐 Wallet safety | Confirmed key-theft incidents         | 0            |
| ⚡ Signing speed | p95 tx signature turnaround           | < 2 s        |
| 🔔 Alerts        | Subgraph event → UI toast < 3 s (p95) | ≥ 95 %       |
| 📊 Reliability   | Subgraph uptime over 30 days          | ≥ 99.5 %     |

---

## 4 · Personas

- **Eve** – Everyday web user (passwords)
- **Sam** – Security enthusiast (wallet vault, hardware recovery)
- **NFT Nico** – Frequent signer/trader; wants safer hot wallet
- **Analyst Ana** – Uses public subgraph to chart adoption/breaches

---

## 5 · Value Proposition

- 🔐 **All secrets covered** – Passwords & Web3 keys secured in TEEs
- 🔁 **One recovery path** – Google/Apple + social shares restore everything
- 🔎 **Live trust signals** – Real-time breach alerts & signing history via The Graph
- 📂 **Open data** – Devs, wallets, & researchers build on the subgraph

---

## 6 · Project Scope (MVP)

| Component                 | Must-have | Status | Notes                                                              |
| ------------------------- | --------- | ------ | ------------------------------------------------------------------ |
| Password Vault            | ✅        | 🚧     | Existing spec                                                      |
| Wallet Vault              | ✅        | 🚧     | EVM & Sui key storage and signing                                  |
| The Graph Subgraph        | ✅        | ✅     | **DEPLOYED** - Docker setup with Sapphire emulator working         |
| **Sapphire RPC Emulator** | ✅        | ✅     | **DEPLOYED** - Running on localhost:8545 with eth_getBlockReceipts |
| **ROFL Sui Mirror**       | ✅        | 🚧     | Translates Sui events → Sapphire synthetic events via ROFL         |
| Device Registry           | ✅        | 🚧     | Shared infra for vault & wallet                                    |
| Recovery Kit              | ✅        | 🚧     | Sui zkLogin + secret share recovery                                |
| Phishing Heuristics       | ✅        | 🚧     | Built into signing proxy                                           |

**Current Infrastructure Status:**

- ✅ **Graph Node**: Running on localhost:8000-8040
- ✅ **Sapphire Emulator**: Connected to Oasis Sapphire testnet via Chainstack RPC
- ✅ **IPFS**: Running on localhost:5001
- ✅ **PostgreSQL**: Ready for subgraph data storage
- ✅ **Sample Subgraph**: Successfully deployed and indexing

---

## 7 · User Stories (Graph + Mirror-Aware)

| ID   | Story                                                                       | Acceptance Tests                                                  |
| ---- | --------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| G-01 | As a user, I see a toast within 3 s when **ROFL** flags a breached password | Subgraph emits `BreachAlert`; toast fires in UI                   |
| G-02 | As a developer, I query a public endpoint to list daily new vaults          | `dailyNewVaults` includes mirrored Sui events accurately via ROFL |
| G-03 | As a security auditor, I fetch last 100 signing events for a wallet         | `txSigneds` returns correct, ordered logs from Sapphire           |

---

## 8 · Functional Requirements (Graph-specific)

- **Data Sources**:

  - Sapphire contracts (`Vault`, `Signer`) via self-hosted Graph Node + RPC emulator
  - Sui events mirrored via **ROFL off-chain worker** to Sapphire

- **Entities**:  
  `Passkey`, `CredentialBlob`, `WalletMeta`, `Device`, `BreachAlert`, `TxSigned`

- **Subscriptions**:  
  WebSocket support for `BreachAlert`, `DeviceRevoked`

- **Rate Limits & Caching**:  
  100 req/s max, 30 s GraphQL cache

- **Health Checks**:  
  Extension pings `/health`; < 200 ms response

---

## 9 · Non-Functional Requirements

- **Performance**:

  - 95 % GraphQL queries < 300 ms
  - Subscriptions < 2 s lag

- **Reliability**:

  - Multi-replica Graph node
  - ROFL worker retries and event replays
  - RPC emulator failover and monitoring

- **Security**:
  - HTTPS + API key required
  - Read-only GraphQL endpoint

---

## 10 · Technical Architecture

```
                     +------------------------------+
                     |        User Browser          |
                     |------------------------------|
                     | React UI + Service Worker    |
                     | - GraphQL: localhost:8000    |
                     | - Sui JS SDK (write txs)     |
                     | - Ethers.js (EVM txs)        |
                     +--------------+---------------+
                                    |
                                    v
                         +----------+----------+
                         |  Self-Hosted Graph  |
                         |     Node Suite      |
                         |---------------------|
                         | :8000 - GraphQL     |
                         | :8001 - WebSocket   |
                         | :8020 - JSON-RPC    |
                         | :8030 - Index Node  |
                         | :8040 - Metrics     |
                         +----------+----------+
                                    ^
                                    |
                     +--------------+---------------+
                     |  Sapphire RPC Emulator       |
                     |  localhost:8545               |
                     |  (eth_getBlockReceipts)       |
                     +--------------+---------------+
                                    ^
                                    |
              +---------------------+----------------------+
              |  Oasis Sapphire Testnet                   |
              |  (chainstack.com/459accf...)              |
              |  Signer + Vault Contracts                 |
              +------------------+-------------------------+
                                 |
                                 v
                  +--------------+--------------+
                  |     Walrus Blob Storage     |
                  |   + Access Control Layer    |
                  +-----------------------------+

                         [ ROFL Off-Chain Worker ]
                          +----------------+
                          | Listens to Sui |
                          | RPC Events     |
                          | Calls Sapphire |
                          | emitSyntheticEvent() |
                          +--------+-------+
                                   |
                                   v
                        [ Mirrors to Sapphire ]
```

---

## 11 · Detailed Graph Node + Sapphire Setup Guide

Our **Graph Node infrastructure is deployed and tested** with a working setup that can index any EVM-compatible chain, including Oasis Sapphire.

### 📁 Project Structure

```
graph-node/
├── docker/
│   ├── docker-compose.yml          # Full Graph Node stack
│   ├── emulator/
│   │   ├── Dockerfile              # Sapphire RPC emulator
│   │   ├── index.js                # eth_getBlockReceipts implementation
│   │   └── package.json            # Dependencies
│   └── data/                       # Persistent data volumes
└── my-oasis-subgraph/              # Example subgraph project
    ├── subgraph.yaml               # Subgraph manifest
    ├── schema.graphql              # GraphQL schema
    ├── src/mapping.ts              # Event handlers
    ├── abis/                       # Contract ABIs
    └── package.json                # Graph CLI dependencies
```

### 🛠️ Infrastructure Setup

#### Step 1: Start the Graph Node Stack

```bash
# Clone the repository and navigate to docker directory
cd graph-node/docker

# Start all services (Graph Node, IPFS, PostgreSQL, Emulator)
docker-compose up -d

# Verify all services are running
docker-compose ps
```

**Expected Services:**
| Service | Port | Status | Purpose |
|---------|------|--------|---------|
| Graph Node GraphQL | 8000 | ✅ Running | Query endpoint for subgraphs |
| Graph Node WebSocket | 8001 | ✅ Running | Real-time subscriptions |
| Graph Node JSON-RPC | 8020 | ✅ Running | Subgraph deployment |
| Index Node | 8030 | ✅ Running | Subgraph management |
| Metrics | 8040 | ✅ Running | Prometheus metrics |
| IPFS | 5001 | ✅ Running | Subgraph manifest storage |
| PostgreSQL | 5432 | ✅ Running | Indexed data storage |
| **Sapphire Emulator** | 8545 | ✅ Running | RPC proxy with `eth_getBlockReceipts` |

#### Step 2: Verify Emulator Connectivity

```bash
# Test basic RPC connectivity
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Test eth_getBlockReceipts (custom method)
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBlockReceipts","params":["latest"],"id":1}'
```

### 📊 Subgraph Development & Deployment

#### Step 1: Install Graph CLI

```bash
# Install globally
npm install -g @graphprotocol/graph-cli

# Verify installation
graph --version
```

#### Step 2: Create a New Subgraph Project

```bash
# Create project directory
mkdir my-grandwarden-subgraph
cd my-grandwarden-subgraph

# Initialize package.json
npm init -y

# Install dependencies
npm install @graphprotocol/graph-cli@0.69.0 @graphprotocol/graph-ts@0.31.0
```

#### Step 3: Configure Subgraph Manifest

Create `subgraph.yaml`:

```yaml
specVersion: 0.0.4
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum/contract
    name: GrandWardenVault
    network: oasis # This MUST match docker-compose.yml: ethereum: 'oasis:http://emulator:8545'
    source:
      address: "0xYourSapphireContractAddress"
      abi: GrandWardenVault
      startBlock: 12700000 # Use recent block number
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      file: ./src/mapping.ts
      entities:
        - VaultCreated
        - DeviceRegistered
        - BreachAlert
        - User
      abis:
        - name: GrandWardenVault
          file: ./abis/GrandWardenVault.json
      eventHandlers:
        - event: VaultCreated(indexed address,bytes32,uint256)
          handler: handleVaultCreated
        - event: DeviceRegistered(indexed address,bytes32,string)
          handler: handleDeviceRegistered
        - event: BreachAlert(indexed address,uint256,string)
          handler: handleBreachAlert
```

#### Step 4: Define GraphQL Schema

Create `schema.graphql`:

```graphql
type VaultCreated @entity(immutable: true) {
  id: ID!
  user: User!
  vaultId: Bytes!
  timestamp: BigInt!
  blockNumber: BigInt!
  transactionHash: Bytes!
}

type DeviceRegistered @entity(immutable: true) {
  id: ID!
  user: User!
  deviceId: Bytes!
  deviceName: String!
  timestamp: BigInt!
  blockNumber: BigInt!
  transactionHash: Bytes!
}

type BreachAlert @entity(immutable: true) {
  id: ID!
  user: User!
  severity: BigInt!
  message: String!
  timestamp: BigInt!
  blockNumber: BigInt!
  transactionHash: Bytes!
}

type User @entity(immutable: false) {
  id: ID! # address
  vaultsCreated: [VaultCreated!]! @derivedFrom(field: "user")
  devicesRegistered: [DeviceRegistered!]! @derivedFrom(field: "user")
  breachAlerts: [BreachAlert!]! @derivedFrom(field: "user")
  totalVaults: BigInt!
  totalDevices: BigInt!
  totalBreaches: BigInt!
  lastActivity: BigInt!
}
```

#### Step 5: Implement Event Handlers

Create `src/mapping.ts`:

```typescript
import { BigInt } from "@graphprotocol/graph-ts";
import {
  VaultCreated as VaultCreatedEvent,
  DeviceRegistered as DeviceRegisteredEvent,
  BreachAlert as BreachAlertEvent,
} from "../generated/GrandWardenVault/GrandWardenVault";
import {
  VaultCreated,
  DeviceRegistered,
  BreachAlert,
  User,
} from "../generated/schema";

export function handleVaultCreated(event: VaultCreatedEvent): void {
  // Create or load user
  let user = User.load(event.params.user.toHexString());
  if (user == null) {
    user = new User(event.params.user.toHexString());
    user.totalVaults = BigInt.fromI32(0);
    user.totalDevices = BigInt.fromI32(0);
    user.totalBreaches = BigInt.fromI32(0);
    user.lastActivity = BigInt.fromI32(0);
  }
  user.totalVaults = user.totalVaults.plus(BigInt.fromI32(1));
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create VaultCreated entity
  let vaultCreated = new VaultCreated(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  vaultCreated.user = user.id;
  vaultCreated.vaultId = event.params.vaultId;
  vaultCreated.timestamp = event.block.timestamp;
  vaultCreated.blockNumber = event.block.number;
  vaultCreated.transactionHash = event.transaction.hash;

  vaultCreated.save();
}

export function handleDeviceRegistered(event: DeviceRegisteredEvent): void {
  // Create or load user
  let user = User.load(event.params.user.toHexString());
  if (user == null) {
    user = new User(event.params.user.toHexString());
    user.totalVaults = BigInt.fromI32(0);
    user.totalDevices = BigInt.fromI32(0);
    user.totalBreaches = BigInt.fromI32(0);
    user.lastActivity = BigInt.fromI32(0);
  }
  user.totalDevices = user.totalDevices.plus(BigInt.fromI32(1));
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create DeviceRegistered entity
  let deviceRegistered = new DeviceRegistered(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  deviceRegistered.user = user.id;
  deviceRegistered.deviceId = event.params.deviceId;
  deviceRegistered.deviceName = event.params.deviceName;
  deviceRegistered.timestamp = event.block.timestamp;
  deviceRegistered.blockNumber = event.block.number;
  deviceRegistered.transactionHash = event.transaction.hash;

  deviceRegistered.save();
}

export function handleBreachAlert(event: BreachAlertEvent): void {
  // Create or load user
  let user = User.load(event.params.user.toHexString());
  if (user == null) {
    user = new User(event.params.user.toHexString());
    user.totalVaults = BigInt.fromI32(0);
    user.totalDevices = BigInt.fromI32(0);
    user.totalBreaches = BigInt.fromI32(0);
    user.lastActivity = BigInt.fromI32(0);
  }
  user.totalBreaches = user.totalBreaches.plus(BigInt.fromI32(1));
  user.lastActivity = event.block.timestamp;
  user.save();

  // Create BreachAlert entity
  let breachAlert = new BreachAlert(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  breachAlert.user = user.id;
  breachAlert.severity = event.params.severity;
  breachAlert.message = event.params.message;
  breachAlert.timestamp = event.block.timestamp;
  breachAlert.blockNumber = event.block.number;
  breachAlert.transactionHash = event.transaction.hash;

  breachAlert.save();
}
```

#### Step 6: Add Contract ABI

Create `abis/GrandWardenVault.json` with your contract's ABI including the events:

```json
[
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "vaultId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "VaultCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "deviceId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "deviceName",
        "type": "string"
      }
    ],
    "name": "DeviceRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "severity",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "message",
        "type": "string"
      }
    ],
    "name": "BreachAlert",
    "type": "event"
  }
]
```

#### Step 7: Build and Deploy

```bash
# Generate TypeScript types
graph codegen

# Build the subgraph
graph build

# Create subgraph on local Graph Node
graph create --node http://localhost:8020 grandwarden-vault

# Deploy to local Graph Node
graph deploy --node http://localhost:8020 --ipfs http://localhost:5001 grandwarden-vault
```

### 🔍 Querying Your Subgraph

#### GraphQL Endpoint

```
http://localhost:8000/subgraphs/name/grandwarden-vault
```

#### Example Queries

**Get recent vault creations:**

```graphql
{
  vaultCreateds(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    user {
      id
    }
    vaultId
    timestamp
    blockNumber
  }
}
```

**Get users with most activity:**

```graphql
{
  users(first: 5, orderBy: totalVaults, orderDirection: desc) {
    id
    totalVaults
    totalDevices
    totalBreaches
    lastActivity
  }
}
```

**Get recent breach alerts:**

```graphql
{
  breachAlerts(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    user {
      id
    }
    severity
    message
    timestamp
  }
}
```

**Subscribe to real-time breach alerts:**

```graphql
subscription {
  breachAlerts(first: 1, orderBy: timestamp, orderDirection: desc) {
    id
    user {
      id
    }
    severity
    message
    timestamp
  }
}
```

### 🔧 Operational Commands

#### Health Checks

```bash
# Check Graph Node status
curl http://localhost:8030/health

# Check subgraph sync status
curl -X POST http://localhost:8000/subgraphs/name/grandwarden-vault \
  -H "Content-Type: application/json" \
  -d '{"query":"{ _meta { block { number } } }"}'

# Check emulator connectivity
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

#### Monitoring & Logs

```bash
# View Graph Node logs
docker-compose logs graph-node

# View emulator logs
docker-compose logs emulator

# View all service logs
docker-compose logs

# Monitor PostgreSQL data
docker-compose exec postgres psql -U graph-node -d graph-node -c "SELECT * FROM subgraphs.subgraph;"
```

#### Troubleshooting

**Common Issues:**

1. **Subgraph stuck at old block:**

   - Check RPC emulator logs for rate limiting
   - Verify upstream Sapphire RPC is responding
   - Consider adjusting start block to more recent

2. **No events indexed:**

   - Verify contract address is correct
   - Check that events are actually being emitted
   - Ensure ABI matches contract events exactly

3. **Build errors:**
   - Update Graph CLI to latest version
   - Check TypeScript types are correctly generated
   - Verify all imports in mapping.ts

### 📋 Configuration Reference

#### Docker Compose Configuration

**Key emulator configuration in `docker-compose.yml`:**

```yaml
emulator:
  build: ./emulator
  ports:
    - "8545:8545"
  environment:
    UPSTREAM_RPC: https://oasis-sapphire-testnet.core.chainstack.com/459accf372e882984c0af24ea5c6da20

graph-node:
  image: graphprotocol/graph-node
  environment:
    ethereum: "oasis:http://emulator:8545" # This connects Graph Node to our emulator
    postgres_host: postgres
    ipfs: "ipfs:5001"
```

#### Emulator Features

The custom Sapphire emulator (`docker/emulator/index.js`) provides:

1. **eth_getBlockReceipts emulation** - Aggregates individual transaction receipts
2. **Transparent proxy** - Forwards all other RPC calls to Sapphire
3. **Error handling** - Graceful upstream RPC failures
4. **Request logging** - Debug incoming Graph Node requests

### 🎯 Integration with ROFL

When your ROFL worker mirrors Sui events to Sapphire:

1. **ROFL calls Sapphire contract** method (e.g., `emitSyntheticEvent()`)
2. **Sapphire contract emits standard EVM events** that match your subgraph schema
3. **Graph Node picks up events** via the emulator
4. **Subgraph indexes events** using your mapping handlers
5. **Frontend queries GraphQL** endpoint for real-time data

This creates a seamless bridge from Sui → Sapphire → Graph Node → Your App.

---

## 12 · Timeline

| Phase              | Duration     | Status | Milestones                                           |
| ------------------ | ------------ | ------ | ---------------------------------------------------- |
| **Infrastructure** | **COMPLETE** | ✅     | **Graph Node + Sapphire emulator deployed & tested** |
| Smart Contracts    | +2 weeks     | 🚧     | `Signer.sol` with Graph event logs                   |
| Subgraph Dev       | +1 week      | ✅     | **COMPLETE** - Manifest, schema, mappings working    |
| **ROFL Worker**    | +1 week      | 🚧     | Sui event → Sapphire mirror via ROFL                 |
| Front-end          | +3 weeks     | 🚧     | Toasts via GraphQL subscriptions                     |
| Alpha              | 3 weeks      | 🚧     | 25 testers, uptime ≥ 99 %                            |
| Beta               | 3 weeks      | 🚧     | Public devnet + docs                                 |
| GA                 | —            | 🚧     | Mainnet + open-sourced subgraph                      |

**Total duration: ~15 weeks** _(reduced by 6 weeks due to infrastructure + subgraph completion)_

---

## 13 · Risks & Mitigations

| Risk                                  | Likelihood | Impact | Mitigation                                               | Status |
| ------------------------------------- | ---------- | ------ | -------------------------------------------------------- | ------ |
| Subgraph lags behind chain            | Medium     | Medium | Auto re-index, fallback to RPC cache                     | ✅     |
| **RPC emulator fails or bottlenecks** | Low        | High   | **MITIGATED** - Health checks, monitoring deployed       | ✅     |
| **ROFL mirror fails or delayed**      | Medium     | High   | Retry queue, telemetry alerts, Sapphire fallback queries | 🚧     |
| Query spam / overload                 | Low        | Medium | API keys, Graph CDN caching, rate limits (100 req/s)     | ✅     |

---

## 14 · Next Immediate Steps

### 🎯 Ready for Smart Contract Integration

1. **Deploy Grand Warden contracts** to Sapphire testnet with proper event emissions
2. **Update subgraph** with actual contract addresses and ABIs
3. **Test event flow** - Deploy contract → Emit events → Query subgraph
4. **ROFL Integration** - Connect Sui event mirroring to Sapphire
5. **Frontend Integration** - Build React components that query GraphQL endpoint

### 🔧 Current Working Infrastructure

```bash
# Start the full stack (everything works)
cd docker && docker-compose up -d

# Deploy your own subgraph
cd ../my-grandwarden-subgraph
graph codegen && graph build
graph create --node http://localhost:8020 grandwarden-vault
graph deploy --node http://localhost:8020 --ipfs http://localhost:5001 grandwarden-vault

# Query your subgraph
curl -X POST http://localhost:8000/subgraphs/name/grandwarden-vault \
  -H "Content-Type: application/json" \
  -d '{"query":"{ _meta { block { number } } }"}'
```

---

## 15 · Future Enhancements

- Prometheus metrics adapter for subgraph uptime
- Public Dune dashboard sourced from Graph data
- Graph AccountKit integration for wallet-linked identity proofs
- Multi-region Graph Node clustering
- Sapphire mainnet emulator deployment
- Rate limiting and caching optimizations
- Automated subgraph deployment CI/CD

---

## 16 · Open Questions

1. Should wallet sign events expose caller address or anonymize it?
2. Self-hosted Graph cluster vs. Edge & Node proxy hosting?
3. Should EIP-4337 Account Abstraction be in scope for v1?
4. **Mainnet deployment strategy: dedicated Sapphire RPC or scale emulator?**
5. **Subgraph versioning strategy for contract upgrades?**

---

**End of Document**

_Infrastructure Status: **Graph Node + Sapphire Emulator + Sample Subgraph DEPLOYED** ✅_

_Next: Smart contract deployment with event emissions → Full end-to-end testing_
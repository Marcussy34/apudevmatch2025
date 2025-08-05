# 🚀 Grand Warden Comprehensive Build Plan

_Created: January 2025 | Version: 1.0_  
_Based on: PLAN.md v4 + Current Project Analysis_

---

## Executive Summary

**Grand Warden** is a privacy-first security suite combining password management and Web3 wallet security in a browser extension. The project leverages Oasis Sapphire for confidential compute, Sui for public state, and The Graph for real-time data indexing.

### Current Status Assessment

- ✅ **Graph Node Infrastructure**: Fully deployed and tested
- ✅ **Frontend UI Components**: Complete React dashboard with all major components
- ✅ **Sapphire Development Environment**: Hardhat configuration ready
- ✅ **Browser Extension Structure**: Manifest and basic architecture complete
- 🚧 **Smart Contracts**: Basic Vigil contract exists, need full Grand Warden implementation
- 🚧 **ROFL Worker**: Directory exists but no implementation
- 🚧 **Integration Layer**: Frontend not connected to blockchain
- 🚧 **Security Features**: zkLogin, recovery, phishing protection pending

### Phase Approach

This plan structures development into 6 sequential phases that build incrementally toward a production-ready system. Each phase is designed to deliver standalone value while preparing for subsequent integrations.

---

## Phase Overview Table

| Phase   | Name                        | Duration | Dependencies           | Key Deliverables                       | Risk Level |
| ------- | --------------------------- | -------- | ---------------------- | -------------------------------------- | ---------- |
| **1**   | Smart Contract Foundation   | 2 weeks  | Hardhat setup ✅       | Sapphire contracts, events, testing    | Medium     |
| **1.5** | Sui Infrastructure & Move   | 1 week   | Phase 1                | Sui contracts, Walrus, public state    | Medium     |
| **2**   | Subgraph Integration        | 1 week   | Phases 1-1.5, Graph ✅ | Real-time indexing, GraphQL API        | Low        |
| **3**   | Frontend-Blockchain Bridge  | 2 weeks  | Phases 1-2             | Web3 integration, transaction flows    | Medium     |
| **4**   | ROFL Sui Mirror             | 1 week   | Phases 1-3             | Cross-chain event mirroring            | High       |
| **5**   | Security & Recovery Systems | 3 weeks  | All previous phases    | zkLogin, recovery, phishing protection | High       |
| **6**   | Production Deployment       | 2 weeks  | All previous phases    | Extension packaging, testnet deploy    | Medium     |

**Total Timeline: 12 weeks**

---

## Detailed Phase Breakdown

### 🏗️ Phase 1: Smart Contract Foundation

**Objective**: Deploy complete Grand Warden smart contracts with proper event emissions for password vault, wallet vault, and device management.

#### Scope

- **Password Vault Contract**: Encrypted credential storage with breach detection
- **Wallet Vault Contract**: Web3 key management with enclave signing
- **Device Registry Contract**: Multi-device authentication and management
- **Access Control**: Role-based permissions and recovery mechanisms
- **Event System**: Comprehensive logging for Graph indexing

#### Technical Specifications

```solidity
// Core contracts to implement
contracts/
├── GrandWardenVault.sol     // Main password vault
├── WalletVault.sol          // Web3 wallet management
├── DeviceRegistry.sol       // Device authentication
├── RecoveryManager.sol      // Backup and recovery
└── interfaces/
    ├── IGrandWarden.sol
    └── IVaultEvents.sol
```

**Key Events to Emit**:

- `VaultCreated(address indexed user, bytes32 vaultId, uint256 timestamp)`
- `DeviceRegistered(address indexed user, bytes32 deviceId, string deviceName)`
- `BreachAlert(address indexed user, uint256 severity, string message)`
- `WalletStored(address indexed user, bytes32 walletId, uint8 chainType)`
- `TransactionSigned(address indexed user, bytes32 txHash, uint256 timestamp)`

#### Dependencies

- ✅ Hardhat + Sapphire environment (complete)
- ✅ Oasis Sapphire testnet access (configured)

#### Risk Assessment

- **Medium Risk**: Sapphire-specific features may require learning curve
- **Mitigation**: Use existing Vigil.sol as reference, extensive testing

#### Success Metrics

- [ ] All contracts deployed to Sapphire testnet
- [ ] Comprehensive test suite with >90% coverage
- [ ] Events properly emitted and verifiable
- [ ] Gas optimization completed
- [ ] Security audit checklist passed

#### Completion Criteria

1. **Functional Requirements**: All contract methods work as specified
2. **Event Emissions**: All events fire correctly with proper indexing
3. **Security**: No critical vulnerabilities in static analysis
4. **Documentation**: ABI files and integration docs ready
5. **Testing**: Integration tests pass against live testnet

---

### ⚡ Phase 1.5: Sui Infrastructure & Move Contracts

**Objective**: Implement Sui Move contracts for public state management, device registry, and Walrus integration with zkLogin foundation.

#### Scope

- **Sui Development Environment**: Move compiler, Sui CLI, and testing framework setup
- **Move Contract Development**: Public state contracts for device registry and vault metadata
- **Walrus + Seal Integration**: Decentralized blob storage with access control layer
- **zkLogin Foundation**: Sui-side authentication infrastructure preparation
- **Public State Management**: Move objects for publicly visible metadata and CID pointers

#### Technical Specifications

```move
// Core Sui contracts to implement
sui-contracts/sources/
├── device_registry.move        // Multi-device authentication
├── vault_metadata.move         // Public vault pointers and metadata
├── recovery_coordinator.move   // Social recovery state management
├── walrus_manager.move         // CID management and access control
└── zklogin_auth.move          // Authentication state coordination

// Key Move modules structure:

module grandwarden::device_registry {
    struct DeviceInfo has key, store {
        id: UID,
        owner: address,
        device_name: String,
        public_key: vector<u8>,
        sapphire_counterpart: address,
        registered_at: u64,
        status: u8, // Active, Revoked, Suspended
    }

    public fun register_device(
        device_name: String,
        public_key: vector<u8>,
        sapphire_address: address,
        ctx: &mut TxContext
    ): DeviceInfo

    public fun revoke_device(device: &mut DeviceInfo, ctx: &TxContext)
    public fun get_user_devices(owner: address): vector<ID>
}

module grandwarden::vault_metadata {
    struct VaultPointer has key, store {
        id: UID,
        owner: address,
        sapphire_vault_address: address,
        walrus_blob_id: String,
        metadata_hash: vector<u8>,
        created_at: u64,
        last_accessed: u64,
        access_count: u64,
    }

    public fun create_vault_pointer(
        sapphire_address: address,
        walrus_cid: String,
        metadata_hash: vector<u8>,
        ctx: &mut TxContext
    ): VaultPointer

    public fun update_access_time(vault: &mut VaultPointer, ctx: &TxContext)
}

module grandwarden::walrus_manager {
    struct BlobPermission has key, store {
        id: UID,
        blob_id: String,
        owner: address,
        authorized_devices: vector<address>,
        access_policy: u8, // Owner, Devices, Public
        created_at: u64,
    }

    public fun store_blob_metadata(
        blob_id: String,
        access_policy: u8,
        authorized_devices: vector<address>,
        ctx: &mut TxContext
    ): BlobPermission

    public fun grant_blob_access(
        permission: &mut BlobPermission,
        device_address: address,
        ctx: &TxContext
    )
}
```

**Key Events to Emit**:

- `DeviceRegistered(address indexed user, ID device_id, String device_name)`
- `DeviceRevoked(address indexed user, ID device_id, u64 timestamp)`
- `VaultPointerCreated(address indexed user, ID vault_id, String walrus_cid)`
- `BlobAccessGranted(address indexed user, String blob_id, address device)`
- `RecoveryInitiated(address indexed user, ID recovery_id, u64 threshold)`

#### Dependencies

- ✅ Phase 1 Sapphire contracts (for coordination)
- ❗ Sui CLI and Move development environment
- ❗ Walrus testnet access and documentation
- ❗ Sui zkLogin SDK integration

#### Resources Needed

- Move/Sui development expertise
- Walrus protocol understanding
- Cross-chain state management design
- zkLogin integration knowledge

#### Estimated Timeline: 1 week

- Days 1-2: Sui environment setup and basic Move contracts
- Days 3-4: Walrus integration and access control implementation
- Days 5-7: zkLogin preparation, testing, and deployment

#### Risk Assessment

- **Medium Risk**: Move language learning curve and Walrus integration complexity
- **Mitigation**: Start with simple contracts, extensive Sui documentation study, Walrus testnet testing

#### Success Metrics

- [ ] All Move contracts deployed to Sui testnet
- [ ] Walrus blob storage and retrieval working
- [ ] Device registration flow functional on Sui
- [ ] Cross-chain state coordination with Sapphire verified
- [ ] zkLogin authentication foundation ready

#### Completion Criteria

1. **Move Contracts**: All Sui contracts deployed and functional
2. **Walrus Integration**: Blob storage with proper access control working
3. **Public State**: Device registry and vault metadata accessible
4. **Cross-Chain Prep**: Events and state ready for ROFL mirroring
5. **zkLogin Ready**: Authentication infrastructure prepared for Phase 5

---

### 📊 Phase 2: Subgraph Integration

**Objective**: Deploy production subgraph that indexes all Grand Warden contract events from both Sapphire and Sui chains, providing a unified real-time GraphQL API.

#### Scope

- **Multi-Chain Subgraph Development**: Schema design for both Sapphire and Sui events
- **Dual Event Handlers**: TypeScript mappings for Sapphire (via emulator) and Sui events (via ROFL mirror)
- **Unified GraphQL Schema**: Complete API for frontend consumption across chains
- **Real-time Subscriptions**: WebSocket support for live updates from both chains
- **Cross-Chain Data Aggregation**: User statistics, breach analytics, usage metrics across Sapphire and Sui

#### Technical Specifications

```yaml
# Subgraph structure
subgraph/
├── schema.graphql           # GraphQL schema
├── subgraph.yaml           # Manifest with contract addresses
├── src/
│   ├── vault-mapping.ts    # Password vault events
│   ├── wallet-mapping.ts   # Wallet vault events
│   ├── device-mapping.ts   # Device registry events
│   └── utils.ts           # Helper functions
└── abis/
    ├── GrandWardenVault.json
    ├── WalletVault.json
    └── DeviceRegistry.json
```

**Key Entities**:

- `User`: Aggregated user data and statistics
- `VaultEntry`: Individual password vault entries
- `WalletStorage`: Web3 wallet metadata
- `Device`: Registered device information
- `BreachAlert`: Security breach notifications
- `Transaction`: Signed transaction records

#### Dependencies

- ✅ Graph Node infrastructure (deployed)
- ✅ Sapphire emulator (working)
- ❗ Phase 1 Sapphire contracts with events
- ❗ Phase 1.5 Sui contracts and ROFL preparation

#### Resources Needed

- The Graph development experience
- GraphQL schema design skills
- TypeScript/AssemblyScript knowledge

#### Estimated Timeline: 1 week

- Days 1-2: Schema design and manifest configuration
- Days 3-4: Event handler implementation
- Days 5-7: Testing, optimization, deployment

#### Risk Assessment

- **Low Risk**: Infrastructure already proven working
- **Mitigation**: Existing sample subgraph as template

#### Success Metrics

- [ ] All contract events properly indexed
- [ ] GraphQL queries respond <300ms (95th percentile)
- [ ] Real-time subscriptions work <2s latency
- [ ] 100% event coverage from smart contracts
- [ ] Aggregated data accuracy verified

#### Completion Criteria

1. **Data Integrity**: All events indexed without missing data
2. **Performance**: Query response times meet SLA
3. **Real-time**: Subscriptions working for critical events
4. **Schema**: Complete GraphQL API documented
5. **Monitoring**: Health checks and metrics enabled

---

### 🌉 Phase 3: Frontend-Blockchain Bridge

**Objective**: Connect the existing React frontend to both Sapphire and Sui smart contracts, enabling full cross-chain password vault and wallet management functionality.

#### Scope

- **Multi-Chain Web3 Integration**: Ethers.js for Sapphire + Sui TypeScript SDK
- **Cross-Chain Transaction Flows**: CRUD operations coordinated across Sapphire and Sui
- **GraphQL Client**: Apollo Client for unified real-time data fetching
- **Multi-Chain State Management**: Context/Redux for coordinated blockchain state
- **Cross-Chain Error Handling**: User-friendly transaction error messages for both chains
- **Dual-Chain Loading States**: Transaction progress indicators for multi-chain operations

#### Technical Specifications

```typescript
// Multi-chain integration layers to implement
src/
├── services/
│   ├── chains/
│   │   ├── sapphire.ts         // Sapphire contract interaction (Ethers.js)
│   │   ├── sui.ts              // Sui contract interaction (Sui SDK)
│   │   └── coordinator.ts      // Cross-chain coordination logic
│   ├── graphql.ts             // Apollo client setup
│   ├── encryption.ts          // Client-side encryption
│   └── walrus.ts             // Walrus blob storage client
├── hooks/
│   ├── useSapphireContracts.ts // Sapphire contract hooks
│   ├── useSuiContracts.ts     // Sui Move contract hooks
│   ├── useVault.ts            // Cross-chain vault operations
│   ├── useWallet.ts           // Multi-chain wallet operations
│   └── useDevices.ts          // Device registry (Sui + Sapphire)
├── types/
│   ├── sapphire.ts            // Sapphire contract types
│   ├── sui.ts                 // Sui Move contract types
│   ├── cross-chain.ts         // Cross-chain operation types
│   └── graphql.ts             // GraphQL generated types
└── utils/
    ├── crypto.ts              // Encryption helpers
    ├── formatting.ts          // Data formatting
    ├── walrus-client.ts       // Walrus SDK integration
    └── chain-sync.ts          // Cross-chain state synchronization
```

**Key Integrations**:

- **Cross-Chain Password Operations**: Sapphire (private) + Sui (metadata) + Walrus (encrypted storage)
- **Multi-Chain Wallet Management**: Sapphire private keys + Sui public pointers
- **Device Registration**: Sui public registry + Sapphire private permissions
- **Walrus Blob Management**: Decentralized storage with Sui access control
- **Real-time Cross-Chain Updates**: Live breach alerts and status updates across chains
- **Coordinated Transaction Flows**: Multi-chain transaction approval and execution

#### Dependencies

- ✅ React frontend components (complete)
- ❗ Phase 1 Sapphire smart contracts
- ❗ Phase 1.5 Sui Move contracts and Walrus integration
- ❗ Phase 2 unified subgraph API

#### Resources Needed

- React/TypeScript expertise
- Multi-chain Web3 development experience (Ethers.js + Sui SDK)
- Cross-chain blockchain UX design knowledge
- Encryption/security understanding
- Walrus protocol integration experience

#### Estimated Timeline: 2 weeks

- Week 1: Sapphire + Sui SDK integration, basic cross-chain operations
- Week 2: Walrus integration, advanced cross-chain features, error handling, optimization

#### Risk Assessment

- **Medium Risk**: Complex cross-chain state management and transaction coordination
- **Mitigation**: Incremental integration, extensive cross-chain testing, fallback mechanisms

#### Success Metrics

- [ ] All cross-chain password CRUD operations working
- [ ] Multi-chain wallet storage and retrieval functional
- [ ] Device registration working across Sui and Sapphire
- [ ] Walrus blob storage integrated with UI
- [ ] Real-time GraphQL subscriptions active for both chains
- [ ] Cross-chain transaction success rate >90%
- [ ] User error rate <8% (higher due to multi-chain complexity)

#### Completion Criteria

1. **Cross-Chain Feature Completeness**: All planned UI features connected to both Sapphire and Sui
2. **Multi-Chain Data Consistency**: UI state matches coordinated blockchain state across chains
3. **Performance**: App remains responsive during multi-chain operations
4. **Cross-Chain Error Handling**: All failure modes handled gracefully including chain-specific errors
5. **User Experience**: Smooth cross-chain transaction flows abstracted from technical complexity

---

### 🔄 Phase 4: ROFL Sui Mirror

**Objective**: Implement ROFL off-chain worker to mirror Sui blockchain events into Sapphire for comprehensive cross-chain indexing.

#### Scope

- **ROFL Worker Development**: Trusted execution environment worker
- **Sui Event Monitoring**: Real-time Sui blockchain event listening
- **Cross-chain Bridge**: Emit synthetic events on Sapphire
- **Event Translation**: Map Sui events to Sapphire event schema
- **Reliability System**: Retry logic, error handling, monitoring

#### Technical Specifications

```rust
// ROFL worker structure
rofl-worker/
├── src/
│   ├── main.rs            // Main worker entry point
│   ├── sui_monitor.rs     // Sui blockchain monitoring
│   ├── sapphire_bridge.rs // Sapphire event emission
│   ├── event_mapper.rs    // Event translation logic
│   └── config.rs          // Configuration management
├── Cargo.toml             // Rust dependencies
└── enclave/
    ├── Enclave.edl        // Enclave definition
    └── trusted/           // TEE-protected code
```

**Key Components**:

- **Sui RPC Client**: Monitor Sui for relevant events
- **Event Queue**: Reliable event processing pipeline
- **Sapphire Client**: Emit synthetic events to contracts
- **State Synchronization**: Ensure event consistency
- **Monitoring**: Health checks and alerting

#### Dependencies

- ❗ Phases 1-3 for event schema
- ✅ Graph Node infrastructure
- ❗ Sui blockchain access and understanding

#### Resources Needed

- Rust development skills
- ROFL/SGX enclave experience
- Sui blockchain knowledge
- Distributed systems expertise

#### Estimated Timeline: 1 week

- Days 1-2: ROFL worker setup and Sui monitoring
- Days 3-4: Event translation and Sapphire integration
- Days 5-7: Testing, reliability, deployment

#### Risk Assessment

- **High Risk**: ROFL technology complexity and limited documentation
- **Mitigation**: Start with simple event mirroring, gradual complexity

#### Success Metrics

- [ ] Sui events detected within 10 seconds
- [ ] 100% event translation accuracy
- [ ] Synthetic Sapphire events properly indexed
- [ ] <1% event processing failure rate
- [ ] Worker uptime >99.5%

#### Completion Criteria

1. **Event Monitoring**: All relevant Sui events captured
2. **Translation Accuracy**: Events correctly mapped to Sapphire schema
3. **Reliability**: Worker handles failures and restarts gracefully
4. **Performance**: Event processing latency <30 seconds
5. **Integration**: Subgraph successfully indexes mirrored events

---

### 🔒 Phase 5: Security & Recovery Systems

**Objective**: Implement comprehensive security features including Sui zkLogin authentication, cross-chain social recovery, and phishing protection leveraging the foundation built in previous phases.

#### Scope

- **Sui zkLogin Integration**: Seedphrase-free onboarding with Google/Apple using Sui authentication
- **Cross-Chain Social Recovery**: Multi-party secret sharing coordinated across Sapphire and Sui
- **Enhanced Walrus Security**: Advanced blob encryption and access control using established integration
- **Phishing Detection**: Real-time website analysis and warnings
- **Breach Monitoring**: Automated password compromise detection across chains
- **Security Analytics**: Risk scoring and behavioral analysis using cross-chain data

#### Technical Specifications

```typescript
// Security system structure
src/security/
├── zklogin/
│   ├── auth.ts            // zkLogin implementation
│   ├── providers.ts       // OAuth provider integration
│   └── verification.ts    // JWT verification
├── recovery/
│   ├── shares.ts          // Secret sharing (Shamir's)
│   ├── social.ts          // Social recovery flows
│   └── backup.ts          // Backup generation
├── phishing/
│   ├── detector.ts        // Real-time phishing detection
│   ├── database.ts        // Known phishing DB
│   └── heuristics.ts      // Behavioral analysis
└── walrus/
    ├── client.ts          // Walrus blob client
    ├── acl.ts            // Access control layer
    └── seal.ts           // Seal protocol integration
```

**Key Features**:

- **zkLogin Flow**: OAuth → JWT → Zero-knowledge proof → Blockchain auth
- **Recovery Mechanism**: Generate/store/recover secret shares
- **Phishing Protection**: URL analysis, domain reputation, ML detection
- **Encrypted Storage**: Client-side encryption before Walrus upload
- **Breach Alerts**: Monitor password databases and notify users

#### Dependencies

- ❗ Phases 1-4 for complete foundation
- ✅ Phase 1.5 Sui zkLogin foundation and Walrus integration (established)
- ❗ Enhanced Sui zkLogin SDK integration for production
- ❗ Cross-chain recovery coordination mechanisms

#### Resources Needed

- Zero-knowledge proof expertise
- Cryptography/security specialist
- OAuth/JWT implementation experience
- Machine learning for phishing detection

#### Estimated Timeline: 3 weeks

- Week 1: zkLogin and OAuth integration
- Week 2: Recovery system and secret sharing
- Week 3: Phishing protection and Walrus integration

#### Risk Assessment

- **High Risk**: Complex cryptographic implementations and multiple external dependencies
- **Mitigation**: Phase development, extensive security testing, expert review

#### Success Metrics

- [ ] Sui zkLogin onboarding works for Google/Apple with cross-chain coordination
- [ ] Cross-chain social recovery successfully restores accounts on both chains
- [ ] Enhanced Walrus security with cross-chain access control functional
- [ ] Phishing detection catches >90% of known threats
- [ ] Cross-chain breach alerts fire within 24 hours
- [ ] End-to-end encryption verified across Sapphire, Sui, and Walrus

#### Completion Criteria

1. **Cross-Chain Authentication**: Sui zkLogin flow completely functional with Sapphire coordination
2. **Cross-Chain Recovery**: Social recovery tested with real shares across both chains
3. **Security**: Phishing protection actively working for cross-chain operations
4. **Enhanced Storage**: Walrus integration with cross-chain ACLs and advanced encryption
5. **Cross-Chain Monitoring**: Breach detection system operational across Sapphire and Sui

---

### 🚀 Phase 6: Production Deployment

**Objective**: Package, test, and deploy Grand Warden as a production-ready browser extension with testnet contracts.

#### Scope

- **Extension Packaging**: Complete browser extension build and manifest
- **Testnet Deployment**: Smart contracts on Oasis Sapphire testnet
- **Production Infrastructure**: Hosted Graph Node and monitoring
- **Security Audit**: Professional security review and penetration testing
- **Documentation**: User guides, developer docs, API reference
- **Distribution**: Chrome Web Store and Firefox Add-ons submission

#### Technical Specifications

```bash
# Production deployment structure
deployment/
├── extension/
│   ├── manifest.json      # Production manifest
│   ├── background.js      # Service worker
│   └── content-scripts/   # Page injection scripts
├── infrastructure/
│   ├── testnet-contracts/ # Production contract addresses
│   ├── graph-node/       # Production Graph Node
│   └── monitoring/       # Uptime and metrics
├── security/
│   ├── audit-report.pdf  # Security audit results
│   └── penetration-test/ # Pen test results
└── docs/
    ├── user-guide/       # End-user documentation
    ├── developer/        # Integration guides
    └── api-reference/    # GraphQL API docs
```

**Key Deliverables**:

- **Production Extension**: Signed and verified browser extension
- **Testnet Contracts**: Deployed and verified smart contracts
- **Hosted Infrastructure**: Reliable Graph Node hosting
- **Security Certification**: Audit and penetration test results
- **Complete Documentation**: User and developer resources

#### Dependencies

- ❗ All phases 1-5 completed and tested
- ❗ Security audit organization

#### Risk Assessment

- **Medium Risk**: Store approval process and testnet gas costs
- **Mitigation**: Early store engagement, testnet rehearsal

#### Success Metrics

- [ ] Extension approved by Chrome Web Store
- [ ] Testnet contracts deployed successfully
- [ ] Security audit passes with no critical issues
- [ ] Documentation complete and user-tested
- [ ] Production monitoring operational

#### Completion Criteria

1. **Extension**: Live in browser stores and installable
2. **Contracts**: Testnet deployment verified and functional
3. **Infrastructure**: Production services running with monitoring
4. **Security**: Audit completed with all issues resolved
5. **Documentation**: Complete user and developer resources

---

## Integration Architecture

### System Architecture Diagram

```
    ┌─────────────────────────────────────────────────────────────┐
    │                    Browser Extension                        │
    │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
    │  │   React UI      │  │   Service Worker │  │ Content     │ │
    │  │   Components    │  │   (Background)   │  │ Scripts     │ │
    │  └─────────────────┘  └──────────────────┘  └─────────────┘ │
    └─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                   GraphQL API Layer                         │
    │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
    │  │   Graph Node    │  │   Apollo Client  │  │ WebSocket   │ │
    │  │   (localhost:   │  │   (Frontend)     │  │ Subscript.  │ │
    │  │    8000)        │  │                  │  │             │ │
    │  └─────────────────┘  └──────────────────┘  └─────────────┘ │
    └─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                Blockchain Integration                       │
    │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
    │  │ Oasis Sapphire  │  │   ROFL Worker    │  │ Sui Network │ │
    │  │ Smart Contracts │  │ (Event Mirror)   │  │  (zkLogin)  │ │
    │  └─────────────────┘  └──────────────────┘  └─────────────┘ │
    └─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                   Storage & Security                        │
    │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
    │  │ Walrus Blob     │  │  TEE Encryption  │  │ Recovery    │ │
    │  │ Storage         │  │  (Sapphire)      │  │ Shares      │ │
    │  └─────────────────┘  └──────────────────┘  └─────────────┘ │
    └─────────────────────────────────────────────────────────────┘
```

### Data Flow Patterns

**1. Password Storage Flow**:

```
User Input → Client Encryption → Smart Contract → Event Emission →
Subgraph Indexing → GraphQL Update → UI Refresh
```

**2. Cross-Chain Event Flow**:

```
Sui Event → ROFL Worker → Sapphire Synthetic Event → Graph Indexing →
Real-time Subscription → UI Notification
```

**3. Recovery Flow**:

```
zkLogin Auth → Share Generation → Distributed Storage → Recovery Request →
Share Reconstruction → Account Restoration
```

### API Contracts

**GraphQL Schema (Core Entities)**:

```graphql
type User {
  id: ID! # Blockchain address
  vaults: [VaultEntry!]! # Password entries
  wallets: [WalletStorage!]! # Web3 wallets
  devices: [Device!]! # Registered devices
  alerts: [BreachAlert!]! # Security alerts
  createdAt: BigInt!
  lastActivity: BigInt!
}

type VaultEntry {
  id: ID!
  user: User!
  encryptedData: Bytes! # Encrypted password data
  metadata: String! # Site info, username
  lastAccessed: BigInt!
  breachStatus: BreachStatus!
}

type WalletStorage {
  id: ID!
  user: User!
  chainType: ChainType! # EVM, Sui, etc.
  encryptedKey: Bytes! # Encrypted private key
  publicAddress: String!
  lastUsed: BigInt!
}
```

**Smart Contract Interfaces**:

**Sapphire (Solidity)**:

```solidity
interface IGrandWardenVault {
    function storePassword(bytes32 vaultId, bytes calldata encryptedData) external;
    function getPassword(bytes32 vaultId) external view returns (bytes memory);
    function reportBreach(address user, uint256 severity, string calldata message) external;
}

interface IWalletVault {
    function storeWallet(bytes32 walletId, uint8 chainType, bytes calldata encryptedKey) external;
    function signTransaction(bytes32 walletId, bytes32 txHash) external returns (bytes memory);
}
```

**Sui (Move)**:

```move
module grandwarden::device_registry {
    public fun register_device(
        device_name: String,
        public_key: vector<u8>,
        sapphire_address: address,
        ctx: &mut TxContext
    ): DeviceInfo

    public fun revoke_device(device: &mut DeviceInfo, ctx: &TxContext)
    public fun get_user_devices(owner: address): vector<ID>
}

module grandwarden::vault_metadata {
    public fun create_vault_pointer(
        sapphire_address: address,
        walrus_cid: String,
        metadata_hash: vector<u8>,
        ctx: &mut TxContext
    ): VaultPointer

    public fun update_access_time(vault: &mut VaultPointer, ctx: &TxContext)
}

module grandwarden::walrus_manager {
    public fun store_blob_metadata(
        blob_id: String,
        access_policy: u8,
        authorized_devices: vector<address>,
        ctx: &mut TxContext
    ): BlobPermission
}
```

---

## Risk Mitigation Strategy

### High-Risk Components

**1. ROFL Worker Complexity**

- **Risk**: Limited documentation and complex SGX implementation
- **Mitigation**:
  - Start with minimal viable implementation
  - Extensive testing in isolated environment
  - Fallback to direct RPC polling if ROFL fails
  - Expert consultation for SGX debugging

**2. zkLogin Integration**

- **Risk**: Sui zkLogin SDK changes or OAuth provider issues
- **Mitigation**:
  - Implement traditional private key backup as fallback
  - Test with multiple OAuth providers
  - Monitor Sui SDK updates closely
  - Design modular auth system for easy provider swapping

**3. Cross-Chain Event Synchronization**

- **Risk**: Events lost or duplicated between Sui and Sapphire
- **Mitigation**:
  - Implement idempotent event handling
  - Add event sequence numbers and checksums
  - Build event replay capability
  - Monitor synchronization lag with alerts

**4. Smart Contract Security**

- **Risk**: Contract vulnerabilities or economic attacks
- **Mitigation**:
  - Multiple security audits before testnet
  - Gradual rollout with limited funds
  - Bug bounty program post-launch
  - Emergency pause functionality in contracts

### Medium-Risk Components

**1. Graph Node Scalability**

- **Risk**: GraphQL performance degrades with usage
- **Mitigation**:
  - Implement query complexity limits
  - Add Redis caching layer
  - Plan for horizontal Graph Node scaling
  - Monitor query performance metrics

**2. Browser Extension Distribution**

- **Risk**: Store rejection or delayed approval
- **Mitigation**:
  - Engage with store teams early
  - Ensure compliance with all policies
  - Prepare PWA fallback version
  - Build direct distribution capability

### Contingency Plans

**Technical Failures**:

- **ROFL Unavailable**: Fall back to direct Sui RPC monitoring
- **Graph Node Down**: Implement direct contract reading mode
- **Sapphire Issues**: Deploy to backup EVM-compatible chain
- **Store Rejection**: Launch as PWA with manual installation

**Timeline Delays**:

- **Critical Path**: Focus on core password vault functionality first
- **Parallel Development**: Run frontend and contract development simultaneously
- **Scope Reduction**: Remove advanced features to meet deadlines
- **Extended Timeline**: Communicate transparently with stakeholders

---

## Success Validation Plan

### Phase Validation Gates

**Phase 1 - Sapphire Smart Contracts**:

- [ ] All contract functions callable from Hardhat console
- [ ] Events emit correctly and are captured by test listeners
- [ ] Gas costs under reasonable limits (< 100k gas per operation)
- [ ] Security static analysis passes without critical issues

**Phase 1.5 - Sui Infrastructure & Move Contracts**:

- [ ] All Move contracts deployed and functional on Sui testnet
- [ ] Walrus blob storage and retrieval working
- [ ] Device registration flow functional on Sui
- [ ] Cross-chain state coordination with Sapphire verified
- [ ] zkLogin authentication foundation ready

**Phase 2 - Multi-Chain Subgraph**:

- [ ] Query endpoint responds to all planned queries across both chains
- [ ] Real-time subscriptions fire within 2 seconds for both Sapphire and Sui events
- [ ] Historical data accuracy verified against both blockchains
- [ ] Cross-chain query performance meets SLA (95% < 300ms)
- [ ] Cross-chain data consistency verified

**Phase 3 - Cross-Chain Frontend Integration**:

- [ ] All UI interactions trigger correct multi-chain transactions
- [ ] User can complete full cross-chain password storage/retrieval flow
- [ ] Device registration works across Sui and Sapphire
- [ ] Walrus blob operations integrated with UI
- [ ] Cross-chain error states handled gracefully with clear messages
- [ ] State consistency maintained across UI components and chains

**Phase 4 - ROFL Worker**:

- [ ] Sui events detected and translated within 30 seconds
- [ ] Synthetic Sapphire events match original Sui events
- [ ] Worker recovers from failures automatically
- [ ] End-to-end event flow verified from Sui to UI

**Phase 5 - Cross-Chain Security Systems**:

- [ ] Sui zkLogin successfully authenticates users with cross-chain coordination
- [ ] Cross-chain social recovery restores account access on both chains
- [ ] Enhanced Walrus security with cross-chain access control functional
- [ ] Phishing detection flags test malicious sites for cross-chain operations
- [ ] End-to-end encryption/decryption flows work across Sapphire, Sui, and Walrus

**Phase 6 - Production**:

- [ ] Extension installs and runs in production browsers
- [ ] Multi-chain testnet contracts (Sapphire + Sui) verified and functional
- [ ] Cross-chain production monitoring shows green health status
- [ ] Security audit finds no critical vulnerabilities across all chains
- [ ] Walrus integration working in production environment

### Integration Testing Framework

**End-to-End Test Scenarios**:

1. **New User Onboarding**:

   - Install extension → zkLogin setup → Create first vault → Store password → Verify storage

2. **Cross-Chain Event Flow**:

   - Trigger Sui event → Verify ROFL capture → Check Sapphire emission → Confirm subgraph index → See UI update

3. **Recovery Scenario**:

   - Create account → Generate recovery shares → Simulate device loss → Recover using shares → Verify access

4. **Security Response**:

   - Detect breach → Generate alert → Fire UI notification → User remediation → Threat resolution

5. **Multi-Device Sync**:
   - Register device A → Store passwords → Register device B → Verify sync → Test concurrent updates

### Monitoring & Metrics

**Operational Metrics**:

- Graph Node uptime and query latency
- Smart contract gas usage and failure rates
- ROFL worker event processing speed
- Extension crash rates and user errors

**Security Metrics**:

- Breach detection accuracy and false positive rates
- Recovery success rates
- Phishing detection effectiveness
- Contract audit findings and remediation

---

## Project Completeness Framework

### Feature Completeness Checklist

**Core Password Vault**:

- [ ] Create encrypted password entries
- [ ] Retrieve and decrypt stored passwords
- [ ] Update existing password entries
- [ ] Delete password entries
- [ ] Search and filter password vault
- [ ] Browser autofill integration
- [ ] Password strength analysis
- [ ] Breach detection and alerts

**Web3 Wallet Vault**:

- [ ] Store encrypted private keys
- [ ] Multi-chain support (EVM, Sui)
- [ ] Transaction signing workflows
- [ ] Key derivation and management
- [ ] Hardware wallet integration
- [ ] Wallet import/export functionality

**Security & Recovery**:

- [ ] zkLogin OAuth integration
- [ ] Social recovery share generation
- [ ] Multi-party recovery workflows
- [ ] Phishing detection and warnings
- [ ] Encryption key management
- [ ] Device registration and management

**Cross-Chain Infrastructure**:

- [ ] Oasis Sapphire smart contracts (private operations)
- [ ] Sui Move contracts (public state, device registry, metadata)
- [ ] The Graph multi-chain subgraph indexing
- [ ] ROFL Sui event mirroring to Sapphire
- [ ] Real-time GraphQL subscriptions across chains
- [ ] Walrus decentralized storage with Sui access control
- [ ] Cross-chain state synchronization and coordination

### Technical Completeness Requirements

**Smart Contract Coverage**:

- [ ] All planned Sapphire contract methods implemented
- [ ] All planned Sui Move contract functions implemented
- [ ] Comprehensive event emission for indexing across both chains
- [ ] Gas optimization completed for both Sapphire and Sui
- [ ] Security audit passed for both chain implementations
- [ ] Emergency controls implemented with cross-chain coordination

**Frontend Integration**:

- [ ] All UI components connected to both Sapphire and Sui blockchains
- [ ] Cross-chain error handling for all failure modes
- [ ] Loading states for multi-chain async operations
- [ ] State management with consistent cross-chain data
- [ ] Performance optimization completed for multi-chain operations
- [ ] Walrus blob operations integrated seamlessly

**Infrastructure Reliability**:

- [ ] Multi-chain Graph Node monitoring and alerting
- [ ] ROFL worker health checks and failover
- [ ] Cross-chain database backup and recovery
- [ ] Load balancing and failover across chains
- [ ] Security logging and monitoring for Sapphire, Sui, and Walrus
- [ ] Cross-chain state synchronization monitoring

### Quality Assurance Standards

**Testing Requirements**:

- [ ] Unit tests for all smart contract functions (Sapphire Solidity + Sui Move)
- [ ] Integration tests for cross-chain frontend-blockchain flows
- [ ] End-to-end tests for critical cross-chain user journeys
- [ ] Load testing for multi-chain GraphQL performance
- [ ] Cross-chain security penetration testing completed
- [ ] Walrus integration and access control testing

**Documentation Standards**:

- [ ] User guides for all major features
- [ ] Developer documentation for integration
- [ ] API reference documentation
- [ ] Deployment and operations guides
- [ ] Security best practices documentation

**Code Quality**:

- [ ] TypeScript/Solidity code coverage >90%
- [ ] Linting and formatting standards enforced
- [ ] Code review process followed
- [ ] Architecture decision records maintained
- [ ] Performance profiling completed

---

## Conclusion

This comprehensive build plan provides a systematic approach to completing Grand Warden as a production-ready security suite. The phase-based structure ensures each component builds upon previous work while delivering incremental value.

**Key Success Factors**:

1. **Rigorous Phase Gates**: Each phase must fully complete before proceeding
2. **Integration Testing**: Continuous validation of component interactions
3. **Security Focus**: Security considerations embedded throughout development
4. **User Experience**: Maintaining simplicity despite technical complexity
5. **Monitoring**: Proactive monitoring and alerting at every layer

**Next Immediate Actions**:

1. Begin Phase 1 Sapphire smart contract development
2. Set up Sui development environment and Move compiler for Phase 1.5
3. Establish CI/CD pipeline for automated testing (both Hardhat and Sui)
4. Plan security audit engagement early for multi-chain architecture
5. Begin user research for cross-chain UX validation

The infrastructure foundation is strong, and the frontend components are well-developed. With disciplined execution of this comprehensive cross-chain plan, Grand Warden can achieve its goal of becoming the premier privacy-first security suite for Web2 and Web3 credentials, leveraging the best of both Oasis Sapphire's confidential compute and Sui's efficient public state management.

---

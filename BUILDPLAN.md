# 🚀 Grand Warden Comprehensive Build Plan

_Created: January 2025 | Version: 1.0_  
_Based on: PLAN.md v4 + Current Project Analysis_

---

## Executive Summary

**Grand Warden** is a privacy-first security suite combining password management and Web3 wallet security in a browser extension. The project leverages a carefully orchestrated technology stack where:

- **Oasis Sapphire** serves as the Confidential Compute and Private Logic Layer
- **Sui** acts as the Public Coordination and State Layer
- **Oasis ROFL** functions as the Critical Data Bridge connecting Sui and Sapphire
- **Walrus + Seal** provides Decentralized Storage and Access Control
- **Sui zkLogin** enables Primary Authentication and Onboarding
- **The Graph** operates as the Real-Time Data Layer for unified GraphQL access

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

**Objective**: Deploy complete Grand Warden smart contracts with proper event emissions for password vault, wallet vault, and device management, including MirrorInbox for ROFL mirroring and canonical ABI.

#### Scope

- **Password Vault Contract**: Encrypted credential storage with breach detection, atomic vault blob management, and secure credential operations
- **Wallet Vault Contract**: Web3 key management with BIP39/BIP44 key derivation, multi-chain private key generation, enclave-based signing, and real-time balance fetching
- **Device Registry Contract**: Multi-device authentication and management with secure device authorization
- **Access Control**: Role-based permissions and recovery mechanisms with atomic state updates
- **Event System**: Comprehensive logging for Graph indexing with real-time UI notifications
- **Multi-Chain RPC Integration**: Native support for Ethereum, Polygon, and other EVM chains within Sapphire TEE
- **Atomic Vault Operations**: Secure blob encryption/decryption with coordinated Walrus and Sui state management
- **MirrorInbox Entry**: Dedicated entrypoint for ROFL with attestation/allowlist, idempotency (eventId), ordering (seq), and payload.version

#### Technical Specifications

```solidity
// Core contracts to implement
contracts/
├── GrandWardenVault.sol     // Main password vault with atomic operations
├── WalletVault.sol          // Web3 wallet management with multi-chain support
├── DeviceRegistry.sol       // Device authentication
├── RecoveryManager.sol      // Backup and recovery
├── MultiChainRPC.sol        // Multi-chain balance and RPC integration
├── AtomicVaultManager.sol   // Coordinated vault state management
└── interfaces/
    ├── IGrandWarden.sol
    ├── IWalletVault.sol     // Enhanced wallet interface
    ├── IPasswordVault.sol   // Enhanced password interface
    ├── IMultiChainRPC.sol   // Multi-chain RPC interface
    └── IVaultEvents.sol

// Enhanced contract interfaces for user flow support

interface IWalletVault {
    // Seed phrase import and key derivation
    function importSeedPhrase(bytes calldata encryptedSeed, string calldata walletName)
        external returns (bytes32 walletId);

    // BIP39/BIP44 key derivation for multiple chains
    function deriveKeysFromSeed(bytes32 walletId, uint8[] calldata chainTypes)
        external returns (address[] memory addresses);

    // Multi-chain balance fetching within TEE
    function fetchWalletBalances(bytes32 walletId)
        external view returns (ChainBalance[] memory balances);

    // Secure transaction signing (EVM now; Sui Ed25519 path added later)
    function signTransaction(bytes32 walletId, uint8 chainType, bytes32 txHash, bytes calldata txData)
        external returns (bytes memory signature);

    // Wallet metadata management
    function updateWalletMetadata(bytes32 walletId, string calldata name, bool isActive) external;

    // Events for user flow
    event WalletImported(address indexed user, bytes32 indexed walletId, string name, uint256 timestamp);
    event BalancesFetched(address indexed user, bytes32 indexed walletId, uint256 totalValue);
    // Canonical ABI (includes chain type)
    event TransactionSigned(address indexed user, bytes32 indexed walletId, bytes32 txHash, uint8 chainType);
}

interface IPasswordVault {
    // Add credential to existing vault
    function addCredential(bytes32 vaultId, string calldata domain,
                          string calldata username, bytes calldata encryptedPassword) external;

    // Update entire vault blob atomically
    function updateVaultBlob(bytes32 vaultId, bytes calldata newEncryptedBlob)
        external returns (string memory newCID);

    // Retrieve decrypted credentials (TEE only)
    function getCredential(bytes32 vaultId, string calldata domain)
        external view returns (string memory username, string memory password);

    // Atomic vault operations with Walrus coordination
    function atomicVaultUpdate(bytes32 vaultId, bytes calldata newData)
        external returns (string memory newCID, bytes32 suiTxHash);

    // Events for user flow
    event CredentialAdded(address indexed user, bytes32 indexed vaultId, string domain, uint256 timestamp);
    event VaultBlobUpdated(address indexed user, bytes32 indexed vaultId, string newCID, bytes32 suiTxHash);
}

interface IMultiChainRPC {
    struct ChainBalance {
        uint8 chainType;      // 1=Ethereum, 2=Polygon, 3=BSC, etc.
        string tokenSymbol;   // ETH, MATIC, BNB, etc.
        uint256 balance;      // Balance in wei
        uint256 usdValue;     // USD value (optional)
    }

    // Fetch balances for specific address across multiple chains
    function getMultiChainBalances(address wallet, uint8[] calldata chains)
        external view returns (ChainBalance[] memory);

    // Execute RPC call to specific chain
    function executeChainRPC(uint8 chainType, string calldata method, bytes calldata params)
        external view returns (bytes memory result);

    // Update RPC endpoints for chains
    function updateChainRPC(uint8 chainType, string calldata rpcUrl) external;
}

interface IAtomicVaultManager {
    // Coordinate Walrus upload and Sui state update
    function executeAtomicUpdate(bytes32 vaultId, bytes calldata newVaultData)
        external returns (string memory walrusCID, bytes32 suiTxHash);

    // Rollback failed atomic operations
    function rollbackFailedUpdate(bytes32 vaultId, string calldata failedCID) external;

    // Verify atomic operation completion
    function verifyAtomicCompletion(bytes32 vaultId, string calldata cid, bytes32 suiTxHash)
        external view returns (bool completed);

    // Events for atomic operations
    event AtomicUpdateStarted(address indexed user, bytes32 indexed vaultId, string walrusCID);
    event AtomicUpdateCompleted(address indexed user, bytes32 indexed vaultId, bytes32 suiTxHash);
    event AtomicUpdateFailed(address indexed user, bytes32 indexed vaultId, string reason);
}
```

**Key Events to Emit for User Flow Support**:

- `VaultCreated(address indexed user, bytes32 vaultId, uint256 timestamp)`
- `DeviceRegistered(address indexed user, bytes32 deviceId, string deviceName)`
- `BreachAlert(address indexed user, uint256 severity, string message)`
- `WalletImported(address indexed user, bytes32 walletId, string walletName, uint256 timestamp)` // For seed phrase import flow
- `BalancesFetched(address indexed user, bytes32 walletId, uint256 totalValue)` // For real-time balance display
- `CredentialAdded(address indexed user, bytes32 vaultId, string domain, uint256 timestamp)` // For password save flow
- `VaultBlobUpdated(address indexed user, bytes32 vaultId, string newCID, bytes32 suiTxHash)` // For atomic updates
- `AtomicUpdateCompleted(address indexed user, bytes32 vaultId, bytes32 suiTxHash)` // For UI confirmation
- `TransactionSigned(address indexed user, bytes32 walletId, bytes32 txHash, uint8 chainType)` // Canonical signature

#### Dependencies

- ✅ Hardhat + Sapphire environment (complete)
- ✅ Oasis Sapphire testnet access (configured)

#### Risk Assessment

- **Medium Risk**: Sapphire-specific features may require learning curve
- **Mitigation**: Use existing Vigil.sol as reference, extensive testing

#### Success Metrics

- [ ] All contracts deployed to Sapphire testnet with enhanced interfaces
- [ ] Comprehensive test suite with >90% coverage including user flow scenarios
- [ ] All events properly emitted and verifiable by The Graph
- [ ] Gas optimization completed for multi-chain operations
- [ ] Security audit checklist passed for TEE operations
- [ ] BIP39/BIP44 key derivation working correctly
- [ ] Multi-chain RPC integration functional (ETH, MATIC, etc.)
- [ ] Atomic vault operations tested and reliable
- [ ] Balance fetching performance <2 seconds
- [ ] Seed phrase import flow complete end-to-end

#### Completion Criteria

1. **Functional Requirements**: All contract methods work as specified with user flow support
2. **Event Emissions**: All events fire correctly with proper indexing for real-time UI updates
3. **Security**: No critical vulnerabilities in static analysis, especially for TEE operations
4. **Documentation**: ABI files and integration docs ready with user flow examples
5. **Testing**: Integration tests pass against live testnet including seed phrase import and password save flows
6. **Multi-Chain Integration**: RPC calls to Ethereum and Polygon working within TEE
7. **Atomic Operations**: Walrus coordination and Sui state updates functioning reliably
8. **Performance**: Balance fetching and vault operations meet <2 second response time requirements

---

### ⚡ Phase 1.5: Sui Public Coordination Layer & Move Contracts

**Objective**: Implement Sui as the Public Coordination and State Layer with Move contracts for device registry, vault metadata pointers, and Walrus + Seal integration, establishing the foundation for zkLogin authentication.

#### Scope

- **Sui Development Environment**: Move compiler, Sui CLI, and testing framework setup
- **Public State Management**: Move objects that represent public-facing system aspects and serve as source of truth for all public, on-chain user actions
- **Device Registry**: Manage users' lists of authorized devices with public keys and status (active, revoked) as a public, auditable log
- **Data Pointers**: Store public pointers (Content Identifiers, CIDs) that reference encrypted data blobs stored on Walrus
- **Walrus (Storage) + Seal (Access Control)**: Decentralized blob storage with fine-grained access control layer
- **Recovery Logic Coordination**: Manage guardian lists and recovery thresholds for social recovery
- **zkLogin Foundation**: Establish seedphrase-free authentication infrastructure linked to Web2 social logins
- **Event Source**: Act as origin for key user actions (vault creation, device registration) that feed into the data mirroring pipeline

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

Include `eventId` and per-source `seq` on all events for mirroring correctness:

- `DeviceRegistered(user, device_id, device_name, public_key, registered_at, eventId, seq)`
- `DeviceStatusChanged(user, device_id, new_status, changed_at, reason?, eventId, seq)`
- `VaultPointerCreated(user, vault_id, walrus_cid, metadata_hash, created_at, eventId, seq)`
- `VaultPointerSet(user, vault_id, walrus_cid, metadata_hash, stage, updated_at, eventId, seq)`
- `BlobACLUpdated(user, blob_id, policy, authorized_devices[], updated_at, eventId, seq)`
- `RecoveryInitiated/Approved/Completed(..., eventId, seq)`

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

### 📊 Phase 2: The Graph Real-Time Data Layer

**Objective**: Deploy The Graph as the Real-Time Data Layer, providing unified queryable access to all system events and state changes through a GraphQL interface that indexes Sapphire events (including Sui events mirrored via ROFL).

#### Scope

- **Unified Event Indexing**: Index all EVM events emitted by Sapphire contracts (including synthetic events mirrored from Sui via ROFL)
- **Event Handler Development**: TypeScript mappings for Sapphire native events and ROFL-mirrored Sui events
- **Unified GraphQL Interface**: Single API endpoint for frontend to query all system activity across chains
- **Real-time Subscriptions**: WebSocket subscriptions for instant UI updates when events occur
- **Data Aggregation**: Combine and correlate events from multiple sources into coherent user and system-level metrics

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

### 🌉 Phase 3: Frontend Integration with Coordinated Blockchain Layers

**Objective**: Connect the React frontend to the coordinated blockchain architecture, enabling password vault and wallet management functionality across Sapphire (confidential compute), Sui (public coordination), and Walrus + Seal (decentralized storage with access control).

#### Scope

- **Coordinated Layer Integration**: Ethers.js for Sapphire (confidential compute) + Sui TypeScript SDK (public coordination)
- **Coordinated Transaction Flows**: Operations that span Sapphire private compute, Sui public state, and Walrus storage
- **Unified GraphQL Client**: Apollo Client consuming The Graph's real-time data layer
- **Coordinated State Management**: Context/Redux managing state across coordinated blockchain layers
- **Layer-Specific Error Handling**: User-friendly error messages for Sapphire, Sui, and Walrus operations
- **Coordinated Loading States**: Transaction progress indicators across all architectural layers

#### Technical Specifications

```typescript
// Enhanced frontend architecture for user flow support
src/
├── content-scripts/
│   ├── form-detector.ts       // Detect login forms and successful submissions
│   ├── credential-capture.ts  // Secure credential extraction from forms
│   ├── ui-overlay.ts         // Password save prompts and notifications
│   ├── page-injection.ts     // Grand Warden icon injection in input fields
│   ├── autofill-handler.ts   // Automatic password filling
│   └── security-scanner.ts   // Real-time phishing and security analysis
├── services/
│   ├── chains/
│   │   ├── sapphire.ts       // Enhanced Sapphire integration with atomic operations
│   │   ├── sui.ts            // Sui contract interaction with real-time updates
│   │   ├── coordinator.ts    // Atomic cross-chain coordination logic
│   │   └── multi-chain-rpc.ts // Multi-chain balance fetching service
│   ├── graphql.ts           // Apollo client with real-time subscriptions
│   ├── encryption.ts        // Client-side encryption with secure memory management
│   ├── walrus.ts           // Enhanced Walrus integration with atomic uploads
│   ├── atomic-operations.ts // Atomic vault update coordination
│   └── balance-aggregator.ts // Real-time multi-chain balance aggregation
├── ui/
│   ├── wallet-import/
│   │   ├── SeedPhraseInput.tsx    // Secure seed phrase input component
│   │   ├── WalletBalances.tsx     // Real-time balance display
│   │   ├── ImportProgress.tsx     // Loading states for import process
│   │   └── SecurityWarnings.tsx   // Security notices and validations
│   ├── password-vault/
│   │   ├── CredentialCapture.tsx  // Password save prompt overlay
│   │   ├── AutofillStatus.tsx     // Autofill indicators and controls
│   │   └── SaveProgress.tsx       // Atomic save operation progress
│   ├── notifications/
│   │   ├── ToastManager.tsx       // Real-time notification system
│   │   ├── ConfirmationAnimations.tsx // Success/error animations
│   │   └── SecurityAlerts.tsx     // Breach and phishing alerts
│   └── loading-states/
│       ├── AtomicOperationLoader.tsx // Multi-step operation progress
│       ├── BalanceLoader.tsx         // Balance fetching indicators
│       └── TransactionLoader.tsx     // Cross-chain transaction progress
├── hooks/
│   ├── wallet-hooks/
│   │   ├── useSeedPhraseImport.ts    // Secure seed phrase import flow
│   │   ├── useWalletBalances.ts      // Real-time balance fetching
│   │   ├── useMultiChainWallet.ts    // Multi-chain wallet operations
│   │   └── useWalletSigning.ts       // Transaction signing workflows
│   ├── vault-hooks/
│   │   ├── useCredentialCapture.ts   // Website credential capture
│   │   ├── usePasswordSave.ts        // Atomic password save operations
│   │   ├── useAutofill.ts           // Automatic password filling
│   │   └── useVaultSync.ts          // Vault synchronization across devices
│   ├── ui-hooks/
│   │   ├── useToastNotifications.ts  // Real-time notification management
│   │   ├── useLoadingStates.ts       // Multi-step operation progress
│   │   ├── useFormDetection.ts       // Form detection and interaction
│   │   └── useSecurityAlerts.ts      // Security warning management
│   ├── blockchain-hooks/
│   │   ├── useSapphireContracts.ts   // Enhanced Sapphire contract hooks
│   │   ├── useSuiContracts.ts        // Sui Move contract hooks with real-time updates
│   │   ├── useAtomicOperations.ts    // Atomic cross-chain operation management
│   │   └── useGraphQLSubscriptions.ts // Real-time data subscriptions
│   └── storage-hooks/
│       ├── useWalrusStorage.ts       // Walrus blob management with atomic uploads
│       ├── useDeviceSync.ts          // Device registry and synchronization
│       └── useRecoveryShares.ts      // Recovery share management
├── types/
│   ├── user-flows/
│   │   ├── wallet-import.ts          // Seed phrase import flow types
│   │   ├── password-capture.ts       // Credential capture types
│   │   ├── atomic-operations.ts      // Atomic operation types
│   │   └── ui-interactions.ts        // UI interaction and animation types
│   ├── blockchain/
│   │   ├── sapphire.ts              // Enhanced Sapphire contract types
│   │   ├── sui.ts                   // Sui Move contract types
│   │   ├── multi-chain.ts           // Multi-chain balance and RPC types
│   │   └── events.ts                // Real-time event types
│   ├── storage/
│   │   ├── walrus.ts               // Walrus blob storage types
│   │   ├── vault-data.ts           // Vault data structure types
│   │   └── encryption.ts           // Encryption and security types
│   └── ui/
│       ├── notifications.ts         // Toast and alert types
│       ├── loading-states.ts        // Progress and loading indicator types
│       └── form-detection.ts        // Form detection and interaction types
└── utils/
    ├── security/
    │   ├── secure-input.ts          // Secure input handling and memory management
    │   ├── seed-phrase-validation.ts // BIP39 seed phrase validation
    │   ├── form-security.ts         // Form detection security measures
    │   └── phishing-detection.ts    // Real-time phishing detection
    ├── crypto/
    │   ├── encryption-helpers.ts    // Enhanced encryption utilities
    │   ├── key-derivation.ts       // BIP39/BIP44 key derivation
    │   └── secure-storage.ts       // Secure local storage management
    ├── coordination/
    │   ├── atomic-coordinator.ts    // Atomic cross-chain operation coordination
    │   ├── walrus-coordinator.ts   // Walrus upload coordination
    │   ├── sui-coordinator.ts      // Sui state update coordination
    │   └── failure-recovery.ts     // Atomic operation failure recovery
    ├── ui/
    │   ├── animation-helpers.ts     // Success/error animation utilities
    │   ├── progress-tracking.ts     // Multi-step operation progress tracking
    │   ├── notification-manager.ts  // Toast and alert management
    │   └── form-interaction.ts      // Form detection and interaction utilities
    └── performance/
        ├── balance-caching.ts       // Multi-chain balance caching
        ├── rpc-optimization.ts     // RPC call optimization and pooling
        └── subscription-manager.ts  // GraphQL subscription optimization

// Content Script Architecture for User Flow Support

// form-detector.ts - Detects login forms and submissions
export class FormDetector {
  // Detect login forms on page load
  detectLoginForms(): HTMLFormElement[] {
    const forms = document.querySelectorAll('form');
    return Array.from(forms).filter(form =>
      this.hasPasswordField(form) && this.hasUsernameField(form)
    );
  }

  // Monitor for successful form submissions
  monitorFormSubmissions(onSuccess: (credentials: Credentials) => void): void {
    document.addEventListener('submit', async (event) => {
      const form = event.target as HTMLFormElement;
      if (this.isLoginForm(form)) {
        const credentials = this.extractCredentials(form);

        // Wait for navigation to detect success
        setTimeout(() => {
          if (this.isLoginSuccessful()) {
            onSuccess(credentials);
          }
        }, 2000);
      }
    });
  }

  private isLoginSuccessful(): boolean {
    // Detect successful login by URL change, disappearing login form, etc.
    return !document.querySelector('form[data-login-form]') &&
           !document.querySelector('.error-message');
  }
}

// credential-capture.ts - Secure credential extraction
export class CredentialCapture {
  // Securely extract credentials from form
  extractCredentials(form: HTMLFormElement): Credentials {
    const usernameField = form.querySelector('input[type="email"], input[type="text"]') as HTMLInputElement;
    const passwordField = form.querySelector('input[type="password"]') as HTMLInputElement;

    const credentials = {
      domain: window.location.hostname,
      username: usernameField?.value || '',
      password: passwordField?.value || '',
      timestamp: Date.now()
    };

    // Clear sensitive data from memory immediately after use
    if (passwordField) passwordField.value = '';

    return credentials;
  }

  // Secure memory management for credentials
  secureStore(credentials: Credentials): Promise<string> {
    // Encrypt in memory before any storage
    const encrypted = this.encryptInMemory(credentials);

    // Clear original credentials from memory
    Object.keys(credentials).forEach(key => delete credentials[key]);

    return this.sendToExtension(encrypted);
  }
}

// ui-overlay.ts - Password save prompts
export class UIOverlay {
  // Show password save prompt
  showSavePrompt(credentials: Credentials): Promise<boolean> {
    return new Promise((resolve) => {
      const overlay = this.createSavePromptOverlay(credentials);
      document.body.appendChild(overlay);

      overlay.addEventListener('save', () => {
        this.showSuccessAnimation();
        resolve(true);
      });

      overlay.addEventListener('dismiss', () => {
        resolve(false);
      });
    });
  }

  // Show success animation
  showSuccessAnimation(): void {
    const animation = this.createCheckmarkAnimation();
    document.body.appendChild(animation);

    setTimeout(() => {
      animation.remove();
    }, 2000);
  }

  // Inject Grand Warden icons in input fields
  injectFieldIcons(): void {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    passwordFields.forEach(field => {
      const icon = this.createGrandWardenIcon();
      this.positionIconInField(field as HTMLInputElement, icon);
    });
  }
}

// Real-time balance fetching hook
export function useWalletBalances(walletId: string) {
  const [balances, setBalances] = useState<ChainBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        setLoading(true);
        // Call Sapphire contract for multi-chain balance fetching
        const result = await sapphireContract.fetchWalletBalances(walletId);
        setBalances(result);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();

    // Set up real-time balance updates via GraphQL subscription
    const subscription = subscribeToBalanceUpdates(walletId, (newBalances) => {
      setBalances(newBalances);
    });

    return () => subscription.unsubscribe();
  }, [walletId]);

  return { balances, loading, error };
}

// Atomic password save operation hook
export function usePasswordSave() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savePassword = async (credentials: Credentials): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);

      // Step 1: Encrypt credentials locally
      const encrypted = await encryptCredentials(credentials);

      // Step 2: Get current vault from Walrus
      const currentVault = await walrusService.getCurrentVault();

      // Step 3: Update vault in Sapphire TEE
      const { newCID, suiTxHash } = await sapphireContract.atomicVaultUpdate(
        currentVault.id,
        encrypted
      );

      // Step 4: Verify atomic completion
      const completed = await sapphireContract.verifyAtomicCompletion(
        currentVault.id,
        newCID,
        suiTxHash
      );

      if (!completed) {
        throw new Error('Atomic operation failed to complete');
      }

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { savePassword, saving, error };
}
```

**Key Coordinated Operations**:

- **Password Operations**: Sapphire (enclave-based encryption/decryption) + Sui (public metadata pointers) + Walrus (decentralized storage) + Seal (access control)
- **Wallet Management**: Sapphire (private key custody & signing) + Sui (public pointers and device registry)
- **Device Registration**: Sui (public auditable registry) + Sapphire (private permissions and authorization)
- **Blob Storage Coordination**: Walrus (decentralized storage) + Seal (access control enforcement) + Sui (access policy definition)
- **Real-time Data Flow**: Sui events → ROFL mirror → Sapphire synthetic events → The Graph indexing → Frontend updates
- **Coordinated Transaction Flows**: Operations orchestrated across all architectural layers with proper role separation

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

- [ ] **User Flow #1 - Seed Phrase Import**: Complete end-to-end MetaMask import working with real-time balance display
- [ ] **User Flow #2 - Password Save**: Form detection, credential capture, and atomic save operations functional
- [ ] **Content Script Integration**: Form detection, UI overlays, and Grand Warden icon injection working across major websites
- [ ] **Real-time Balance Display**: Multi-chain balance fetching <2 seconds, real-time updates via GraphQL subscriptions
- [ ] **Atomic Operations**: Walrus upload + Sui pointer update coordination >95% success rate
- [ ] **UI/UX Flow**: Loading states, progress indicators, and success/error animations working smoothly
- [ ] **Security Features**: Secure input handling, memory management, and phishing detection active
- [ ] **Cross-chain Coordination**: All coordinated operations across Sapphire, Sui, and Walrus functional
- [ ] **Performance**: Credential save operations complete in <2 seconds with atomic guarantees

#### Completion Criteria

1. **User Flow Completeness**: Both seed phrase import and password save flows working end-to-end as described
2. **Content Script Integration**: Form detection, credential capture, and UI overlay system fully functional
3. **Real-time Features**: Balance fetching, progress tracking, and notification system working with <2s latency
4. **Atomic Coordination**: Walrus + Sui atomic operations reliable with proper failure recovery
5. **Security Implementation**: Secure input handling, memory management, and phishing detection operational
6. **Performance Standards**: All user interactions meet responsiveness requirements (<2s for critical operations)
7. **UI/UX Polish**: Loading states, animations, and progress indicators provide smooth user experience
8. **Cross-Chain Data Consistency**: UI state accurately reflects coordinated blockchain state in real-time

---

### 🔄 Phase 4: ROFL Critical Data Bridge

**Objective**: Implement ROFL as the Critical Data Bridge that connects Sui and Sapphire ecosystems, solving the problem that The Graph cannot natively index Sui by making Sui activity "visible" to the EVM-centric Graph Node.

#### Scope

- **Trusted Off-Chain Worker**: ROFL worker that constantly listens to Sui network for relevant events (vault creation, device changes)
- **Cross-Chain Translation**: Translate detected Sui events into formats that Sapphire smart contracts can understand
- **Synthetic Event Triggering**: Call specific Sapphire contract functions (e.g., `emitSyntheticEvent()`) to emit corresponding EVM events
- **Enabling Sui Indexing**: Make Sui's activity "visible" to The Graph by mirroring events to Sapphire where they can be indexed
- **Reliability & Monitoring**: Retry logic, error handling, and telemetry for the critical bridge functionality
- **Idempotency & Ordering**: Durable dedupe by `eventId`, monotonic `seq` per source, exactly-once delivery
- **Attestation/Allowlist**: Prove ROFL identity to Sapphire or use allowlisted key
- **Durable Cursor/Replay**: Persist last processed cursor; resume without gaps/dupes

#### Technical Specifications

```rust
// Enhanced ROFL worker structure for user flow support
rofl-worker/
├── src/
│   ├── main.rs                 // Main worker entry point with user flow event prioritization
│   ├── monitoring/
│   │   ├── sui_monitor.rs      // Enhanced Sui blockchain monitoring for Grand Warden events
│   │   ├── event_filter.rs     // Filter for vault creation, device registration, password saves
│   │   ├── health_monitor.rs   // Worker health and performance monitoring
│   │   └── metrics_collector.rs // Event processing metrics and latency tracking
│   ├── bridging/
│   │   ├── sapphire_bridge.rs  // Enhanced Sapphire event emission for user flows
│   │   ├── event_mapper.rs     // Event translation with user flow context
│   │   ├── atomic_coordinator.rs // Coordinate atomic operations across chains
│   │   └── failure_recovery.rs // Handle failed bridge operations and retry logic
│   ├── processing/
│   │   ├── event_queue.rs      // Prioritized event processing queue
│   │   ├── batch_processor.rs  // Efficient batch processing for high throughput
│   │   ├── duplicate_filter.rs // Prevent duplicate event processing
│   │   └── state_tracker.rs    // Track cross-chain state synchronization
│   ├── security/
│   │   ├── attestation.rs      // TEE attestation and verification
│   │   ├── secure_comms.rs     // Secure communication with Sapphire
│   │   └── audit_logger.rs     // Security audit logging
│   └── config/
│       ├── config.rs           // Configuration management
│       ├── chain_config.rs     // Chain-specific configurations
│       └── retry_config.rs     // Retry and failure handling configurations
├── Cargo.toml                  // Enhanced Rust dependencies
├── enclave/
│   ├── Enclave.edl            // Enhanced enclave definition
│   ├── trusted/
│   │   ├── event_processor.rs  // TEE-protected event processing
│   │   ├── crypto_ops.rs      // Cryptographic operations
│   │   └── secure_storage.rs  // Secure temporary storage
│   └── untrusted/
│       ├── bridge_interface.rs // Interface to external systems
│       └── rpc_client.rs      // RPC client implementations
└── tests/
    ├── integration/
    │   ├── user_flow_tests.rs  // Test complete user flows through ROFL
    │   ├── atomic_ops_tests.rs // Test atomic operation coordination
    │   └── failure_recovery_tests.rs // Test failure scenarios
    └── unit/
        ├── event_mapping_tests.rs // Test event translation accuracy
        └── performance_tests.rs   // Test processing performance
```

**Enhanced Components for User Flow Support**:

- **Priority Event Processing**: Monitor Sui network with priority queue for user flow events (vault creation, password saves, wallet imports)
- **Atomic Operation Coordination**: Coordinate atomic operations across Sui and Sapphire to ensure data consistency
- **Enhanced Event Translation**: Convert Sui events to Sapphire-compatible format with user flow context and metadata
- **Failure Recovery System**: Handle failed bridge operations with retry logic, exponential backoff, and manual intervention alerts
- **Real-time Performance Monitoring**: Track bridge performance, event processing latency, and user flow completion rates
- **User Flow Validation**: Verify end-to-end user flow completion across both chains before marking operations as successful

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

- [ ] **User Flow Event Processing**: Vault creation and password save events processed within 10 seconds
- [ ] **Atomic Operation Success**: >95% success rate for coordinated Sui→Sapphire operations
- [ ] **Event Translation Accuracy**: 100% accuracy for user flow events with proper context preservation
- [ ] **Failure Recovery**: Failed operations recovered within 60 seconds using retry mechanisms
- [ ] **Real-time Performance**: End-to-end user flow completion tracking and validation working
- [ ] **Bridge Reliability**: Worker uptime >99.5% with automatic failover and recovery
- [ ] **User Flow Validation**: End-to-end verification of wallet import and password save flows via ROFL

#### Completion Criteria

1. **User Flow Event Monitoring**: All user flow events (vault creation, password saves, wallet imports) captured and processed
2. **Atomic Operation Coordination**: Coordinated operations across Sui and Sapphire working with >95% success rate
3. **Translation Accuracy**: Events correctly mapped to Sapphire schema with user flow context preserved
4. **Failure Recovery**: Robust retry mechanisms and failure recovery operational with <60 second recovery time
5. **Performance Standards**: Event processing latency <10 seconds for critical user flow events
6. **Integration Verification**: Subgraph successfully indexes all mirrored events with real-time UI updates working
7. **End-to-End Validation**: Complete user flows (seed phrase import, password save) working through ROFL bridge

---

### 🔒 Phase 5: Security & Recovery Systems with zkLogin

**Objective**: Implement comprehensive security features leveraging Sui zkLogin as the Primary Authentication and Onboarding Mechanism, along with coordinated social recovery and phishing protection across the established blockchain architecture.

#### Scope

- **Primary zkLogin Authentication**: Create seedphrase-free user experience by linking account access to Web2 social logins (Google, Apple)
- **Coordinated Social Recovery**: Multi-party secret sharing that serves as foundational component of account recovery flow
- **Enhanced Walrus + Seal Security**: Advanced blob encryption and access control leveraging the established decentralized storage with access control layer
- **Phishing Detection**: Real-time website analysis and warnings for operations across all blockchain layers
- **Breach Monitoring**: Automated password compromise detection using data aggregated from The Graph's real-time data layer
- **Security Analytics**: Risk scoring and behavioral analysis leveraging unified cross-chain data from The Graph

#### Technical Specifications

```typescript
// Enhanced security system structure for user flows
src/security/
├── zklogin/
│   ├── auth.ts            // Enhanced zkLogin implementation for seamless onboarding
│   ├── providers.ts       // Google/Apple OAuth provider integration
│   ├── verification.ts    // JWT verification and proof generation
│   ├── key-linking.ts     // Link zkLogin identity to Grand Warden vault
│   └── session-manager.ts // Secure session management across devices
├── seed-phrase/
│   ├── secure-input.ts    // Secure seed phrase input handling with memory protection
│   ├── validation.ts      // BIP39 seed phrase validation and entropy checking
│   ├── import-flow.ts     // Complete seed phrase import security flow
│   ├── memory-protection.ts // Secure memory management for sensitive data
│   └── derivation.ts      // Secure key derivation within browser extension
├── recovery/
│   ├── shares.ts          // Shamir's secret sharing with zkLogin integration
│   ├── social.ts          // Social recovery flows with cross-chain coordination
│   ├── backup.ts          // Secure backup generation and validation
│   ├── coordinator.ts     // Recovery coordination across Sui and Sapphire
│   └── verification.ts    // Recovery request verification and authorization
├── phishing/
│   ├── detector.ts        // Real-time phishing detection for user flows
│   ├── database.ts        // Known phishing and malicious site database
│   ├── heuristics.ts      // Behavioral analysis and suspicious activity detection
│   ├── url-analysis.ts    // Real-time URL and domain reputation checking
│   └── form-security.ts   // Secure form interaction and validation
├── walrus-security/
│   ├── client.ts          // Enhanced Walrus blob client with security features
│   ├── acl.ts            // Advanced access control layer with device authorization
│   ├── seal.ts           // Seal protocol integration with security monitoring
│   ├── encryption.ts     // Additional encryption layers for sensitive blobs
│   └── audit.ts          // Security audit logging for blob access
├── input-security/
│   ├── secure-forms.ts    // Secure form input handling and validation
│   ├── memory-manager.ts  // Secure memory management for sensitive inputs
│   ├── sanitization.ts    // Input sanitization and security validation
│   └── clipboard-protection.ts // Secure clipboard handling for sensitive data
└── monitoring/
    ├── security-alerts.ts  // Real-time security alert system
    ├── breach-detection.ts // Automated breach detection and response
    ├── audit-logger.ts     // Comprehensive security audit logging
    └── threat-intelligence.ts // Threat intelligence integration

// Enhanced security implementations for user flows

// secure-input.ts - Secure seed phrase input handling
export class SecureSeedPhraseInput {
    private secureMemory: ArrayBuffer;
    private inputValidator: BIP39Validator;
    private memoryProtection: MemoryProtection;

    // Secure seed phrase input with real-time validation
    async handleSeedPhraseInput(inputElement: HTMLInputElement): Promise<SecureSeedPhrase> {
        // Enable secure input mode
        this.enableSecureInputMode(inputElement);

        // Real-time validation as user types
        inputElement.addEventListener('input', (event) => {
            const value = (event.target as HTMLInputElement).value;
            this.validateSeedPhraseRealTime(value);
        });

        // Handle paste events securely
        inputElement.addEventListener('paste', (event) => {
            event.preventDefault();
            this.handleSecurePaste(event, inputElement);
        });

        return new Promise((resolve, reject) => {
            inputElement.addEventListener('submit', async (event) => {
                try {
                    const seedPhrase = await this.extractAndValidateSeedPhrase(inputElement);

                    // Clear input immediately
                    this.securelyWipeInput(inputElement);

                    resolve(seedPhrase);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    // Secure memory management for seed phrases
    private async extractAndValidateSeedPhrase(input: HTMLInputElement): Promise<SecureSeedPhrase> {
        const rawValue = input.value;

        // Validate BIP39 compliance
        if (!this.inputValidator.isValidBIP39(rawValue)) {
            throw new Error('Invalid seed phrase format');
        }

        // Store in secure memory
        const securePhrase = await this.memoryProtection.secureStore(rawValue);

        // Clear original value
        input.value = '';
        input.blur();

        return securePhrase;
    }

    // Secure paste handling
    private async handleSecurePaste(event: ClipboardEvent, input: HTMLInputElement): Promise<void> {
        const clipboardData = event.clipboardData?.getData('text') || '';

        // Validate before setting
        if (this.inputValidator.isValidBIP39(clipboardData)) {
            input.value = clipboardData;
            this.validateSeedPhraseRealTime(clipboardData);

            // Clear clipboard for security
            await navigator.clipboard.writeText('');
        } else {
            this.showSecurityWarning('Invalid seed phrase format detected');
        }
    }

    // Enable secure input protections
    private enableSecureInputMode(input: HTMLInputElement): void {
        // Disable browser autocomplete
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('spellcheck', 'false');

        // Add security attributes
        input.setAttribute('data-secure-input', 'true');

        // Prevent certain developer tools interactions
        input.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // Secure memory wipe
    private securelyWipeInput(input: HTMLInputElement): void {
        // Multiple overwrites for security
        for (let i = 0; i < 3; i++) {
            input.value = ''.padStart(input.value.length, '0');
            input.value = ''.padStart(input.value.length, '1');
        }
        input.value = '';
    }
}

// import-flow.ts - Complete secure seed phrase import flow
export class SecureSeedPhraseImportFlow {
    private secureInput: SecureSeedPhraseInput;
    private walletVault: WalletVaultService;
    private progressTracker: ImportProgressTracker;

    // Execute complete secure import flow
    async executeSecureImport(walletName: string): Promise<ImportResult> {
        const progress = this.progressTracker.start();

        try {
            // Step 1: Secure seed phrase input
            progress.updateStep('Secure Input', 'Waiting for seed phrase...');
            const secureSeedPhrase = await this.secureInput.handleSeedPhraseInput();

            // Step 2: Security validation
            progress.updateStep('Security Validation', 'Validating seed phrase security...');
            await this.validateSeedPhraseSecurity(secureSeedPhrase);

            // Step 3: Key derivation preview
            progress.updateStep('Key Derivation', 'Deriving wallet addresses...');
            const derivedAddresses = await this.previewDerivedAddresses(secureSeedPhrase);

            // Step 4: User confirmation
            progress.updateStep('Confirmation', 'Confirming wallet details...');
            const confirmed = await this.confirmWalletDetails(walletName, derivedAddresses);

            if (!confirmed) {
                throw new Error('Import cancelled by user');
            }

            // Step 5: Secure storage in Sapphire TEE
            progress.updateStep('Secure Storage', 'Storing wallet in secure enclave...');
            const walletId = await this.walletVault.secureImport(secureSeedPhrase, walletName);

            // Step 6: Balance fetching
            progress.updateStep('Balance Fetching', 'Fetching wallet balances...');
            const balances = await this.walletVault.fetchInitialBalances(walletId);

            // Step 7: Success confirmation
            progress.complete({
                walletId,
                walletName,
                balances,
                addresses: derivedAddresses
            });

            return {
                success: true,
                walletId,
                balances,
                message: 'Wallet imported successfully into secure vault'
            };

        } catch (error) {
            progress.fail(error.message);

            // Secure cleanup on failure
            await this.secureCleanup();

            return {
                success: false,
                error: error.message
            };
        }
    }

    // Validate seed phrase security
    private async validateSeedPhraseSecurity(seedPhrase: SecureSeedPhrase): Promise<void> {
        // Check entropy
        if (!this.hasAdequateEntropy(seedPhrase)) {
            throw new Error('Seed phrase has insufficient entropy');
        }

        // Check against common weak phrases
        if (await this.isWeakSeedPhrase(seedPhrase)) {
            throw new Error('Seed phrase appears to be weak or commonly used');
        }

        // Validate checksum
        if (!this.validateBIP39Checksum(seedPhrase)) {
            throw new Error('Seed phrase checksum validation failed');
        }
    }

    // Preview derived addresses for user confirmation
    private async previewDerivedAddresses(seedPhrase: SecureSeedPhrase): Promise<DerivedAddresses> {
        // Derive addresses for supported chains without storing private keys
        const addresses = {
            ethereum: await this.deriveAddress(seedPhrase, ChainType.Ethereum),
            polygon: await this.deriveAddress(seedPhrase, ChainType.Polygon),
            sui: await this.deriveAddress(seedPhrase, ChainType.Sui),
        };

        return addresses;
    }

    // Secure cleanup on failure
    private async secureCleanup(): Promise<void> {
        // Wipe sensitive data from memory
        await this.secureInput.memoryWipe();

        // Clear any temporary storage
        this.progressTracker.secureCleanup();

        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }
}

// memory-protection.ts - Secure memory management
export class MemoryProtection {
    private sensitiveData: Map<string, ArrayBuffer>;
    private cleanupTimers: Map<string, NodeJS.Timeout>;

    // Store sensitive data in secure memory
    async secureStore(data: string, timeoutMs: number = 300000): Promise<string> {
        const id = this.generateSecureId();

        // Convert to ArrayBuffer for better memory control
        const encoder = new TextEncoder();
        const buffer = encoder.encode(data);

        // Store in secure map
        this.sensitiveData.set(id, buffer);

        // Set automatic cleanup
        const timer = setTimeout(() => {
            this.secureDelete(id);
        }, timeoutMs);

        this.cleanupTimers.set(id, timer);

        return id;
    }

    // Retrieve and decrypt sensitive data
    async secureRetrieve(id: string): Promise<string> {
        const buffer = this.sensitiveData.get(id);

        if (!buffer) {
            throw new Error('Sensitive data not found or expired');
        }

        const decoder = new TextDecoder();
        return decoder.decode(buffer);
    }

    // Securely delete sensitive data
    secureDelete(id: string): void {
        const buffer = this.sensitiveData.get(id);

        if (buffer) {
            // Overwrite buffer with random data
            const randomData = new Uint8Array(buffer.byteLength);
            crypto.getRandomValues(randomData);
            new Uint8Array(buffer).set(randomData);

            this.sensitiveData.delete(id);
        }

        const timer = this.cleanupTimers.get(id);
        if (timer) {
            clearTimeout(timer);
            this.cleanupTimers.delete(id);
        }
    }

    // Emergency wipe all sensitive data
    emergencyWipe(): void {
        for (const id of this.sensitiveData.keys()) {
            this.secureDelete(id);
        }
    }
}
```

**Enhanced Security Features for User Flows**:

- **Secure Seed Phrase Import**: BIP39 validation, entropy checking, secure memory management, and multi-layer input protection
- **Enhanced zkLogin Flow**: Seamless OAuth → JWT → Zero-knowledge proof → Blockchain auth with session management
- **Coordinated Recovery Mechanism**: Cross-chain secret sharing with Sui recovery logic coordination and Sapphire verification
- **Real-time Phishing Protection**: URL analysis, domain reputation, behavioral detection for all user interactions
- **Advanced Encrypted Storage**: Multi-layer encryption before Walrus upload with enhanced access control via Seal
- **Proactive Breach Monitoring**: Real-time password database monitoring with instant alerts via The Graph integration
- **Secure Memory Management**: Advanced memory protection for sensitive data with automatic cleanup and emergency wipe capabilities
- **Input Security**: Comprehensive secure input handling for forms, seed phrases, and sensitive data with clipboard protection

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

- [ ] **Secure Seed Phrase Import**: Complete MetaMask import flow working with secure input handling and real-time validation
- [ ] **zkLogin Primary Authentication**: Google/Apple onboarding working seamlessly with cross-chain vault linking
- [ ] **Coordinated Social Recovery**: Cross-chain recovery working with Sui logic coordination and Sapphire verification
- [ ] **Enhanced Security Integration**: Walrus + Seal security with multi-layer encryption and advanced access control operational
- [ ] **Real-time Phishing Protection**: >90% threat detection accuracy with immediate warnings during user flows
- [ ] **Proactive Breach Monitoring**: Cross-chain breach alerts firing within 24 hours via The Graph integration
- [ ] **Memory Security**: Secure memory management for sensitive data with verified wipe capabilities and emergency cleanup
- [ ] **Input Security**: All user inputs (seed phrases, passwords, forms) protected with comprehensive security measures

#### Completion Criteria

1. **Secure User Onboarding**: Seed phrase import flow working end-to-end with all security measures operational
2. **Primary Authentication**: zkLogin flow completely functional with seamless Google/Apple integration and cross-chain coordination
3. **Coordinated Recovery**: Social recovery tested with real shares, cross-chain coordination, and recovery verification
4. **Comprehensive Security**: Phishing protection, input security, and memory management actively protecting all user flows
5. **Enhanced Storage Security**: Walrus + Seal integration with multi-layer encryption and advanced access control fully operational
6. **Proactive Monitoring**: Real-time breach detection and security monitoring operational across all system components
7. **Security Validation**: All security measures tested and verified through comprehensive security audit and penetration testing

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

- [ ] **Extension Deployment**: Browser extension approved and live in Chrome Web Store and Firefox Add-ons
- [ ] **User Flow Validation**: Both seed phrase import and password save flows working perfectly in production environment
- [ ] **Testnet Deployment**: All smart contracts (Sapphire + Sui) deployed and verified on testnets
- [ ] **Security Certification**: Comprehensive security audit passed with no critical issues across all user flows
- [ ] **Performance Validation**: All user flow performance requirements met (<2s for critical operations)
- [ ] **Production Monitoring**: Real-time monitoring operational for all system components and user flows
- [ ] **User Testing**: Beta users successfully completing both major user flows with <5% error rate
- [ ] **Documentation Completeness**: User guides, developer docs, and troubleshooting guides complete and tested

#### Completion Criteria

1. **Production Extension**: Live in browser stores with both user flows working flawlessly
2. **User Flow Validation**: Seed phrase import and password save flows tested and verified in production
3. **Complete Deployment**: All contracts (Sapphire + Sui) deployed, ROFL worker operational, The Graph indexing live
4. **Security Validation**: Comprehensive security audit completed with all user flow security measures verified
5. **Performance Standards**: All user flow performance requirements met and monitored in production
6. **User Experience**: Beta testing completed with verified user success rates and satisfaction
7. **Operational Readiness**: Production monitoring, alerting, and support documentation complete

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
    │              The Graph (Real-Time Data Layer)               │
    │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
    │  │   Graph Node    │  │   Apollo Client  │  │ WebSocket   │ │
    │  │  (localhost:    │  │   (Frontend)     │  │ Subscript.  │ │
    │  │   8000-8040)    │  │                  │  │             │ │
    │  └─────────────────┘  └──────────────────┘  └─────────────┘ │
    └─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
    ┌─────────────────────────────────────────────────────────────┐
    │              Coordinated Blockchain Architecture            │
    │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
    │  │ Oasis Sapphire  │◄─┤   ROFL Worker    │◄─┤ Sui Network │ │
    │  │ (Confidential   │  │ (Critical Data   │  │ (Public     │ │
    │  │ Compute Layer)  │  │ Bridge)          │  │ Coord. Layer│ │
    │  └─────────────────┘  └──────────────────┘  └─────────────┘ │
    └─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
    ┌─────────────────────────────────────────────────────────────┐
    │           Decentralized Storage & Access Control            │
    │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
    │  │ Walrus          │  │ Seal             │  │ zkLogin     │ │
    │  │ (Blob Storage)  │  │ (Access Control) │  │ (Primary    │ │
    │  │                 │  │                  │  │ Auth)       │ │
    │  └─────────────────┘  └──────────────────┘  └─────────────┘ │
    └─────────────────────────────────────────────────────────────┘
```

### Data Flow Patterns

**1. Coordinated Password Storage Flow**:

```
User Input → Client Encryption → Sapphire (Confidential Compute) →
Sui (Public Metadata) → Walrus (Encrypted Storage) → Seal (Access Control) →
Event Emission → The Graph Indexing → GraphQL Update → UI Refresh
```

**2. ROFL-Enabled Event Flow**:

```
Sui Event (Source) → ROFL Worker (Critical Data Bridge) →
Sapphire Synthetic Event → The Graph Indexing →
Real-time Subscription → UI Notification
```

**3. zkLogin-Coordinated Recovery Flow**:

```
zkLogin Auth (Primary Authentication) → Share Generation →
Sui (Recovery Logic) + Walrus (Distributed Storage) → Recovery Request →
Share Reconstruction → Account Restoration Across All Layers
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

**Enhanced End-to-End Test Scenarios for User Flows**:

1. **Complete Seed Phrase Import Flow**:

   - Install extension → Open Wallet Vault → Click "Import Existing Wallet" → Enter MetaMask seed phrase securely → See security validations → Confirm wallet name → Wait for secure TEE processing → View real-time balance fetching → Verify ETH/MATIC balances displayed → Confirm wallet in fortress state

2. **Complete Password Save Flow**:

   - Navigate to Unifi login page → Enter credentials → See Grand Warden icon in fields → Submit login successfully → See "Save password?" banner → Click "Save" → Watch atomic vault update → See checkmark animation → Verify vault updated in UI → Test autofill on return visit

3. **Cross-Chain Atomic Operation Flow**:

   - Trigger password save → Verify Sapphire TEE processing → Confirm Walrus blob upload → Check Sui pointer update → Verify ROFL event mirroring → Confirm The Graph indexing → See real-time UI update → Validate atomic operation completion

4. **Security & Recovery Integration**:

   - Import seed phrase with zkLogin authentication → Generate social recovery shares → Store in coordinated system → Simulate device compromise → Initiate recovery flow → Verify cross-chain recovery coordination → Restore complete access to both Password and Wallet Vaults

5. **Multi-Chain Performance Validation**:

   - Import multi-chain wallet → Verify balance fetching across ETH, MATIC, Sui → Test transaction signing → Verify cross-chain coordination → Validate <2 second response times → Confirm real-time balance updates

6. **Comprehensive Security Testing**:

   - Test phishing detection during password save → Verify secure input handling for seed phrases → Validate memory protection and cleanup → Test breach detection and alerts → Verify all security measures during user flows

### Monitoring & Metrics

**Enhanced Operational Metrics for User Flows**:

- **User Flow Performance**: Seed phrase import completion time, password save operation latency, real-time balance fetch speed
- **Cross-Chain Coordination**: Atomic operation success rates, ROFL event processing speed, Sui↔Sapphire sync latency
- **System Reliability**: Graph Node uptime and query latency, smart contract gas usage and failure rates, extension crash rates during user flows
- **Real-time Features**: Balance update latency, notification delivery time, UI responsiveness during operations

**Enhanced Security Metrics for User Flows**:

- **Input Security**: Secure seed phrase handling effectiveness, memory protection validation, secure form interaction success rates
- **Threat Detection**: Phishing detection accuracy during user flows, breach alert delivery time, false positive rates for user operations
- **Recovery Systems**: Cross-chain recovery success rates, zkLogin authentication reliability, social recovery coordination effectiveness
- **Audit & Compliance**: Security audit findings across user flows, penetration testing results, vulnerability remediation tracking

---

## Project Completeness Framework

### Feature Completeness Checklist

**Enhanced Password Vault with User Flow Support**:

- [ ] **Complete Password Save Flow**: Form detection, credential capture, UI overlay prompts, atomic vault updates
- [ ] **Real-time Autofill Integration**: Automatic password filling with Grand Warden icon injection and security validation
- [ ] **Atomic CRUD Operations**: Create, read, update, delete password entries with coordinated Walrus + Sui state management
- [ ] **Advanced Search & Filter**: Password vault search with real-time results and security categorization
- [ ] **Proactive Security**: Password strength analysis, breach detection, and real-time security alerts
- [ ] **Cross-Device Sync**: Seamless password synchronization across authorized devices with conflict resolution

**Enhanced Web3 Wallet Vault with User Flow Support**:

- [ ] **Complete Seed Phrase Import Flow**: Secure MetaMask import with BIP39 validation, entropy checking, and secure memory management
- [ ] **Real-time Multi-Chain Support**: EVM, Sui, and other chains with automatic balance fetching and real-time updates
- [ ] **Secure Transaction Signing**: TEE-based signing workflows with phishing protection and user confirmation
- [ ] **Advanced Key Management**: BIP39/BIP44 key derivation, secure key storage, and multi-chain address generation
- [ ] **Hardware Wallet Integration**: Support for hardware wallet import and coordination with TEE security
- [ ] **Seamless Wallet Operations**: Import, export, backup, and recovery with cross-chain coordination

**Enhanced Security & Recovery with User Flow Integration**:

- [ ] **Primary zkLogin Authentication**: Seamless Google/Apple OAuth integration with cross-chain vault linking and session management
- [ ] **Coordinated Social Recovery**: Cross-chain secret sharing with Sui recovery logic and Sapphire verification coordination
- [ ] **Comprehensive Security Protection**: Real-time phishing detection, secure input handling, and memory protection during all user flows
- [ ] **Advanced Encryption Management**: Multi-layer encryption for vault data with secure key derivation and management
- [ ] **Intelligent Device Management**: Secure device registration, authorization, and cross-device synchronization with conflict resolution
- [ ] **Proactive Threat Response**: Automated breach detection, real-time security alerts, and coordinated threat mitigation

**Enhanced Cross-Chain Infrastructure for User Flow Support**:

- [ ] **Advanced Sapphire Contracts**: TEE-based private operations with BIP39/BIP44 key derivation, multi-chain RPC integration, and atomic vault management
- [ ] **Coordinated Sui Contracts**: Public state management, device registry, vault metadata pointers, and recovery logic coordination
- [ ] **Unified Data Layer**: The Graph real-time indexing with multi-chain event aggregation and user flow tracking
- [ ] **Robust ROFL Bridge**: Critical data bridge with atomic operation coordination, failure recovery, and user flow validation
- [ ] **Real-time Subscriptions**: GraphQL subscriptions for instant UI updates during user flows with <2s latency
- [ ] **Secure Storage Integration**: Walrus + Seal decentralized storage with advanced access control and multi-layer encryption
- [ ] **Atomic Coordination**: Cross-chain state synchronization with atomic operations and failure recovery mechanisms

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

The infrastructure foundation is strong, and the frontend components are well-developed. This enhanced build plan now includes comprehensive specifications for the exact user flows described - from seamless MetaMask seed phrase import with real-time balance display to effortless website password saving with atomic cross-chain coordination.

With disciplined execution of this user-flow-optimized plan, Grand Warden will deliver the described user experience: users will see their wallets imported into a "fortress" with immediate balance updates, and password saves will complete with checkmark animations in under 2 seconds, all while maintaining the highest security standards through coordinated TEE operations, atomic cross-chain state management, and comprehensive threat protection.

The plan ensures that every user interaction - from secure input handling to real-time notifications - is backed by robust technical implementations that abstract the complexity of cross-chain coordination while delivering a seamless, consumer-grade experience.

---

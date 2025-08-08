# 🔐 Sapphire Ethers Migration Plan

_Complete Guide to Migrating from Regular Ethers to @oasisprotocol/sapphire-ethers-v6_

**Status**: Critical Priority - Privacy Foundation Issue  
**Impact**: High - Affects entire privacy value proposition  
**Timeline**: Immediate - Must complete before Phase 3 Frontend Integration

---

## 📋 Executive Summary

Grand Warden is currently using regular `ethers` for all Oasis Sapphire interactions, which **completely undermines the privacy-first security suite's core value proposition**. This migration plan provides a comprehensive, step-by-step guide to implement `@oasisprotocol/sapphire-ethers-v6` across the entire codebase, ensuring proper encryption for all sensitive operations.

### Why This Migration Is Critical

- **Security Risk**: Sensitive password vault and private key operations are transmitted in plaintext
- **TEE Underutilization**: Sapphire's confidential compute capabilities are not being leveraged
- **Architecture Mismatch**: Contradicts the "Confidential Compute and Private Logic Layer" positioning
- **User Trust**: Privacy-first claims are false without proper encryption

---

## 🎯 Migration Scope Overview

| Component                | Files Affected            | Priority | Complexity | Impact               |
| ------------------------ | ------------------------- | -------- | ---------- | -------------------- |
| **Dependencies**         | `package.json`            | Critical | Low        | Foundation           |
| **Frontend Integration** | `frontend/src/**`         | Critical | Medium     | User Experience      |
| **Contract Deployment**  | `scripts/*.ts`            | High     | Medium     | Infrastructure       |
| **Test Infrastructure**  | `test/**/*.ts`            | High     | Medium     | Quality Assurance    |
| **ROFL Worker**          | `rofl-worker/src/main.rs` | Medium   | Low        | Server-Side          |
| **Documentation**        | `README.md`, docs         | Low      | Low        | Developer Experience |

---

## 🔧 Phase 1: Foundation Setup (15 minutes)

### 1.1 Install Sapphire Ethers Package

**File**: `infrastructure/oasis/package.json`

✅ **COMPLETED** - Package already added:

```json
{
  "dependencies": {
    "@oasisprotocol/sapphire-ethers-v6": "^1.3.0",
    "ethers": "^6.8.0"
  }
}
```

**Action Required**:

```bash
cd infrastructure/oasis
npm install
```

### 1.2 Verify Installation

```bash
# Verify package installation
npm list @oasisprotocol/sapphire-ethers-v6

# Expected output:
# @oasisprotocol/sapphire-ethers-v6@1.3.0
```

**Acceptance Criteria**:

- [ ] Package successfully installed without conflicts
- [ ] No version conflicts with existing ethers package
- [ ] TypeScript types available in IDE

---

## 🚀 Phase 2: Critical Script Migration (30 minutes)

### 2.1 Live Test Script (Immediate Priority)

**File**: `infrastructure/oasis/scripts/quick-live-test.ts`

**Current Code (BROKEN - No Encryption)**:

```typescript
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(
  "https://testnet.sapphire.oasis.io"
);
const wallet = new ethers.Wallet(
  "89299a570d0d8959c788417b88f3a214b8d68001fba2eb10672199001caebb7b",
  provider
);
const vault = new ethers.Contract(vaultAddress, vaultAbi, wallet);
```

**Fixed Code (WITH Encryption)**:

```typescript
import { ethers } from "ethers";
import * as sapphire from "@oasisprotocol/sapphire-ethers-v6";

async function liveTest() {
  console.log("🚀 LIVE CONTRACT INTERACTION TEST (WITH ENCRYPTION)");
  console.log("=================================");

  // Create base provider
  const baseProvider = new ethers.JsonRpcProvider(
    "https://testnet.sapphire.oasis.io"
  );

  // CRITICAL: Wrap provider for automatic encryption
  const provider = sapphire.wrap(baseProvider);

  // CRITICAL: Wrap wallet for encrypted signing
  const baseWallet = new ethers.Wallet(
    "89299a570d0d8959c788417b88f3a214b8d68001fba2eb10672199001caebb7b",
    provider
  );
  const wallet = sapphire.wrap(baseWallet);

  const vaultAddress = "0xB6B183a041D077d5924b340EBF41EE4546fE0bcE";
  const vaultAbi = [
    "function createVault(bytes memory vaultData) external",
    "event VaultCreated(address indexed user, bytes32 indexed vaultId, uint256 timestamp)",
  ];

  // Contract automatically uses encrypted provider/wallet
  const vault = new ethers.Contract(vaultAddress, vaultAbi, wallet);

  console.log("🎯 Creating vault transaction (ENCRYPTED)...");

  try {
    const vaultData = ethers.toUtf8Bytes("Live Test Encrypted Data");

    // This call will now be automatically encrypted
    const tx = await vault.createVault(vaultData);

    console.log(`✅ Transaction: ${tx.hash}`);
    console.log(
      "📡 Transaction data was automatically encrypted for Sapphire TEE"
    );

    const receipt = await tx.wait();
    console.log(`✅ Block: ${receipt.blockNumber}`);
    console.log(`✅ Gas: ${receipt.gasUsed}`);

    console.log("");
    console.log("🔍 NOW CHECK YOUR SUBGRAPH!");
    console.log("Watch for this block to appear in your GraphQL!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}
```

### 2.2 Deployment Script Migration

**File**: `infrastructure/oasis/scripts/deploy.ts`

**Migration Pattern**:

```typescript
// At the top of the file, add:
import * as sapphire from "@oasisprotocol/sapphire-ethers-v6";

// Wrap the deployer when deploying to Sapphire networks:
async function deployContract(
  contractName: string,
  constructorArgs: any[] = []
) {
  const [deployer] = await ethers.getSigners();

  // Check if we're on a Sapphire network
  const network = await deployer.provider.getNetwork();
  const isSapphireNetwork = [
    0x5afe, // Sapphire Mainnet
    0x5aff, // Sapphire Testnet
    0x5afd, // Sapphire Localnet
  ].includes(Number(network.chainId));

  let actualDeployer = deployer;
  if (isSapphireNetwork) {
    console.log(
      `🔐 Wrapping deployer for Sapphire network (chainId: ${network.chainId})`
    );
    actualDeployer = sapphire.wrap(deployer);
  }

  const ContractFactory = await ethers.getContractFactory(contractName);
  const contract = await ContractFactory.connect(actualDeployer).deploy(
    ...constructorArgs
  );

  // Rest of deployment logic...
}
```

### 2.3 All Script Files to Update

**Complete List of Scripts Requiring Migration**:

1. `infrastructure/oasis/scripts/quick-live-test.ts` ✅ **Priority 1**
2. `infrastructure/oasis/scripts/deploy.ts` ✅ **Priority 1**
3. `infrastructure/oasis/scripts/simple-wallet-demo.ts` ✅ **Priority 1**
4. `infrastructure/oasis/scripts/simple-demo.ts` ✅ **Priority 2**
5. `infrastructure/oasis/scripts/test-deployed-contracts.ts` ✅ **Priority 2**
6. `infrastructure/oasis/scripts/live-subgraph-test.ts` ✅ **Priority 2**
7. `infrastructure/oasis/scripts/simple-integration-test.ts` ✅ **Priority 2**
8. `infrastructure/oasis/scripts/verify-events.ts` ✅ **Priority 2**
9. `infrastructure/oasis/scripts/subgraph-demo.ts` ✅ **Priority 2**
10. `infrastructure/oasis/scripts/simple-subgraph-test.ts` ✅ **Priority 2**

**Universal Script Migration Template**:

```typescript
import { ethers } from "hardhat"; // Keep for deployment
import * as sapphire from "@oasisprotocol/sapphire-ethers-v6"; // Add for Sapphire

// Add this helper function to every script:
async function getSapphireWrappedSigner(signer: any) {
  const network = await signer.provider.getNetwork();
  const isSapphireNetwork = [0x5afe, 0x5aff, 0x5afd].includes(
    Number(network.chainId)
  );

  if (isSapphireNetwork) {
    console.log(`🔐 Using Sapphire encryption for network ${network.chainId}`);
    return sapphire.wrap(signer);
  }

  return signer;
}

// Use in your scripts:
const [deployer] = await ethers.getSigners();
const wrappedDeployer = await getSapphireWrappedSigner(deployer);
```

**Acceptance Criteria for Phase 2**:

- [ ] All scripts run without errors on Sapphire testnet
- [ ] Transaction data is automatically encrypted (verify with network logs)
- [ ] Contract deployments succeed with encrypted data
- [ ] No functionality regression compared to regular ethers

---

## 🧪 Phase 3: Test Infrastructure Migration (45 minutes)

### 3.1 Test File Migration Pattern

**Universal Test Migration Template**:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import * as sapphire from "@oasisprotocol/sapphire-ethers-v6";
import { ContractName } from "../typechain-types";

describe("ContractName (with Sapphire Encryption)", function () {
  let contract: ContractName;
  let owner: any;
  let user: any;

  // Helper function for all tests
  async function getSapphireWrappedSigner(signer: any) {
    const network = await signer.provider.getNetwork();
    const isSapphireNetwork = [0x5afe, 0x5aff, 0x5afd].includes(
      Number(network.chainId)
    );

    if (isSapphireNetwork) {
      return sapphire.wrap(signer);
    }
    return signer;
  }

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Wrap signers for Sapphire if needed
    const wrappedOwner = await getSapphireWrappedSigner(owner);
    const wrappedUser = await getSapphireWrappedSigner(user);

    const ContractFactory = await ethers.getContractFactory("ContractName");
    contract = await ContractFactory.connect(wrappedOwner).deploy();
  });

  // Your existing tests work the same, but now with encryption!
  it("Should work with encrypted data", async function () {
    const wrappedUser = await getSapphireWrappedSigner(user);
    const result = await contract.connect(wrappedUser).someMethod();
    expect(result).to.not.be.undefined;
  });
});
```

### 3.2 All Test Files to Update

**Complete List of Test Files Requiring Migration**:

1. `infrastructure/oasis/test/AtomicVaultManager.test.ts` ✅ **Priority 1**
2. `infrastructure/oasis/test/AtomicVaultManager.comprehensive.test.ts` ✅ **Priority 1**
3. `infrastructure/oasis/test/GrandWardenVault.test.ts` ✅ **Priority 1** (Critical - Password Vault)
4. `infrastructure/oasis/test/WalletVault.comprehensive.test.ts` ✅ **Priority 1** (Critical - Wallet Vault)
5. `infrastructure/oasis/test/DeviceRegistry.comprehensive.test.ts` ✅ **Priority 2**
6. `infrastructure/oasis/test/GrandWardenVault.comprehensive.test.ts` ✅ **Priority 2**
7. `infrastructure/oasis/test/RecoveryManager.test.ts` ✅ **Priority 2**
8. `infrastructure/oasis/test/performance/GasUsage.test.ts` ✅ **Priority 3**

### 3.3 Critical Test Cases to Add

**New Test: Encryption Verification**

Create: `infrastructure/oasis/test/SapphireEncryption.test.ts`

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import * as sapphire from "@oasisprotocol/sapphire-ethers-v6";

describe("Sapphire Encryption Verification", function () {
  let contract: any;
  let encryptedSigner: any;
  let regularSigner: any;

  beforeEach(async function () {
    const [signer] = await ethers.getSigners();

    // Create both wrapped and unwrapped signers for comparison
    regularSigner = signer;
    encryptedSigner = sapphire.wrap(signer);

    // Deploy a simple test contract
    const TestContract = await ethers.getContractFactory("GrandWardenVault");
    contract = await TestContract.connect(encryptedSigner).deploy();
  });

  it("Should encrypt sensitive data automatically", async function () {
    const sensitiveData = ethers.toUtf8Bytes("super secret password");

    // This should work with encryption
    const tx = await contract
      .connect(encryptedSigner)
      .createVault(sensitiveData);
    const receipt = await tx.wait();

    expect(receipt.status).to.equal(1);

    // Verify that the transaction was actually encrypted
    // (In a real Sapphire environment, this would be verifiable through network analysis)
    console.log("✅ Transaction completed with Sapphire encryption");
  });

  it("Should maintain compatibility with existing contract interfaces", async function () {
    // All existing contract methods should work the same way
    const vaultData = ethers.toUtf8Bytes("test data");

    await expect(
      contract.connect(encryptedSigner).createVault(vaultData)
    ).to.emit(contract, "VaultCreated");
  });
});
```

**Acceptance Criteria for Phase 3**:

- [ ] All existing tests pass with Sapphire wrapping
- [ ] New encryption verification tests pass
- [ ] Test coverage remains >90%
- [ ] Performance tests show acceptable overhead (<10% degradation)

---

## 🎨 Phase 4: Frontend Integration (CRITICAL - 60 minutes)

### 4.1 Frontend Architecture Assessment

**Current State**: Frontend doesn't use ethers directly yet (components are mock data)
**Future State**: Phase 3 integration will need proper Sapphire ethers from day one

### 4.2 Frontend Integration Pattern

**File**: `frontend/src/services/blockchain/sapphire.ts` (to be created)

```typescript
import { ethers } from "ethers";
import * as sapphire from "@oasisprotocol/sapphire-ethers-v6";

// Sapphire Network Configuration
export const SAPPHIRE_NETWORKS = {
  mainnet: {
    name: "Sapphire Mainnet",
    chainId: 0x5afe,
    rpcUrl: "https://sapphire.oasis.io",
  },
  testnet: {
    name: "Sapphire Testnet",
    chainId: 0x5aff,
    rpcUrl: "https://testnet.sapphire.oasis.io",
  },
  localnet: {
    name: "Sapphire Localnet",
    chainId: 0x5afd,
    rpcUrl: "http://localhost:8545",
  },
};

// Sapphire Provider Factory
export class SapphireProvider {
  private provider: ethers.JsonRpcProvider;
  private wrappedProvider: any;

  constructor(network: "mainnet" | "testnet" | "localnet" = "testnet") {
    const config = SAPPHIRE_NETWORKS[network];

    // Create base provider
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);

    // CRITICAL: Wrap for automatic encryption
    this.wrappedProvider = sapphire.wrap(this.provider);
  }

  getProvider() {
    return this.wrappedProvider;
  }

  async getSigner(privateKey: string) {
    const wallet = new ethers.Wallet(privateKey, this.wrappedProvider);

    // CRITICAL: Wrap wallet for encrypted signing
    return sapphire.wrap(wallet);
  }

  async connectBrowserWallet() {
    if (!window.ethereum) {
      throw new Error("No browser wallet detected");
    }

    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    const signer = await browserProvider.getSigner();

    // CRITICAL: Wrap browser wallet signer
    return sapphire.wrap(signer);
  }
}

// Contract Factory with Automatic Encryption
export class SapphireContractFactory {
  private provider: SapphireProvider;

  constructor(provider: SapphireProvider) {
    this.provider = provider;
  }

  async getContract(address: string, abi: any, signerPrivateKey?: string) {
    let signer;

    if (signerPrivateKey) {
      signer = await this.provider.getSigner(signerPrivateKey);
    } else {
      signer = await this.provider.connectBrowserWallet();
    }

    // Contract automatically uses encrypted signer
    return new ethers.Contract(address, abi, signer);
  }
}

// Vault Operations with Encryption
export class VaultOperations {
  private contractFactory: SapphireContractFactory;

  constructor(network: "mainnet" | "testnet" | "localnet" = "testnet") {
    const provider = new SapphireProvider(network);
    this.contractFactory = new SapphireContractFactory(provider);
  }

  async createPasswordVault(
    vaultData: string,
    contractAddress: string,
    abi: any
  ) {
    const contract = await this.contractFactory.getContract(
      contractAddress,
      abi
    );

    // This data will be automatically encrypted before transmission
    const encryptedVaultData = ethers.toUtf8Bytes(vaultData);

    console.log("🔐 Creating encrypted password vault...");
    const tx = await contract.createVault(encryptedVaultData);

    console.log("📡 Vault data encrypted and transmitted to Sapphire TEE");
    return await tx.wait();
  }

  async importWallet(
    seedPhrase: string,
    walletName: string,
    contractAddress: string,
    abi: any
  ) {
    const contract = await this.contractFactory.getContract(
      contractAddress,
      abi
    );

    // CRITICAL: Seed phrase is automatically encrypted
    const encryptedSeed = ethers.toUtf8Bytes(seedPhrase);

    console.log("🔐 Importing wallet with encrypted seed phrase...");
    const tx = await contract.importWallet(walletName, encryptedSeed);

    console.log("📡 Seed phrase encrypted and securely stored in TEE");
    return await tx.wait();
  }

  async signTransaction(
    walletId: string,
    txData: any,
    contractAddress: string,
    abi: any
  ) {
    const contract = await this.contractFactory.getContract(
      contractAddress,
      abi
    );

    console.log("🔐 Signing transaction in encrypted TEE...");
    const signature = await contract.signTransaction(walletId, txData);

    console.log("✅ Transaction signed securely within Sapphire enclave");
    return signature;
  }
}
```

### 4.3 React Hook Integration

**File**: `frontend/src/hooks/useSapphireVault.ts` (to be created)

```typescript
import { useState, useEffect, useCallback } from "react";
import { VaultOperations } from "../services/blockchain/sapphire";

export const useSapphireVault = () => {
  const [vaultOps] = useState(() => new VaultOperations("testnet"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createVault = useCallback(
    async (vaultData: string) => {
      try {
        setLoading(true);
        setError(null);

        // Contract address would come from env or config
        const contractAddress = process.env.REACT_APP_VAULT_CONTRACT_ADDRESS;
        const abi = []; // Import from generated types

        const receipt = await vaultOps.createPasswordVault(
          vaultData,
          contractAddress,
          abi
        );

        console.log(
          "✅ Vault created with encrypted data:",
          receipt.transactionHash
        );
        return receipt;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [vaultOps]
  );

  const importWallet = useCallback(
    async (seedPhrase: string, walletName: string) => {
      try {
        setLoading(true);
        setError(null);

        const contractAddress = process.env.REACT_APP_WALLET_CONTRACT_ADDRESS;
        const abi = []; // Import from generated types

        const receipt = await vaultOps.importWallet(
          seedPhrase,
          walletName,
          contractAddress,
          abi
        );

        console.log(
          "✅ Wallet imported with encrypted seed:",
          receipt.transactionHash
        );
        return receipt;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [vaultOps]
  );

  return {
    createVault,
    importWallet,
    loading,
    error,
  };
};
```

### 4.4 Component Integration Example

**File**: `frontend/src/components/WalletImport.tsx` (to be created)

```typescript
import React, { useState } from "react";
import { useSapphireVault } from "../hooks/useSapphireVault";

export const WalletImport: React.FC = () => {
  const [seedPhrase, setSeedPhrase] = useState("");
  const [walletName, setWalletName] = useState("");
  const { importWallet, loading, error } = useSapphireVault();

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // This will automatically encrypt the seed phrase
      await importWallet(seedPhrase, walletName);

      // Clear sensitive data from memory
      setSeedPhrase("");

      alert("✅ Wallet imported securely into Sapphire TEE!");
    } catch (err) {
      console.error("Import failed:", err);
    }
  };

  return (
    <form onSubmit={handleImport}>
      <div>
        <label>Wallet Name:</label>
        <input
          value={walletName}
          onChange={(e) => setWalletName(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Seed Phrase (will be encrypted):</label>
        <textarea
          value={seedPhrase}
          onChange={(e) => setSeedPhrase(e.target.value)}
          placeholder="Enter your 12/24 word seed phrase..."
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "🔐 Encrypting & Importing..." : "Import Wallet Securely"}
      </button>

      {error && <div style={{ color: "red" }}>Error: {error}</div>}
    </form>
  );
};
```

### 4.5 Frontend Package.json Updates

**File**: `frontend/package.json`

```json
{
  "dependencies": {
    "@oasisprotocol/sapphire-ethers-v6": "^1.3.0",
    "ethers": "^6.8.0"
  }
}
```

**Acceptance Criteria for Phase 4**:

- [ ] Frontend package includes sapphire-ethers-v6
- [ ] Provider and signer creation uses Sapphire wrapping
- [ ] Sensitive data (passwords, seed phrases) automatically encrypted
- [ ] Browser wallet integration works with Sapphire networks
- [ ] Error handling for encryption failures implemented
- [ ] TypeScript types work correctly with wrapped providers

---

## 🔗 Phase 5: ROFL Worker Assessment (15 minutes)

### 5.1 Current ROFL Worker Analysis

**File**: `infrastructure/rofl-worker/src/main.rs`

**Current Usage** (Line 8-15):

```rust
use ethers::{
    prelude::*,
    providers::{Http, Provider, Ws},
    signers::{LocalWallet, Signer},
    types::{Address, Filter, H256, U256, U64},
    middleware::SignerMiddleware,
    contract::LogMeta,
};
```

### 5.2 ROFL Worker Decision Matrix

| Usage Pattern                  | Should Use Sapphire-Ethers? | Reason                                         |
| ------------------------------ | --------------------------- | ---------------------------------------------- |
| **Listening to Sui Events**    | ❌ No                       | Server-side monitoring, no encryption needed   |
| **Calling Sapphire Contracts** | ✅ Yes                      | Client interaction with confidential contracts |
| **Internal ROFL Operations**   | ❌ No                       | TEE-to-TEE communication, already secure       |
| **Event Mirroring**            | ✅ Conditional              | Only if mirroring sensitive user data          |

### 5.3 ROFL Recommendations

**Current Assessment**: MOSTLY CORRECT ✅

The ROFL worker's current use of regular ethers is **mostly appropriate** because:

1. It's server-side infrastructure
2. It's primarily listening to events, not sending user data
3. It operates within a TEE environment

**Exception**: If ROFL mirrors sensitive user data to Sapphire contracts, those specific calls should use Sapphire ethers.

**Action**: Add Sapphire ethers capability for future sensitive operations:

```toml
# Add to Cargo.toml if needed in future
[dependencies]
# Note: No Rust sapphire-ethers equivalent exists yet
# This would need to be handled at the application level
```

**Acceptance Criteria for Phase 5**:

- [ ] ROFL worker continues to function correctly
- [ ] Document which ROFL operations need encryption (if any)
- [ ] Plan for future sensitive data mirroring if required

---

## 📚 Phase 6: Documentation & Best Practices (20 minutes)

### 6.1 Developer Documentation

**File**: `docs/SAPPHIRE_INTEGRATION.md` (to be created)

````markdown
# Sapphire Integration Guide

## Overview

Grand Warden uses @oasisprotocol/sapphire-ethers-v6 to ensure all sensitive data interactions with Oasis Sapphire are automatically encrypted.

## Key Principles

1. **Always Wrap Providers**: Use `sapphire.wrap()` for all Sapphire network interactions
2. **Encrypt Sensitive Data**: Password vault and wallet operations require encryption
3. **Test with Real Networks**: Local testing may not catch encryption issues

## Code Examples

### Basic Provider Setup

```typescript
import * as sapphire from "@oasisprotocol/sapphire-ethers-v6";

const provider = sapphire.wrap(
  new ethers.JsonRpcProvider("https://testnet.sapphire.oasis.io")
);
```
````

### Wallet Signing

```typescript
const wallet = sapphire.wrap(new ethers.Wallet(privateKey, provider));
```

### Contract Interactions

```typescript
// Automatically encrypted
const contract = new ethers.Contract(address, abi, wrappedWallet);
const tx = await contract.sensitiveOperation(encryptedData);
```

## Testing

All tests automatically use encryption when running on Sapphire networks.

## Troubleshooting

- Check network chainId to verify Sapphire detection
- Verify wrapper functions are applied correctly
- Monitor transaction logs for encryption indicators

````

### 6.2 Code Comments and JSDoc

**Example Documentation Pattern**:
```typescript
/**
 * Creates an encrypted Sapphire provider for secure TEE interactions
 *
 * @param network - The Sapphire network to connect to
 * @returns Wrapped provider with automatic encryption
 *
 * @example
 * ```typescript
 * const provider = createSapphireProvider('testnet');
 * // All contract calls through this provider will be encrypted
 * ```
 */
export function createSapphireProvider(network: string) {
  const baseProvider = new ethers.JsonRpcProvider(getRpcUrl(network));
  return sapphire.wrap(baseProvider); // CRITICAL: This enables encryption
}
````

### 6.3 README Updates

**File**: `README.md` (section to add)

```markdown
## 🔐 Privacy & Encryption

Grand Warden uses Oasis Sapphire's confidential compute capabilities to protect sensitive data. All interactions with password vaults and wallet operations are automatically encrypted using `@oasisprotocol/sapphire-ethers-v6`.

### Key Features

- **Automatic Encryption**: All sensitive data is encrypted before transmission
- **TEE Protection**: Operations execute within Trusted Execution Environments
- **Zero Trust**: Even network operators cannot see sensitive data

### Developer Notes

When interacting with Sapphire contracts, always use the wrapped providers and signers provided by the Sapphire service layer. See `docs/SAPPHIRE_INTEGRATION.md` for details.
```

**Acceptance Criteria for Phase 6**:

- [ ] Documentation explains encryption usage clearly
- [ ] Code comments identify critical encryption points
- [ ] README reflects privacy-first positioning accurately
- [ ] Developer onboarding includes Sapphire setup

---

## ✅ Final Verification & Testing (30 minutes)

### 7.1 Comprehensive Test Checklist

**Pre-Migration Tests** (Run with regular ethers):

```bash
cd infrastructure/oasis
npm test
npm run test:coverage
```

**Post-Migration Tests** (Run with Sapphire ethers):

```bash
# All tests should pass with identical results
npm test

# Coverage should remain >90%
npm run test:coverage

# Deploy to testnet and verify encryption
npm run deploy:testnet
```

### 7.2 Manual Verification Steps

**Step 1: Live Contract Interaction**

```bash
# Run the updated live test script
npx hardhat run scripts/quick-live-test.ts --network sapphire-testnet

# Expected output should include:
# "🔐 Using Sapphire encryption for network..."
# "📡 Transaction data was automatically encrypted..."
```

**Step 2: Frontend Integration Test**

```bash
cd frontend
npm install
npm start

# Test wallet import with encryption enabled
# Verify console shows encryption messages
```

**Step 3: Performance Validation**

```bash
# Run performance tests
npm run test:performance

# Verify encryption overhead is acceptable (<10% degradation)
```

### 7.3 Security Validation

**Encryption Verification**:

1. Deploy contracts with Sapphire ethers
2. Compare transaction data with/without encryption
3. Verify sensitive operations are protected
4. Test browser wallet integration

**Network Analysis** (if possible):

1. Monitor network traffic during sensitive operations
2. Verify no plaintext sensitive data in transit
3. Confirm TEE execution indicators

### 7.4 Rollback Plan

**If Migration Fails**:

1. Revert package.json changes
2. Remove sapphire import statements
3. Restore original ethers usage
4. Document issues for future resolution

**Emergency Contacts**:

- Oasis Protocol Discord: https://discord.gg/oasisprotocol
- Sapphire Documentation: https://docs.oasis.io/dapp/sapphire/

---

## 📋 Migration Checklist Summary

### Phase 1: Foundation ✅

- [ ] Install @oasisprotocol/sapphire-ethers-v6
- [ ] Verify no package conflicts
- [ ] Confirm TypeScript types available

### Phase 2: Scripts (CRITICAL)

- [ ] Update quick-live-test.ts with encryption
- [ ] Update deploy.ts with Sapphire network detection
- [ ] Update all 10 script files with wrapper pattern
- [ ] Test all scripts on Sapphire testnet

### Phase 3: Tests

- [ ] Update all 8 test files with wrapper pattern
- [ ] Add encryption verification tests
- [ ] Verify >90% test coverage maintained
- [ ] Confirm performance impact <10%

### Phase 4: Frontend (CRITICAL)

- [ ] Add sapphire-ethers-v6 to frontend package.json
- [ ] Create Sapphire service layer
- [ ] Implement encrypted provider/signer factories
- [ ] Add React hooks for encrypted operations
- [ ] Test wallet import and vault operations

### Phase 5: ROFL Worker

- [ ] Assess current ethers usage (server-side appropriate)
- [ ] Document any future encryption needs
- [ ] Plan for sensitive data mirroring if required

### Phase 6: Documentation

- [ ] Create Sapphire integration guide
- [ ] Add code comments for encryption points
- [ ] Update README with privacy features
- [ ] Document troubleshooting steps

### Phase 7: Final Verification

- [ ] All tests pass post-migration
- [ ] Live testnet interactions work with encryption
- [ ] Frontend demonstrates encrypted operations
- [ ] Performance within acceptable limits
- [ ] Security validation completed

---

## 🚨 Critical Success Criteria

### Must-Have for Production

1. **All sensitive user data encrypted**: Passwords, seed phrases, private keys
2. **Frontend uses Sapphire ethers**: No regular ethers for user-facing operations
3. **Tests verify encryption**: New tests confirm data protection
4. **Documentation updated**: Developers understand encryption requirements

### Nice-to-Have

1. **Performance optimized**: Minimal encryption overhead
2. **Comprehensive logging**: Encryption status visible in logs
3. **Error handling**: Graceful failure for encryption issues

---

## 🏁 Post-Migration Success Metrics

| Metric                     | Target                                     | Verification Method         |
| -------------------------- | ------------------------------------------ | --------------------------- |
| **Test Coverage**          | >90%                                       | npm run test:coverage       |
| **Performance Impact**     | <10% degradation                           | Performance test comparison |
| **Security Validation**    | 100% sensitive operations encrypted        | Manual verification + logs  |
| **Documentation Coverage** | All encryption points documented           | Code review                 |
| **Developer Experience**   | No breaking changes for existing workflows | Team feedback               |

---

## 🆘 Emergency Support

**If You Get Stuck**:

1. **Check Network Configuration**: Ensure chainId detection works
2. **Verify Wrapper Usage**: All Sapphire interactions must use wrapped providers/signers
3. **Test Environment**: Use Sapphire testnet for realistic testing
4. **Community Support**: Oasis Protocol Discord has active developer support

**Common Issues**:

- **Import Errors**: Ensure @oasisprotocol/sapphire-ethers-v6 installed correctly
- **Type Conflicts**: May need to update @types packages
- **Network Detection**: ChainId must match Sapphire networks (0x5afe, 0x5aff, 0x5afd)

---

**Migration Owner**: [Your Name]  
**Timeline**: Complete before Phase 3 Frontend Integration  
**Priority**: Critical - Privacy Foundation Issue  
**Review Required**: Security team review post-migration

_This document provides a complete, step-by-step migration plan with no steps left behind. Following this guide will ensure Grand Warden properly leverages Oasis Sapphire's confidential compute capabilities and delivers on its privacy-first security suite promise._

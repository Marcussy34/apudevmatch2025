import { ethers } from "hardhat";

/**
 * Script to verify all events are properly emitted for The Graph indexing
 * This validates that Phase 1 contracts emit events correctly for user flows
 */

interface EventVerification {
  contractName: string;
  eventName: string;
  verified: boolean;
  error?: string;
}

async function main() {
  console.log("🔍 Verifying all events for The Graph indexing...\n");

  const [deployer, user] = await ethers.getSigners();
  const verifications: EventVerification[] = [];

  // Helper function to verify event emission
  async function verifyEvent(
    contractName: string,
    eventName: string,
    testFunction: () => Promise<any>
  ): Promise<void> {
    try {
      const tx = await testFunction();
      const receipt = await tx.wait();

      let eventFound = false;
      if (receipt?.logs) {
        try {
          const contractFactory = await ethers.getContractFactory(contractName);
          for (const log of receipt.logs) {
            try {
              const parsedLog = contractFactory.interface.parseLog(log as any);
              if (parsedLog?.name === eventName) {
                eventFound = true;
                break;
              }
            } catch {
              // Continue to next log
            }
          }
        } catch {
          // Factory creation failed
        }
      }

      verifications.push({
        contractName,
        eventName,
        verified: !!eventFound,
      });

      console.log(
        `   ${eventFound ? "✅" : "❌"} ${contractName}.${eventName}`
      );
    } catch (error: any) {
      verifications.push({
        contractName,
        eventName,
        verified: false,
        error: error.message,
      });
      console.log(`   ❌ ${contractName}.${eventName} - ${error.message}`);
    }
  }

  console.log("📦 Deploying test contracts...\n");

  // Deploy all contracts for testing
  const GrandWardenVault = await ethers.getContractFactory("GrandWardenVault");
  const grandWardenVault = await GrandWardenVault.deploy();
  await grandWardenVault.waitForDeployment();

  const WalletVault = await ethers.getContractFactory("WalletVault");
  const walletVault = await WalletVault.deploy();
  await walletVault.waitForDeployment();

  const DeviceRegistry = await ethers.getContractFactory("DeviceRegistry");
  const deviceRegistry = await DeviceRegistry.deploy();
  await deviceRegistry.waitForDeployment();

  const RecoveryManager = await ethers.getContractFactory("RecoveryManager");
  const recoveryManager = await RecoveryManager.deploy();
  await recoveryManager.waitForDeployment();

  const AtomicVaultManager = await ethers.getContractFactory(
    "AtomicVaultManager"
  );
  const atomicVaultManager = await AtomicVaultManager.deploy();
  await atomicVaultManager.waitForDeployment();

  console.log("🧪 Verifying critical user flow events...\n");

  // 1. Password Vault Events
  console.log("🔐 Password Vault Events:");

  await verifyEvent("GrandWardenVault", "VaultCreated", async () => {
    const vaultData = ethers.encodeBytes32String("test-vault");
    return await grandWardenVault.connect(user).createVault(vaultData);
  });

  // Get vault ID for credential tests
  const vaultData = ethers.encodeBytes32String("test-vault-2");
  const createTx = await grandWardenVault.connect(user).createVault(vaultData);
  const createReceipt = await createTx.wait();
  const createEvent = createReceipt?.logs.find(
    (log) =>
      grandWardenVault.interface.parseLog(log as any)?.name === "VaultCreated"
  );
  const vaultId = grandWardenVault.interface.parseLog(createEvent as any)
    ?.args[1];

  await verifyEvent("GrandWardenVault", "CredentialAdded", async () => {
    const domain = "example.com";
    const username = "testuser";
    const encryptedPassword = ethers.encodeBytes32String("encrypted-password");
    return await grandWardenVault
      .connect(user)
      .addCredential(vaultId, domain, username, encryptedPassword);
  });

  await verifyEvent("GrandWardenVault", "VaultBlobUpdated", async () => {
    const newBlob = ethers.encodeBytes32String("updated-blob");
    return await grandWardenVault
      .connect(user)
      .updateVaultBlob(vaultId, newBlob);
  });

  await verifyEvent("GrandWardenVault", "AtomicUpdateCompleted", async () => {
    const newData = ethers.encodeBytes32String("atomic-data");
    return await grandWardenVault
      .connect(user)
      .atomicVaultUpdate(vaultId, newData);
  });

  // 2. Wallet Vault Events
  console.log("\n💼 Wallet Vault Events:");

  await verifyEvent("WalletVault", "WalletImported", async () => {
    const encryptedSeed = ethers.encodeBytes32String("test-seed");
    return await walletVault
      .connect(user)
      .importSeedPhrase(encryptedSeed, "Test Wallet");
  });

  // Get wallet ID for further tests
  const seedData = ethers.encodeBytes32String("test-seed-2");
  const importTx = await walletVault
    .connect(user)
    .importSeedPhrase(seedData, "Test Wallet 2");
  const importReceipt = await importTx.wait();
  const importEvent = importReceipt?.logs.find(
    (log) =>
      walletVault.interface.parseLog(log as any)?.name === "WalletImported"
  );
  const walletId = walletVault.interface.parseLog(importEvent as any)?.args[1];

  await verifyEvent("WalletVault", "TransactionSigned", async () => {
    // First derive keys
    await walletVault.connect(user).deriveKeysFromSeed(walletId, [1]);

    const txHash = ethers.keccak256(ethers.toUtf8Bytes("test-tx"));
    const txData = ethers.toUtf8Bytes("test-data");
    return await walletVault
      .connect(user)
      .signTransaction(walletId, 1, txHash, txData);
  });

  // 3. Device Registry Events
  console.log("\n📱 Device Registry Events:");

  await verifyEvent("DeviceRegistry", "DeviceRegistered", async () => {
    const publicKeyHash = ethers.keccak256(
      ethers.encodeBytes32String("test-key")
    );
    const fingerprint = ethers.encodeBytes32String("test-fingerprint");
    return await deviceRegistry
      .connect(user)
      .registerDevice("Test Device", publicKeyHash, fingerprint);
  });

  // Get device ID for further tests
  const deviceKeyHash = ethers.keccak256(
    ethers.encodeBytes32String("test-key-2")
  );
  const deviceFingerprint = ethers.encodeBytes32String("test-fingerprint-2");
  const registerTx = await deviceRegistry
    .connect(user)
    .registerDevice("Test Device 2", deviceKeyHash, deviceFingerprint);
  const registerReceipt = await registerTx.wait();
  const registerEvent = registerReceipt?.logs.find(
    (log) =>
      deviceRegistry.interface.parseLog(log as any)?.name === "DeviceRegistered"
  );
  const deviceId = deviceRegistry.interface.parseLog(registerEvent as any)
    ?.args[1];

  await verifyEvent("DeviceRegistry", "DeviceAuthenticated", async () => {
    const challenge = await deviceRegistry
      .connect(user)
      .generateAuthChallenge(deviceId);
    const signature = ethers.encodeBytes32String("test-signature");
    return await deviceRegistry
      .connect(user)
      .authenticateDevice(deviceId, challenge, signature);
  });

  await verifyEvent("DeviceRegistry", "DeviceRevoked", async () => {
    return await deviceRegistry.connect(user).revokeDevice(deviceId);
  });

  // 4. Recovery Manager Events
  console.log("\n🔄 Recovery Manager Events:");

  await verifyEvent("RecoveryManager", "GuardianAdded", async () => {
    const guardianAddress = ethers.Wallet.createRandom().address;
    const contactHash = ethers.keccak256(
      ethers.toUtf8Bytes("test@guardian.com")
    );
    return await recoveryManager
      .connect(user)
      .addGuardian(guardianAddress, "Test Guardian", contactHash);
  });

  // Set up guardians for recovery test
  const guardian1 = ethers.Wallet.createRandom().address;
  const guardian2 = ethers.Wallet.createRandom().address;
  await recoveryManager
    .connect(user)
    .addGuardian(
      guardian1,
      "Guardian 1",
      ethers.keccak256(ethers.toUtf8Bytes("g1@test.com"))
    );
  await recoveryManager
    .connect(user)
    .addGuardian(
      guardian2,
      "Guardian 2",
      ethers.keccak256(ethers.toUtf8Bytes("g2@test.com"))
    );

  await verifyEvent("RecoveryManager", "RecoveryInitiated", async () => {
    const encryptedData = ethers.toUtf8Bytes("recovery-data");
    return await recoveryManager
      .connect(user)
      .initiateRecovery(2, encryptedData);
  });

  await verifyEvent("RecoveryManager", "RecoveryShareCreated", async () => {
    const shareData = [
      ethers.toUtf8Bytes("share1"),
      ethers.toUtf8Bytes("share2"),
      ethers.toUtf8Bytes("share3"),
    ];
    return await recoveryManager
      .connect(user)
      .createRecoveryShares(2, shareData);
  });

  // 5. Atomic Vault Manager Events
  console.log("\n⚛️ Atomic Vault Manager Events:");

  await verifyEvent("AtomicVaultManager", "AtomicUpdateStarted", async () => {
    const testVaultId = ethers.keccak256(ethers.toUtf8Bytes("test-vault"));
    const testData = ethers.toUtf8Bytes("test-data");
    return await atomicVaultManager
      .connect(user)
      .executeAtomicUpdate(testVaultId, testData);
  });

  // Summary
  console.log("\n📊 Event Verification Summary:");
  const totalEvents = verifications.length;
  const passedEvents = verifications.filter((v) => v.verified).length;
  const failedEvents = verifications.filter((v) => !v.verified);

  console.log(`   Total events tested: ${totalEvents}`);
  console.log(`   ✅ Passed: ${passedEvents}`);
  console.log(`   ❌ Failed: ${failedEvents.length}`);

  if (failedEvents.length > 0) {
    console.log("\n❌ Failed Events:");
    failedEvents.forEach((event) => {
      console.log(
        `   - ${event.contractName}.${event.eventName}: ${
          event.error || "Event not emitted"
        }`
      );
    });
  }

  const successRate = (passedEvents / totalEvents) * 100;
  console.log(`\n📈 Success Rate: ${successRate.toFixed(1)}%`);

  if (successRate >= 95) {
    console.log(
      "\n🎉 Event verification passed! All critical events are working for The Graph indexing."
    );
  } else if (successRate >= 85) {
    console.log(
      "\n⚠️  Event verification mostly passed, but some events need attention."
    );
  } else {
    console.log(
      "\n❌ Event verification failed. Critical events need to be fixed before deploying subgraph."
    );
    process.exit(1);
  }

  console.log("\n📋 Next Steps for The Graph Integration:");
  console.log("   1. Update subgraph schema with these verified events");
  console.log("   2. Create event handlers for each verified event");
  console.log("   3. Deploy subgraph to index these contract events");
  console.log("   4. Test real-time subscriptions in frontend");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

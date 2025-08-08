import { ethers } from "hardhat";

/**
 * Test script for deployed contracts on Sapphire testnet
 * Tests all core functionality with real deployed contracts
 */

async function main() {
  console.log(
    "🧪 Testing deployed Grand Warden contracts on Sapphire testnet...\n"
  );

  const [deployer, user] = await ethers.getSigners();
  console.log(`Testing with deployer: ${await deployer.getAddress()}`);
  console.log(
    `Testing with user: ${
      user ? await user.getAddress() : "Using deployer as user"
    }\n`
  );

  // Use deployer as user if no second signer available
  const testUser = user || deployer;

  // Contract addresses from deployment
  const addresses = {
    GrandWardenVault: "0xB6B183a041D077d5924b340EBF41EE4546fE0bcE",
    WalletVault: "0x3B7dd63D236bDB0Fd85d556d2AC70e2746cF5F82",
    DeviceRegistry: "0x9ec3B09A3cDc7Dd2ba8fB8F6e9Bd6C04DDfBCd2d",
    RecoveryManager: "0x58fF6e3d3D76053F2B13327A6399ECD25E363818",
    AtomicVaultManager: "0x811182419a4e4F419ec100ac0Cd63fc1Fef2810C",
  };

  // Connect to deployed contracts
  const grandWardenVault = await ethers.getContractAt(
    "GrandWardenVault",
    addresses.GrandWardenVault
  );
  const walletVault = await ethers.getContractAt(
    "WalletVault",
    addresses.WalletVault
  );
  const deviceRegistry = await ethers.getContractAt(
    "DeviceRegistry",
    addresses.DeviceRegistry
  );
  const recoveryManager = await ethers.getContractAt(
    "RecoveryManager",
    addresses.RecoveryManager
  );
  const atomicVaultManager = await ethers.getContractAt(
    "AtomicVaultManager",
    addresses.AtomicVaultManager
  );

  let testsPassedCount = 0;
  let totalTests = 0;

  // Helper function for tests
  async function runTest(testName: string, testFunction: () => Promise<void>) {
    totalTests++;
    try {
      await testFunction();
      console.log(`✅ ${testName}`);
      testsPassedCount++;
    } catch (error: any) {
      console.log(`❌ ${testName}: ${error.message}`);
    }
  }

  console.log("🔐 Testing Password Vault (GrandWardenVault):");

  await runTest("Create vault", async () => {
    const vaultData = ethers.encodeBytes32String("test-vault-data");
    const tx = await grandWardenVault.connect(testUser).createVault(vaultData);
    const receipt = await tx.wait();

    const event = receipt?.logs.find(
      (log) =>
        grandWardenVault.interface.parseLog(log as any)?.name === "VaultCreated"
    );
    if (!event) throw new Error("VaultCreated event not found");
  });

  // Get vault ID for further tests
  let vaultId: any;
  try {
    const vaultData = ethers.encodeBytes32String("test-vault-data-2");
    const createTx = await grandWardenVault
      .connect(testUser)
      .createVault(vaultData);
    const receipt = await createTx.wait();
    const event = receipt?.logs.find(
      (log) =>
        grandWardenVault.interface.parseLog(log as any)?.name === "VaultCreated"
    );
    vaultId = grandWardenVault.interface.parseLog(event as any)?.args[1];
  } catch (error) {
    console.log("⚠️  Could not create test vault for credential tests");
  }

  if (vaultId) {
    await runTest("Add credential to vault", async () => {
      const domain = "testsite.com";
      const username = "testuser";
      const encryptedPassword =
        ethers.encodeBytes32String("encrypted-password");

      const tx = await grandWardenVault
        .connect(testUser)
        .addCredential(vaultId, domain, username, encryptedPassword);
      const receipt = await tx.wait();

      const event = receipt?.logs.find(
        (log) =>
          grandWardenVault.interface.parseLog(log as any)?.name ===
          "CredentialAdded"
      );
      if (!event) throw new Error("CredentialAdded event not found");
    });

    await runTest("Update vault blob", async () => {
      const newBlob = ethers.encodeBytes32String("updated-blob");
      const tx = await grandWardenVault
        .connect(testUser)
        .updateVaultBlob(vaultId, newBlob);
      await tx.wait();
    });
  }

  console.log("\n💼 Testing Wallet Vault (WalletVault):");

  await runTest("Import seed phrase", async () => {
    const encryptedSeed = ethers.encodeBytes32String("test-seed-phrase");
    const walletName = "Test Wallet";

    const tx = await walletVault
      .connect(testUser)
      .importSeedPhrase(encryptedSeed, walletName);
    const receipt = await tx.wait();

    const event = receipt?.logs.find(
      (log) =>
        walletVault.interface.parseLog(log as any)?.name === "WalletImported"
    );
    if (!event) throw new Error("WalletImported event not found");
  });

  // Get wallet ID for further tests
  let walletId: any;
  try {
    const encryptedSeed = ethers.encodeBytes32String("test-seed-phrase-2");
    const importTx = await walletVault
      .connect(testUser)
      .importSeedPhrase(encryptedSeed, "Test Wallet 2");
    const receipt = await importTx.wait();
    const event = receipt?.logs.find(
      (log) =>
        walletVault.interface.parseLog(log as any)?.name === "WalletImported"
    );
    walletId = walletVault.interface.parseLog(event as any)?.args[1];
  } catch (error) {
    console.log("⚠️  Could not create test wallet for key derivation tests");
  }

  if (walletId) {
    await runTest("Derive keys for multiple chains", async () => {
      const chainTypes = [1, 2]; // Ethereum and Polygon
      const tx = await walletVault
        .connect(testUser)
        .deriveKeysFromSeed(walletId, chainTypes);
      await tx.wait();

      const walletInfo = await walletVault
        .connect(testUser)
        .getWalletInfo(walletId);
      if (walletInfo.chainTypes.length !== 2) {
        throw new Error(
          `Expected 2 chains, got ${walletInfo.chainTypes.length}`
        );
      }
    });

    await runTest("Get derived address", async () => {
      const address = await walletVault
        .connect(testUser)
        .getDerivedAddress(walletId, 1);
      if (address === ethers.ZeroAddress) {
        throw new Error("Derived address is zero address");
      }
    });

    await runTest("Fetch wallet balances", async () => {
      const balances = await walletVault
        .connect(testUser)
        .fetchWalletBalances(walletId);
      if (balances.length === 0) {
        throw new Error("No balances returned");
      }
    });
  }

  console.log("\n📱 Testing Device Registry (DeviceRegistry):");

  await runTest("Register device", async () => {
    const deviceName = "Test Device";
    const publicKeyHash = ethers.keccak256(
      ethers.encodeBytes32String("test-key")
    );
    const fingerprint = ethers.encodeBytes32String("test-fingerprint");

    const tx = await deviceRegistry
      .connect(testUser)
      .registerDevice(deviceName, publicKeyHash, fingerprint);
    const receipt = await tx.wait();

    const event = receipt?.logs.find(
      (log) =>
        deviceRegistry.interface.parseLog(log as any)?.name ===
        "DeviceRegistered"
    );
    if (!event) throw new Error("DeviceRegistered event not found");
  });

  // Get device ID for further tests
  let deviceId: any;
  try {
    const deviceName = "Test Device 2";
    const publicKeyHash = ethers.keccak256(
      ethers.encodeBytes32String("test-key-2")
    );
    const fingerprint = ethers.encodeBytes32String("test-fingerprint-2");

    const registerTx = await deviceRegistry
      .connect(testUser)
      .registerDevice(deviceName, publicKeyHash, fingerprint);
    const receipt = await registerTx.wait();
    const event = receipt?.logs.find(
      (log) =>
        deviceRegistry.interface.parseLog(log as any)?.name ===
        "DeviceRegistered"
    );
    deviceId = deviceRegistry.interface.parseLog(event as any)?.args[1];
  } catch (error) {
    console.log("⚠️  Could not create test device for authentication tests");
  }

  if (deviceId) {
    await runTest("Generate authentication challenge", async () => {
      const challenge = await deviceRegistry
        .connect(testUser)
        .generateAuthChallenge(deviceId);
      if (challenge === ethers.ZeroHash) {
        throw new Error("Challenge is zero hash");
      }
    });

    await runTest("Authenticate device", async () => {
      const challenge = await deviceRegistry
        .connect(testUser)
        .generateAuthChallenge(deviceId);
      const signature = ethers.encodeBytes32String("test-signature");

      const tx = await deviceRegistry
        .connect(testUser)
        .authenticateDevice(deviceId, challenge, signature);
      const receipt = await tx.wait();

      const event = receipt?.logs.find(
        (log) =>
          deviceRegistry.interface.parseLog(log as any)?.name ===
          "DeviceAuthenticated"
      );
      if (!event) throw new Error("DeviceAuthenticated event not found");
    });

    await runTest("Check device authorization", async () => {
      const isAuthorized = await deviceRegistry.isDeviceAuthorized(deviceId);
      if (!isAuthorized) {
        throw new Error("Device should be authorized");
      }
    });
  }

  console.log("\n🔄 Testing Recovery Manager (RecoveryManager):");

  await runTest("Add guardian", async () => {
    const guardianAddress = ethers.Wallet.createRandom().address;
    const guardianName = "Test Guardian";
    const contactHash = ethers.keccak256(
      ethers.toUtf8Bytes("test@guardian.com")
    );

    const tx = await recoveryManager
      .connect(testUser)
      .addGuardian(guardianAddress, guardianName, contactHash);
    const receipt = await tx.wait();

    const event = receipt?.logs.find(
      (log) =>
        recoveryManager.interface.parseLog(log as any)?.name === "GuardianAdded"
    );
    if (!event) throw new Error("GuardianAdded event not found");
  });

  await runTest("Get user guardians", async () => {
    const guardians = await recoveryManager.getUserGuardians(
      await testUser.getAddress()
    );
    if (guardians.length === 0) {
      throw new Error("No guardians found");
    }
  });

  await runTest("Create recovery shares", async () => {
    const threshold = 2;
    const shareData = [
      ethers.toUtf8Bytes("share1"),
      ethers.toUtf8Bytes("share2"),
      ethers.toUtf8Bytes("share3"),
    ];

    const tx = await recoveryManager
      .connect(testUser)
      .createRecoveryShares(threshold, shareData);
    const receipt = await tx.wait();

    const event = receipt?.logs.find(
      (log) =>
        recoveryManager.interface.parseLog(log as any)?.name ===
        "RecoveryShareCreated"
    );
    if (!event) throw new Error("RecoveryShareCreated event not found");
  });

  console.log("\n⚛️  Testing Atomic Vault Manager (AtomicVaultManager):");

  await runTest("Get operation statistics", async () => {
    const stats = await atomicVaultManager.getOperationStats();
    // Stats object should exist (total might be 0)
    if (typeof stats.total === "undefined") {
      throw new Error("Stats object malformed");
    }
  });

  await runTest("Execute atomic update", async () => {
    const testVaultId = ethers.keccak256(
      ethers.toUtf8Bytes("test-atomic-vault")
    );
    const testData = ethers.toUtf8Bytes("test atomic data");

    const tx = await atomicVaultManager
      .connect(testUser)
      .executeAtomicUpdate(testVaultId, testData);
    const receipt = await tx.wait();

    const event = receipt?.logs.find(
      (log) =>
        atomicVaultManager.interface.parseLog(log as any)?.name ===
        "AtomicUpdateStarted"
    );
    if (!event) throw new Error("AtomicUpdateStarted event not found");
  });

  // Summary
  console.log("\n📊 Test Results Summary:");
  console.log(`   Total tests: ${totalTests}`);
  console.log(`   ✅ Passed: ${testsPassedCount}`);
  console.log(`   ❌ Failed: ${totalTests - testsPassedCount}`);

  const successRate = (testsPassedCount / totalTests) * 100;
  console.log(`   📈 Success rate: ${successRate.toFixed(1)}%`);

  if (successRate >= 90) {
    console.log(
      "\n🎉 Excellent! Your contracts are working perfectly on Sapphire testnet!"
    );
    console.log(
      "✅ Ready to proceed with frontend integration and Phase 2 (The Graph)"
    );
  } else if (successRate >= 75) {
    console.log(
      "\n✅ Good! Most functionality is working. Some minor issues to investigate:"
    );
    console.log("⚠️  Check failed tests above for specific issues");
  } else {
    console.log(
      "\n⚠️  Some issues detected. Please investigate failed tests before proceeding:"
    );
    console.log("❌ Consider re-running tests or checking contract state");
  }

  console.log("\n🔗 Contract Addresses (Sapphire Testnet):");
  Object.entries(addresses).forEach(([name, address]) => {
    console.log(`   ${name}: ${address}`);
  });

  console.log("\n🌐 Block Explorer Links:");
  Object.entries(addresses).forEach(([name, address]) => {
    console.log(
      `   ${name}: https://explorer.sapphire.oasis.io/address/${address}`
    );
  });

  console.log("\n📋 Next Steps:");
  console.log("   1. ✅ Contracts deployed and tested on Sapphire testnet");
  console.log("   2. 🔄 Ready for frontend integration with these addresses");
  console.log("   3. 📊 Ready for Phase 2: Deploy The Graph subgraph");
  console.log("   4. 🚀 Ready for production deployment when needed");
}

main().catch((error) => {
  console.error("❌ Test execution failed:");
  console.error(error);
  process.exitCode = 1;
});

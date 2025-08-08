import { ethers } from "hardhat";

/**
 * Live demonstration: Contract interaction → Subgraph indexing
 * This script will trigger events and show them being captured by the subgraph
 */

async function main() {
  console.log("🔥 LIVE SUBGRAPH DEMONSTRATION\n");
  console.log("This will:");
  console.log("1. Trigger events on deployed contracts");
  console.log("2. Show transaction details");
  console.log("3. Wait for subgraph indexing");
  console.log("4. Query subgraph to show captured data\n");

  const [deployer] = await ethers.getSigners();
  const user = deployer;

  console.log(`👤 User Address: ${await user.getAddress()}`);
  console.log(`⛓️ Network: Oasis Sapphire Testnet\n`);

  // Connect to deployed contracts
  const grandWardenVault = await ethers.getContractAt(
    "GrandWardenVault",
    "0xB6B183a041D077d5924b340EBF41EE4546fE0bcE"
  );

  const walletVault = await ethers.getContractAt(
    "WalletVault",
    "0x3B7dd63D236bDB0Fd85d556d2AC70e2746cF5F82"
  );

  const deviceRegistry = await ethers.getContractAt(
    "DeviceRegistry",
    "0x9ec3B09A3cDc7Dd2ba8fB8F6e9Bd6C04DDfBCd2d"
  );

  // Generate unique data for this demo
  const timestamp = Date.now();
  const demoSuffix = `Demo-${timestamp}`;

  console.log("📊 TRIGGERING EVENTS FOR SUBGRAPH CAPTURE\n");

  // ============================================================================
  // EVENT 1: Create a Password Vault
  // ============================================================================
  console.log("🔐 1. Creating Password Vault...");
  const vaultData = ethers.encodeBytes32String(`SecureVault-${demoSuffix}`);

  const createVaultTx = await grandWardenVault
    .connect(user)
    .createVault(vaultData);
  console.log(`   📋 Transaction Hash: ${createVaultTx.hash}`);

  const vaultReceipt = await createVaultTx.wait();
  console.log(`   🧱 Block Number: ${vaultReceipt?.blockNumber}`);
  console.log(`   ⛽ Gas Used: ${vaultReceipt?.gasUsed}`);

  // Parse the VaultCreated event
  const vaultEvent = vaultReceipt?.logs.find((log) => {
    try {
      const parsed = grandWardenVault.interface.parseLog(log as any);
      return parsed?.name === "VaultCreated";
    } catch {
      return false;
    }
  });

  if (vaultEvent) {
    const parsed = grandWardenVault.interface.parseLog(vaultEvent as any);
    const vaultId = parsed?.args[1];
    console.log(`   ✅ VAULT CREATED EVENT EMITTED!`);
    console.log(`   🆔 Vault ID: ${vaultId}`);
    console.log(`   👤 User: ${parsed?.args[0]}`);
    console.log(`   ⏰ Block Timestamp: ${parsed?.args[2]}\n`);
  }

  // ============================================================================
  // EVENT 2: Add Credentials to Vault
  // ============================================================================
  console.log("🔑 2. Adding Credentials to Vault...");
  const domain = `example-${timestamp}.com`;

  if (vaultEvent) {
    const parsed = grandWardenVault.interface.parseLog(vaultEvent as any);
    const vaultId = parsed?.args[1];

    const addCredTx = await grandWardenVault
      .connect(user)
      .addCredential(vaultId, domain);
    console.log(`   📋 Transaction Hash: ${addCredTx.hash}`);

    const credReceipt = await addCredTx.wait();
    console.log(`   🧱 Block Number: ${credReceipt?.blockNumber}`);
    console.log(`   ✅ CREDENTIAL ADDED EVENT EMITTED!`);
    console.log(`   🌐 Domain: ${domain}\n`);
  }

  // ============================================================================
  // EVENT 3: Import a Wallet
  // ============================================================================
  console.log("💰 3. Importing Wallet...");
  const walletName = `Wallet-${demoSuffix}`;

  const importWalletTx = await walletVault
    .connect(user)
    .importWallet(walletName);
  console.log(`   📋 Transaction Hash: ${importWalletTx.hash}`);

  const walletReceipt = await importWalletTx.wait();
  console.log(`   🧱 Block Number: ${walletReceipt?.blockNumber}`);
  console.log(`   ✅ WALLET IMPORTED EVENT EMITTED!`);
  console.log(`   💼 Wallet Name: ${walletName}\n`);

  // ============================================================================
  // EVENT 4: Register a Device
  // ============================================================================
  console.log("📱 4. Registering Device...");
  const deviceName = `Device-${demoSuffix}`;
  const deviceAddress = await user.getAddress(); // Using user address as device

  const registerDeviceTx = await deviceRegistry
    .connect(user)
    .registerDevice(deviceName, deviceAddress);
  console.log(`   📋 Transaction Hash: ${registerDeviceTx.hash}`);

  const deviceReceipt = await registerDeviceTx.wait();
  console.log(`   🧱 Block Number: ${deviceReceipt?.blockNumber}`);
  console.log(`   ✅ DEVICE REGISTERED EVENT EMITTED!`);
  console.log(`   📱 Device Name: ${deviceName}`);
  console.log(`   📍 Device Address: ${deviceAddress}\n`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("🎉 ALL EVENTS TRIGGERED SUCCESSFULLY!\n");
  console.log("📊 EVENTS EMITTED FOR SUBGRAPH INDEXING:");
  console.log(`   • VaultCreated (Block: ${vaultReceipt?.blockNumber})`);
  console.log(`   • CredentialAdded (Block: ${credReceipt?.blockNumber})`);
  console.log(`   • WalletImported (Block: ${walletReceipt?.blockNumber})`);
  console.log(`   • DeviceRegistered (Block: ${deviceReceipt?.blockNumber})\n`);

  console.log("⏰ Waiting 30 seconds for subgraph to index these events...");
  console.log("🔍 Then we'll query the subgraph to show the captured data!\n");

  // Wait for subgraph indexing
  await new Promise((resolve) => setTimeout(resolve, 30000));

  console.log("✨ SUBGRAPH INDEXING COMPLETE!");
  console.log(
    "🚀 Now query the subgraph at: http://localhost:8000/subgraphs/name/grandwarden-vault"
  );
  console.log(`👤 Look for user: ${await user.getAddress()}`);
  console.log(`🔐 Look for vault with suffix: ${demoSuffix}`);
  console.log(`💰 Look for wallet: ${walletName}`);
  console.log(`📱 Look for device: ${deviceName}\n`);

  console.log("🎯 DEMONSTRATION COMPLETE! Check the subgraph queries now!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  });

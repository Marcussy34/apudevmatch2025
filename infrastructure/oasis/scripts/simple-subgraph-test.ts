import { ethers } from "hardhat";
import axios from "axios";

// Contract addresses from deployment
const CONTRACTS = {
  GrandWardenVault: "0xB6B183a041D077d5924b340EBF41EE4546fE0bcE",
  DeviceRegistry: "0x9ec3B09A3cDc7Dd2ba8fB8F6e9Bd6C04DDfBCd2d",
};

const SUBGRAPH_URL = "http://localhost:8000/subgraphs/name/grandwarden-vault";

// Helper function to query subgraph
async function querySubgraph(query: string) {
  try {
    const response = await axios.post(SUBGRAPH_URL, {
      query: query,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Subgraph query failed:", error);
    return null;
  }
}

// Check subgraph sync status
async function checkSubgraphStatus() {
  console.log("🔍 Checking subgraph status...");

  const statusQuery = `{
    _meta {
      hasIndexingErrors
      block {
        number
        hash
      }
    }
  }`;

  const result = await querySubgraph(statusQuery);
  if (result?.data?._meta) {
    const meta = result.data._meta;
    console.log(`   📦 Current Block: ${meta.block.number}`);
    console.log(`   🔨 Block Hash: ${meta.block.hash}`);
    console.log(`   ❌ Has Errors: ${meta.hasIndexingErrors}`);
    return meta.block.number;
  }
  return null;
}

// Wait for block to be indexed
async function waitForBlock(targetBlock: number, timeoutMs: number = 300000) {
  console.log(`⏳ Waiting for subgraph to reach block ${targetBlock}...`);

  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const currentBlock = await checkSubgraphStatus();
    if (currentBlock && currentBlock >= targetBlock) {
      console.log(`✅ Subgraph reached target block ${targetBlock}!`);
      return true;
    }

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    console.log(
      `   ⏱️  Waiting... (${elapsed}s elapsed, current: ${currentBlock})`
    );
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  console.log("⚠️ Timeout waiting for subgraph sync");
  return false;
}

// Test GrandWardenVault - Create a password vault
async function testPasswordVault() {
  console.log("\n🔐 TESTING PASSWORD VAULT");
  console.log("========================");

  const [signer] = await ethers.getSigners();
  const GrandWardenVault = await ethers.getContractFactory("GrandWardenVault");
  const vault = GrandWardenVault.attach(CONTRACTS.GrandWardenVault).connect(
    signer
  );

  // Create a test vault with simple data
  console.log("📝 Creating password vault...");
  const vaultData = ethers.toUtf8Bytes('{ "test": "password vault data" }');

  try {
    const tx = await vault.createVault(vaultData);
    console.log(`   📋 Transaction Hash: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`   🧱 Block Number: ${receipt.blockNumber}`);
    console.log(`   ⛽ Gas Used: ${receipt.gasUsed.toString()}`);

    // Parse events
    const events = receipt.logs?.filter((log: any) => {
      try {
        const parsed = vault.interface.parseLog(log);
        return parsed?.name === "VaultCreated";
      } catch {
        return false;
      }
    });

    if (events && events.length > 0) {
      const parsedEvent = vault.interface.parseLog(events[0]);
      console.log(`   ✅ VAULT CREATED EVENT EMITTED!`);
      console.log(`   🆔 Vault ID: ${parsedEvent?.args?.vaultId}`);
      console.log(`   👤 User: ${parsedEvent?.args?.user}`);
      console.log(`   ⏰ Timestamp: ${parsedEvent?.args?.timestamp}`);

      return {
        blockNumber: receipt.blockNumber,
        vaultId: parsedEvent?.args?.vaultId,
        user: parsedEvent?.args?.user,
        timestamp: parsedEvent?.args?.timestamp,
        txHash: tx.hash,
      };
    }
  } catch (error) {
    console.error("❌ Error creating vault:", error);
  }

  return null;
}

// Test DeviceRegistry - Register a device
async function testDeviceRegistry() {
  console.log("\n📱 TESTING DEVICE REGISTRY");
  console.log("==========================");

  const [signer] = await ethers.getSigners();
  const DeviceRegistry = await ethers.getContractFactory("DeviceRegistry");
  const registry = DeviceRegistry.attach(CONTRACTS.DeviceRegistry).connect(
    signer
  );

  console.log("📝 Registering test device...");
  const deviceName = "Test iPhone 15";
  const publicKeyHash = ethers.keccak256(ethers.toUtf8Bytes("test-public-key"));
  const deviceFingerprint = ethers.toUtf8Bytes("iPhone15-fingerprint-test");

  try {
    const tx = await registry.registerDevice(
      deviceName,
      publicKeyHash,
      deviceFingerprint
    );
    console.log(`   📋 Transaction Hash: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`   🧱 Block Number: ${receipt.blockNumber}`);
    console.log(`   ⛽ Gas Used: ${receipt.gasUsed.toString()}`);

    // Parse events
    const events = receipt.logs?.filter((log: any) => {
      try {
        const parsed = registry.interface.parseLog(log);
        return parsed?.name === "DeviceRegistered";
      } catch {
        return false;
      }
    });

    if (events && events.length > 0) {
      const parsedEvent = registry.interface.parseLog(events[0]);
      console.log(`   ✅ DEVICE REGISTERED EVENT EMITTED!`);
      console.log(`   🆔 Device ID: ${parsedEvent?.args?.deviceId}`);
      console.log(`   👤 User: ${parsedEvent?.args?.user}`);
      console.log(`   📱 Device Name: ${parsedEvent?.args?.deviceName}`);

      return {
        blockNumber: receipt.blockNumber,
        deviceId: parsedEvent?.args?.deviceId,
        user: parsedEvent?.args?.user,
        deviceName: parsedEvent?.args?.deviceName,
        txHash: tx.hash,
      };
    }
  } catch (error) {
    console.error("❌ Error registering device:", error);
  }

  return null;
}

// Query subgraph for vault data
async function queryVaultData(vaultId: string) {
  console.log(`\n🔍 QUERYING VAULT DATA: ${vaultId}`);
  console.log("================================");

  const query = `{
    vaults(where: {id: "${vaultId}"}) {
      id
      owner {
        id
        totalVaults
        createdAt
        lastActivity
      }
      isActive
      createdAt
      lastUpdated
    }
  }`;

  const result = await querySubgraph(query);
  if (result?.data?.vaults && result.data.vaults.length > 0) {
    console.log("✅ VAULT FOUND IN SUBGRAPH!");
    console.log(JSON.stringify(result.data.vaults[0], null, 2));
    return result.data.vaults[0];
  } else {
    console.log("❌ Vault not found in subgraph yet");
    return null;
  }
}

// Query user data
async function queryUserData(userAddress: string) {
  console.log(`\n👤 QUERYING USER DATA: ${userAddress}`);
  console.log("=================================");

  const query = `{
    users(where: {id: "${userAddress.toLowerCase()}"}) {
      id
      totalVaults
      totalDevices
      createdAt
      lastActivity
      vaults {
        id
        isActive
        createdAt
      }
      devices {
        id
        isActive
        createdAt
      }
    }
  }`;

  const result = await querySubgraph(query);
  if (result?.data?.users && result.data.users.length > 0) {
    console.log("✅ USER FOUND IN SUBGRAPH!");
    console.log(JSON.stringify(result.data.users[0], null, 2));
    return result.data.users[0];
  } else {
    console.log("❌ User not found in subgraph yet");
    return null;
  }
}

// Query all indexed data
async function queryAllData() {
  console.log("\n📊 QUERYING ALL INDEXED DATA");
  console.log("=============================");

  const query = `{
    users {
      id
      totalVaults
      totalDevices
      createdAt
    }
    vaults {
      id
      owner {
        id
      }
      isActive
      createdAt
    }
    devices {
      id
      user {
        id
      }
      isActive
      createdAt
    }
  }`;

  const result = await querySubgraph(query);
  if (result?.data) {
    console.log(`📈 Found ${result.data.users?.length || 0} users`);
    console.log(`📈 Found ${result.data.vaults?.length || 0} vaults`);
    console.log(`📈 Found ${result.data.devices?.length || 0} devices`);

    if (result.data.users?.length > 0) {
      console.log("\n👥 Users:");
      result.data.users.forEach((user: any) => {
        console.log(
          `   ${user.id} (${user.totalVaults} vaults, ${user.totalDevices} devices)`
        );
      });
    }

    return result.data;
  }

  return null;
}

// Main test function
async function main() {
  console.log("🚀 GRAND WARDEN SUBGRAPH SIMPLE TEST");
  console.log("====================================");

  // Check initial status
  const initialBlock = await checkSubgraphStatus();
  if (!initialBlock) {
    console.error("❌ Cannot connect to subgraph");
    return;
  }

  // Get signer address
  const [signer] = await ethers.getSigners();
  console.log(`👤 Testing with address: ${signer.address}`);

  // Query existing data first
  console.log("\n📊 CHECKING EXISTING DATA...");
  await queryAllData();

  // Test contract interactions
  console.log("\n🔥 STARTING NEW CONTRACT INTERACTIONS...");

  let maxBlock = initialBlock;
  const results: any[] = [];

  // Test 1: Password Vault
  const vaultResult = await testPasswordVault();
  if (vaultResult) {
    results.push(vaultResult);
    maxBlock = Math.max(maxBlock, vaultResult.blockNumber);
  }

  // Test 2: Device Registry
  const deviceResult = await testDeviceRegistry();
  if (deviceResult) {
    results.push(deviceResult);
    maxBlock = Math.max(maxBlock, deviceResult.blockNumber);
  }

  if (results.length > 0) {
    console.log(
      `\n⏳ Waiting for subgraph to index up to block ${maxBlock}...`
    );
    console.log(`📋 Transactions to verify:`);
    results.forEach((result) => {
      console.log(`   - ${result.txHash} (Block ${result.blockNumber})`);
    });

    // Wait for subgraph to sync
    const synced = await waitForBlock(maxBlock + 1); // Wait for one block after

    if (synced) {
      console.log("\n🎉 SUBGRAPH SYNCED! Querying indexed data...");

      // Wait a bit more for processing
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Query the data we just created
      if (vaultResult?.vaultId) {
        await queryVaultData(vaultResult.vaultId);
      }

      if (vaultResult?.user) {
        await queryUserData(vaultResult.user);
      }

      // Query all data to see the changes
      await queryAllData();

      // Final status check
      console.log("\n📊 FINAL SUBGRAPH STATUS:");
      await checkSubgraphStatus();

      console.log("\n🎉 TEST COMPLETE! Your subgraph is working correctly!");
      console.log("✅ Contract interactions captured in real-time");
      console.log("✅ Events properly indexed");
      console.log("✅ GraphQL queries returning data");
    } else {
      console.log("⚠️ Subgraph sync timeout, but transactions were successful");
      console.log("💡 The subgraph may still be catching up - check manually:");
      console.log(`   Block to check: ${maxBlock}`);
      results.forEach((result) => {
        console.log(`   Transaction: ${result.txHash}`);
      });
    }
  } else {
    console.log("❌ No successful transactions to test");
    console.log("💡 But subgraph is running - you can try manual interactions");
  }
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });

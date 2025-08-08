import { ethers } from "ethers";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * COMPREHENSIVE REAL-TIME INDEXING TEST
 *
 * This script tests the complete real-time indexing pipeline:
 * 1. Checks if subgraph is synced
 * 2. Records current state
 * 3. Makes contract transaction
 * 4. Monitors for real-time capture
 * 5. Verifies data integrity
 */

interface SubgraphStatus {
  currentBlock: number;
  networkBlock: number;
  isSynced: boolean;
  gap: number;
}

interface DeviceData {
  id: string;
  deviceName: string;
  owner: { id: string };
  registeredAt: number;
}

const CONFIG = {
  SUBGRAPH_URL: "http://localhost:8000/subgraphs/name/grandwarden-vault",
  SAPPHIRE_RPC: "https://testnet.sapphire.oasis.io",
  DEVICE_REGISTRY: "0x9ec3B09A3cDc7Dd2ba8fB8F6e9Bd6C04DDfBCd2d",
  PRIVATE_KEY: process.env.PRIVATE_KEY || "YOUR_PRIVATE_KEY_HERE",
  REAL_TIME_THRESHOLD: 5, // blocks
};

class RealTimeIndexingTester {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private deviceRegistry: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.SAPPHIRE_RPC);
    this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);

    const deviceAbi = [
      "function registerDevice(string calldata deviceName, bytes32 publicKeyHash, bytes calldata deviceFingerprint) external returns (bytes32 deviceId)",
      "event DeviceRegistered(address indexed user, bytes32 indexed deviceId, string deviceName)",
    ];

    this.deviceRegistry = new ethers.Contract(
      CONFIG.DEVICE_REGISTRY,
      deviceAbi,
      this.wallet
    );
  }

  // ==================== SUBGRAPH STATUS CHECKS ====================

  async getSubgraphStatus(): Promise<SubgraphStatus> {
    try {
      const [subgraphResponse, networkBlock] = await Promise.all([
        this.querySubgraph(`{ _meta { block { number } } }`),
        this.provider.getBlockNumber(),
      ]);

      const currentBlock = subgraphResponse._meta.block.number;
      const gap = networkBlock - currentBlock;

      return {
        currentBlock,
        networkBlock,
        isSynced: gap <= CONFIG.REAL_TIME_THRESHOLD,
        gap,
      };
    } catch (error) {
      throw new Error(`Failed to get subgraph status: ${error}`);
    }
  }

  async waitForSync(maxWaitMinutes: number = 10): Promise<boolean> {
    console.log(
      `⏳ Waiting for subgraph to sync (max ${maxWaitMinutes} minutes)...`
    );

    const startTime = Date.now();
    const maxWait = maxWaitMinutes * 60 * 1000;

    while (Date.now() - startTime < maxWait) {
      const status = await this.getSubgraphStatus();

      console.log(
        `📊 Block ${status.currentBlock}/${status.networkBlock} (gap: ${status.gap})`
      );

      if (status.isSynced) {
        console.log(`✅ Subgraph is synced! Gap: ${status.gap} blocks`);
        return true;
      }

      await this.sleep(10000); // Check every 10 seconds
    }

    console.log(
      `⏰ Timeout: Subgraph did not sync within ${maxWaitMinutes} minutes`
    );
    return false;
  }

  // ==================== CONTRACT INTERACTION ====================

  async registerTestDevice(): Promise<{
    tx: ethers.TransactionResponse;
    receipt: ethers.TransactionReceipt;
    deviceData: any;
  }> {
    const timestamp = Date.now();
    const deviceName = `RealTime Test Device ${timestamp}`;
    const publicKeyHash = ethers.keccak256(
      ethers.toUtf8Bytes(`pubkey-${timestamp}`)
    );
    const deviceFingerprint = ethers.toUtf8Bytes(`fingerprint-${timestamp}`);

    console.log(`📱 Registering device: ${deviceName}`);
    console.log(`🔑 Public Key Hash: ${publicKeyHash}`);
    console.log(`👆 Fingerprint: ${ethers.hexlify(deviceFingerprint)}`);

    const tx = await this.deviceRegistry.registerDevice(
      deviceName,
      publicKeyHash,
      deviceFingerprint,
      {
        gasLimit: 500000,
        gasPrice: ethers.parseUnits("100", "gwei"), // Higher gas price for Sapphire
      }
    );
    console.log(`📤 Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error(`Transaction failed: ${receipt?.hash}`);
    }

    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

    // Parse the event
    let deviceId = null;
    if (receipt.logs && receipt.logs.length > 0) {
      const eventLog = receipt.logs.find(
        (log: any) =>
          log.address.toLowerCase() === CONFIG.DEVICE_REGISTRY.toLowerCase()
      );

      if (eventLog) {
        try {
          const parsed = this.deviceRegistry.interface.parseLog({
            topics: eventLog.topics,
            data: eventLog.data,
          });
          deviceId = parsed?.args[1];
          console.log(`🆔 Device ID: ${deviceId}`);
        } catch (e) {
          console.warn("Could not parse event log");
        }
      }
    }

    return {
      tx,
      receipt,
      deviceData: {
        deviceId,
        deviceName,
        blockNumber: receipt.blockNumber,
        transactionHash: receipt.hash,
        owner: this.wallet.address,
      },
    };
  }

  // ==================== SUBGRAPH QUERIES ====================

  async querySubgraph(query: string): Promise<any> {
    const response = await fetch(CONFIG.SUBGRAPH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Subgraph query failed: ${response.statusText}`);
    }

    const data: any = await response.json();
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  }

  async getDeviceById(deviceId: string): Promise<DeviceData | null> {
    try {
      const result = await this.querySubgraph(`{
        device(id: "${deviceId}") {
          id
          deviceName
          owner { id }
          registeredAt
        }
      }`);
      return result.device;
    } catch (error) {
      console.warn(`Could not query device ${deviceId}:`, error);
      return null;
    }
  }

  async getLatestDevices(count: number = 5): Promise<DeviceData[]> {
    const result = await this.querySubgraph(`{
      devices(orderBy: registeredAt, orderDirection: desc, first: ${count}) {
        id
        deviceName
        owner { id }
        registeredAt
      }
    }`);
    return result.devices || [];
  }

  // ==================== REAL-TIME MONITORING ====================

  async monitorForDevice(
    expectedDeviceId: string,
    targetBlock: number,
    maxWaitSeconds: number = 60
  ): Promise<boolean> {
    console.log(
      `🔍 Monitoring for device ${expectedDeviceId} at block ${targetBlock}...`
    );

    const startTime = Date.now();
    const maxWait = maxWaitSeconds * 1000;

    while (Date.now() - startTime < maxWait) {
      const status = await this.getSubgraphStatus();

      // Check if subgraph has reached the target block
      if (status.currentBlock >= targetBlock) {
        console.log(
          `📊 Subgraph reached block ${status.currentBlock} (target: ${targetBlock})`
        );

        // Query for the specific device
        const device = await this.getDeviceById(expectedDeviceId);
        if (device) {
          console.log(`✅ Device found in subgraph!`);
          console.log(`   Name: ${device.deviceName}`);
          console.log(`   Owner: ${device.owner.id}`);
          console.log(
            `   Registered: ${new Date(
              device.registeredAt * 1000
            ).toLocaleString()}`
          );
          return true;
        }

        // Also check latest devices
        const latestDevices = await this.getLatestDevices(10);
        const foundInLatest = latestDevices.find(
          (d) => d.id === expectedDeviceId
        );
        if (foundInLatest) {
          console.log(`✅ Device found in latest devices list!`);
          return true;
        }

        console.log(
          `⚠️ Subgraph reached target block but device not found. Waiting...`
        );
      } else {
        const remaining = targetBlock - status.currentBlock;
        console.log(
          `⏳ Waiting... ${remaining} blocks behind (${status.currentBlock}/${targetBlock})`
        );
      }

      await this.sleep(2000); // Check every 2 seconds
    }

    console.log(
      `⏰ Timeout: Device not found within ${maxWaitSeconds} seconds`
    );
    return false;
  }

  // ==================== MAIN TEST EXECUTION ====================

  async runRealTimeTest(): Promise<boolean> {
    console.log("🚀 COMPREHENSIVE REAL-TIME INDEXING TEST");
    console.log("==========================================");
    console.log(`👤 Using wallet: ${this.wallet.address}`);
    console.log(`🌐 Network: Oasis Sapphire Testnet`);
    console.log(`📊 Subgraph: ${CONFIG.SUBGRAPH_URL}`);
    console.log("");

    try {
      // Step 1: Check initial status
      console.log("📋 STEP 1: Checking subgraph status...");
      const initialStatus = await this.getSubgraphStatus();
      console.log(`   Current block: ${initialStatus.currentBlock}`);
      console.log(`   Network block: ${initialStatus.networkBlock}`);
      console.log(`   Gap: ${initialStatus.gap} blocks`);
      console.log(`   Synced: ${initialStatus.isSynced ? "YES" : "NO"}`);
      console.log("");

      // Step 2: Wait for sync if needed
      if (!initialStatus.isSynced) {
        console.log("📋 STEP 2: Waiting for sync...");
        const synced = await this.waitForSync(5); // Wait max 5 minutes
        if (!synced) {
          console.log("❌ Test aborted: Subgraph not synced");
          console.log(
            "💡 Tip: Run this test when the subgraph is closer to the network head"
          );
          return false;
        }
      } else {
        console.log("📋 STEP 2: ✅ Already synced!");
      }
      console.log("");

      // Step 3: Record baseline
      console.log("📋 STEP 3: Recording baseline state...");
      const beforeDevices = await this.getLatestDevices(5);
      console.log(`   Current devices: ${beforeDevices.length}`);
      if (beforeDevices.length > 0) {
        console.log(`   Latest: ${beforeDevices[0].deviceName}`);
      }
      console.log("");

      // Step 4: Make transaction
      console.log("📋 STEP 4: Creating contract transaction...");
      const { receipt, deviceData } = await this.registerTestDevice();
      console.log("");

      // Step 5: Monitor for real-time capture
      console.log("📋 STEP 5: Monitoring for real-time capture...");
      console.log(`   Target block: ${receipt.blockNumber}`);
      console.log(`   Expected device ID: ${deviceData.deviceId}`);

      const startMonitor = Date.now();
      const captured = await this.monitorForDevice(
        deviceData.deviceId,
        receipt.blockNumber,
        120 // 2 minutes max
      );
      const monitorTime = (Date.now() - startMonitor) / 1000;

      console.log("");

      // Step 6: Results
      console.log("📋 STEP 6: Test Results");
      console.log("========================");

      if (captured) {
        console.log("🎉 SUCCESS! Real-time indexing confirmed!");
        console.log(`⚡ Capture time: ${monitorTime.toFixed(1)} seconds`);
        console.log(`✅ Transaction block: ${receipt.blockNumber}`);
        console.log(`✅ Device ID: ${deviceData.deviceId}`);
        console.log(`✅ Event: DeviceRegistered`);
        console.log("");
        console.log(
          "🎯 PROOF: Your subgraph captures contract events in real-time!"
        );
      } else {
        console.log("❌ FAILED: Real-time capture not detected");
        console.log("💡 This could indicate:");
        console.log("   - Subgraph sync issues");
        console.log("   - Event handler problems");
        console.log("   - Network delays");
      }

      return captured;
    } catch (error) {
      console.error("❌ Test failed with error:", error);
      return false;
    }
  }

  // ==================== UTILITIES ====================

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getNetworkInfo(): Promise<void> {
    const balance = await this.provider.getBalance(this.wallet.address);
    const blockNumber = await this.provider.getBlockNumber();

    console.log(`💰 Balance: ${ethers.formatEther(balance)} ROSE`);
    console.log(`🧱 Latest block: ${blockNumber}`);
  }
}

// ==================== EXECUTION ====================

async function main() {
  const tester = new RealTimeIndexingTester();

  console.log("🔧 Pre-flight checks...");
  await tester.getNetworkInfo();
  console.log("");

  const success = await tester.runRealTimeTest();

  console.log("");
  console.log("=".repeat(50));
  if (success) {
    console.log("🎉 REAL-TIME INDEXING TEST: PASSED");
    console.log("Your subgraph is working perfectly!");
  } else {
    console.log("❌ REAL-TIME INDEXING TEST: FAILED");
    console.log("Check the logs above for details.");
  }
  console.log("=".repeat(50));

  process.exit(success ? 0 : 1);
}

// Handle errors
main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});

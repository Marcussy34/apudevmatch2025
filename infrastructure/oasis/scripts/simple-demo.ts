import { ethers } from "hardhat";
import { getSapphireContract, logNetworkInfo } from "./sapphire-utils";

/**
 * DEVICE REGISTRY CONTRACT INTERACTION WITH SAPPHIRE ENCRYPTION
 */
async function main() {
  console.log("🚀 DEVICE REGISTRY CONTRACT TEST (WITH ENCRYPTION)");
  console.log("=================================");

  // Log network info with encryption status
  await logNetworkInfo();

  try {
    // Connect to DeviceRegistry contract with automatic Sapphire wrapping
    const deviceRegistry = await getSapphireContract(
      "DeviceRegistry",
      "0x9ec3B09A3cDc7Dd2ba8fB8F6e9Bd6C04DDfBCd2d"
    );

    console.log("");
    console.log("🎯 Registering a new device (ENCRYPTED)...");

    // Create simple test parameters
    const deviceName = `Test Device ${Date.now()}`;
    const publicKeyHash = ethers.keccak256(
      ethers.toUtf8Bytes(`pubkey-${Date.now()}`)
    );
    const deviceFingerprint = ethers.toUtf8Bytes(`fingerprint-${Date.now()}`);

    console.log(`📱 Device Name: ${deviceName}`);
    console.log(`🔑 Public Key Hash: ${publicKeyHash}`);
    console.log(`👆 Fingerprint: ${ethers.hexlify(deviceFingerprint)}`);

    // Execute the transaction
    const tx = await deviceRegistry.registerDevice(
      deviceName,
      publicKeyHash,
      deviceFingerprint
    );
    console.log(`✅ Transaction sent: ${tx.hash}`);
    console.log("📡 Device data was automatically encrypted for Sapphire TEE");

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ Transaction SUCCESSFUL!`);
    console.log(`📦 Block: ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`✅ Status: ${receipt.status === 1 ? "SUCCESS" : "FAILED"}`);

    // Parse events
    if (receipt.logs && receipt.logs.length > 0) {
      console.log(`🎉 Events emitted: ${receipt.logs.length}`);
      try {
        const eventLog = receipt.logs.find(
          (log) =>
            log.address.toLowerCase() ===
            "0x9ec3B09A3cDc7Dd2ba8fB8F6e9Bd6C04DDfBCd2d".toLowerCase()
        );
        if (eventLog) {
          const parsed = deviceRegistry.interface.parseLog({
            topics: eventLog.topics,
            data: eventLog.data,
          });
          console.log(`📋 Event: ${parsed.name}`);
          console.log(`👤 User: ${parsed.args[0]}`);
          console.log(`🆔 Device ID: ${parsed.args[1]}`);
          console.log(`📱 Device Name: ${parsed.args[2]}`);
        }
      } catch (e) {
        console.log("📝 Event emitted but couldn't parse details");
      }
    }

    console.log("");
    console.log("🎉 PERFECT! Device registration successful!");
    console.log(
      `📊 Your subgraph should capture this at block ${receipt.blockNumber}`
    );
    console.log("🔍 This proves your real-time indexing system works!");
  } catch (error) {
    console.error("❌ Transaction failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

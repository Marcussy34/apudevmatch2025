import { ethers } from "hardhat";

/**
 * Simple transaction to demonstrate real-time subgraph capture
 */
async function main() {
  console.log("🔥 SIMPLE TRANSACTION DEMONSTRATION");
  console.log("Creating blockchain activity for subgraph to capture!");
  console.log("");

  const [deployer] = await ethers.getSigners();
  console.log(`👤 User Address: ${await deployer.getAddress()}`);
  console.log(`⛓️ Network: Oasis Sapphire Testnet`);
  
  // Get current balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Current Balance: ${ethers.formatEther(balance)} ETH`);
  console.log("");

  try {
    // Create a simple transaction - send small amount to self
    console.log("📤 Sending transaction...");
    const tx = await deployer.sendTransaction({
      to: deployer.address,
      value: ethers.parseEther("0.001") // Very small amount
    });
    
    console.log(`   📋 Transaction Hash: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`   🧱 Block Number: ${receipt?.blockNumber}`);
    console.log(`   ⛽ Gas Used: ${receipt?.gasUsed}`);
    console.log(`   ✅ Transaction Status: ${receipt?.status === 1 ? 'Success' : 'Failed'}`);

    console.log("");
    console.log("🎉 SUCCESS! Blockchain activity created!");
    console.log(`📊 Subgraph should detect activity at block ${receipt?.blockNumber}`);
    console.log("🔍 This proves the system is working - Graph Node will see this block!");
    
  } catch (error) {
    console.error("❌ Transaction failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
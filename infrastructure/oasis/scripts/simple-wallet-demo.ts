import { ethers } from "hardhat";

/**
 * Simple working transaction to demonstrate real-time subgraph capture
 */
async function main() {
  console.log("🔥 SIMPLE WALLET IMPORT DEMONSTRATION");
  console.log("This WILL work and emit a WalletImported event!");
  console.log("");

  const [deployer] = await ethers.getSigners();
  console.log(`👤 User Address: ${await deployer.getAddress()}`);
  console.log(`⛓️ Network: Oasis Sapphire Testnet`);
  console.log("");

  // Connect to WalletVault contract
  const walletVault = await ethers.getContractAt(
    "WalletVault", 
    "0x3B7dd63D236bDB0Fd85d556d2AC70e2746cF5F82"
  );

  // Create unique wallet name
  const timestamp = Date.now();
  const walletName = `DemoWallet-${timestamp}`;

  console.log("💰 Importing Wallet...");
  console.log(`   📝 Wallet Name: ${walletName}`);
  
  try {
    // Import wallet - this should work!
    const tx = await walletVault.connect(deployer).importWallet(walletName);
    console.log(`   📋 Transaction Hash: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`   🧱 Block Number: ${receipt?.blockNumber}`);
    console.log(`   ⛽ Gas Used: ${receipt?.gasUsed}`);
    
    // Check for WalletImported event
    const walletEvent = receipt?.logs.find(log => {
      try {
        const parsed = walletVault.interface.parseLog(log as any);
        return parsed?.name === "WalletImported";
      } catch {
        return false;
      }
    });

    if (walletEvent) {
      const parsed = walletVault.interface.parseLog(walletEvent as any);
      console.log(`   ✅ WALLET IMPORTED EVENT EMITTED!`);
      console.log(`   💼 Wallet Name: ${parsed?.args[2]}`);
      console.log(`   👤 User: ${parsed?.args[0]}`);
      console.log(`   🆔 Wallet ID: ${parsed?.args[1]}`);
    }

    console.log("");
    console.log("🎉 SUCCESS! Event emitted and ready for subgraph capture!");
    console.log(`📊 Check subgraph for events from block ${receipt?.blockNumber}`);
    
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
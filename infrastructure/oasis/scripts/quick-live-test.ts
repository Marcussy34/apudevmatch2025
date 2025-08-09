import { ethers } from "ethers";
import {
  wrapEthersProvider,
  wrapEthersSigner,
} from "@oasisprotocol/sapphire-ethers-v6";

async function liveTest() {
  console.log("🚀 LIVE CONTRACT INTERACTION TEST (WITH ENCRYPTION)");
  console.log("=================================");

  // Create base provider
  const baseProvider = new ethers.JsonRpcProvider("https://testnet.sapphire.oasis.io");
  
  // CRITICAL: Wrap provider for automatic encryption
  const provider = wrapEthersProvider(baseProvider);
  
  // CRITICAL: Wrap wallet for encrypted signing
  const baseWallet = new ethers.Wallet("89299a570d0d8959c788417b88f3a214b8d68001fba2eb10672199001caebb7b", provider);
  const wallet = wrapEthersSigner(baseWallet);

  const vaultAddress = "0xB6B183a041D077d5924b340EBF41EE4546fE0bcE";
  const vaultAbi = [
    "function createVault(bytes memory vaultData) external",
    "event VaultCreated(address indexed user, bytes32 indexed vaultId, uint256 timestamp)",
  ];

  const vault = new ethers.Contract(vaultAddress, vaultAbi, wallet);

  console.log("🎯 Creating vault transaction (ENCRYPTED)...");

  try {
    const vaultData = ethers.toUtf8Bytes("Live Test Encrypted Data");
    
    // This call will now be automatically encrypted
    const tx = await vault.createVault(vaultData);

    console.log(`✅ Transaction: ${tx.hash}`);
    console.log("📡 Transaction data was automatically encrypted for Sapphire TEE");

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

async function checkSubgraph() {
  try {
    const response = await fetch("http://localhost:8000/subgraphs/name/grandwarden-vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{ _meta { block { number } } vaults { id } }`,
      }),
    });

    const data = await response.json();
    console.log(`📊 Subgraph Block: ${data.data?._meta?.block?.number || 'unknown'}`);
    console.log(`🏦 Total Vaults: ${data.data?.vaults?.length || 0}`);
  } catch (error) {
    console.error("❌ Subgraph error:", error);
  }
}

async function main() {
  console.log("STEP 1: Check subgraph before");
  await checkSubgraph();

  console.log("");
  console.log("STEP 2: Make transaction");
  await liveTest();

  console.log("");
  console.log("STEP 3: Wait 15 seconds...");
  await new Promise((resolve) => setTimeout(resolve, 15000));

  console.log("");
  console.log("STEP 4: Check subgraph after");
  await checkSubgraph();
}

main().catch(console.error);

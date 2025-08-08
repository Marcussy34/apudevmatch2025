import { ethers } from "ethers";

async function liveTest() {
  console.log("🚀 LIVE CONTRACT INTERACTION TEST");
  console.log("=================================");

  const provider = new ethers.JsonRpcProvider("https://testnet.sapphire.oasis.io");
  const wallet = new ethers.Wallet("89299a570d0d8959c788417b88f3a214b8d68001fba2eb10672199001caebb7b", provider);

  const vaultAddress = "0xB6B183a041D077d5924b340EBF41EE4546fE0bcE";
  const vaultAbi = [
    "function createVault(bytes memory vaultData) external",
    "event VaultCreated(address indexed user, bytes32 indexed vaultId, uint256 timestamp)",
  ];

  const vault = new ethers.Contract(vaultAddress, vaultAbi, wallet);

  console.log("🎯 Creating vault transaction...");

  try {
    const vaultData = ethers.toUtf8Bytes(Live Test );
    const tx = await vault.createVault(vaultData);

    console.log(✅ Transaction: );

    const receipt = await tx.wait();
    console.log(✅ Block: );
    console.log(✅ Gas: );

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
        query: { _meta { block { number } } vaults { id } },
      }),
    });

    const data = await response.json();
    console.log(📊 Subgraph Block: );
    console.log(🏦 Total Vaults: );
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

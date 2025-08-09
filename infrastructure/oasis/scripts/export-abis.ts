import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("📄 Exporting ABIs for Grand Warden contracts...");

  const artifactsDir = "./artifacts/contracts";
  const outputDir = "../subgraph/grandwarden-subgraph/abis";

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const contracts = [
    "GrandWardenVault",
    "WalletVault", 
    "DeviceRegistry",
    "AtomicVaultManager",
    "RecoveryManager",
    "MirrorInbox"
  ];

  for (const contractName of contracts) {
    try {
      const artifactPath = path.join(artifactsDir, `${contractName}.sol`, `${contractName}.json`);
      const outputPath = path.join(outputDir, `${contractName}.json`);
      
      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
        const abi = artifact.abi;
        
        fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));
        console.log(`✅ Exported ${contractName}.json`);
      } else {
        console.log(`❌ Artifact not found: ${artifactPath}`);
      }
    } catch (error) {
      console.error(`❌ Error exporting ${contractName}:`, error);
    }
  }

  console.log("🎉 ABI export complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

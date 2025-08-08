import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentResult {
  contractName: string;
  address: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
}

interface DeploymentSummary {
  network: string;
  chainId: number;
  deployer: string;
  timestamp: string;
  deployments: DeploymentResult[];
  totalGasUsed: string;
}

async function main() {
  console.log("🚀 Starting Grand Warden Phase 1 Deployment to Sapphire...\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("📋 Deployment Information:");
  console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(
    `   Balance: ${ethers.formatEther(
      await ethers.provider.getBalance(deployer.address)
    )} ROSE\n`
  );

  const deployments: DeploymentResult[] = [];
  let totalGasUsed = BigInt(0);

  // Helper function to deploy a contract
  async function deployContract(
    contractName: string,
    constructorArgs: any[] = []
  ) {
    console.log(`⏳ Deploying ${contractName}...`);

    const ContractFactory = await ethers.getContractFactory(contractName);
    const contract = await ContractFactory.deploy(...constructorArgs);

    await contract.waitForDeployment();
    const deploymentTx = contract.deploymentTransaction();

    if (!deploymentTx) {
      throw new Error(
        `Failed to get deployment transaction for ${contractName}`
      );
    }

    const receipt = await deploymentTx.wait();
    if (!receipt) {
      throw new Error(`Failed to get deployment receipt for ${contractName}`);
    }

    const deployment: DeploymentResult = {
      contractName,
      address: await contract.getAddress(),
      transactionHash: deploymentTx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };

    deployments.push(deployment);
    totalGasUsed += receipt.gasUsed;

    console.log(`   ✅ ${contractName} deployed to: ${deployment.address}`);
    console.log(
      `      Gas used: ${ethers.formatUnits(deployment.gasUsed, 0)} units`
    );
    console.log(`      Transaction: ${deployment.transactionHash}\n`);

    return contract;
  }

  try {
    // Deploy core contracts in order of dependencies
    console.log("📦 Phase 1: Core Contract Deployment\n");

    // 1. Deploy GrandWardenVault (Password Vault)
    const grandWardenVault = await deployContract("GrandWardenVault");

    // 2. Deploy WalletVault (Web3 Wallet Management)
    const walletVault = await deployContract("WalletVault");

    // 3. Deploy DeviceRegistry (Device Management)
    const deviceRegistry = await deployContract("DeviceRegistry");

    // 4. Deploy RecoveryManager (Social Recovery)
    const recoveryManager = await deployContract("RecoveryManager");

    // 5. Deploy AtomicVaultManager (Coordinated Operations)
    const atomicVaultManager = await deployContract("AtomicVaultManager");

    console.log("🧪 Verifying deployments...\n");

    // Verify each contract is working
    const tests = [
      {
        name: "GrandWardenVault",
        test: async () => {
          const testData = ethers.encodeBytes32String("test-data");
          const tx = await grandWardenVault.createVault(testData);
          await tx.wait();
          return "✅ Vault creation successful";
        },
      },
      {
        name: "WalletVault",
        test: async () => {
          const encryptedSeed = ethers.encodeBytes32String("test-seed");
          const tx = await walletVault.importSeedPhrase(
            encryptedSeed,
            "Test Wallet"
          );
          await tx.wait();
          return "✅ Wallet import successful";
        },
      },
      {
        name: "DeviceRegistry",
        test: async () => {
          const publicKeyHash = ethers.keccak256(
            ethers.encodeBytes32String("test-key")
          );
          const fingerprint = ethers.encodeBytes32String("test-fingerprint");
          const tx = await deviceRegistry.registerDevice(
            "Test Device",
            publicKeyHash,
            fingerprint
          );
          await tx.wait();
          return "✅ Device registration successful";
        },
      },
      {
        name: "RecoveryManager",
        test: async () => {
          const guardianAddress = ethers.Wallet.createRandom().address;
          const contactHash = ethers.keccak256(
            ethers.toUtf8Bytes("test@guardian.com")
          );
          const tx = await recoveryManager.addGuardian(
            guardianAddress,
            "Test Guardian",
            contactHash
          );
          await tx.wait();
          return "✅ Guardian addition successful";
        },
      },
      {
        name: "AtomicVaultManager",
        test: async () => {
          const stats = await atomicVaultManager.getOperationStats();
          return `✅ Operation stats retrieved: ${stats.total} total operations`;
        },
      },
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        console.log(`   ${result}`);
      } catch (error) {
        console.log(`   ❌ ${test.name} verification failed: ${error}`);
      }
    }

    // Create deployment summary
    const summary: DeploymentSummary = {
      network: network.name,
      chainId: Number(network.chainId),
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      deployments,
      totalGasUsed: totalGasUsed.toString(),
    };

    // Save deployment info to file
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(
      deploymentsDir,
      `deployment-${network.name}-${Date.now()}.json`
    );

    fs.writeFileSync(deploymentFile, JSON.stringify(summary, null, 2));

    // Create latest deployment symlink
    const latestFile = path.join(deploymentsDir, `latest-${network.name}.json`);
    fs.writeFileSync(latestFile, JSON.stringify(summary, null, 2));

    console.log("\n📊 Deployment Summary:");
    console.log(`   Total contracts deployed: ${deployments.length}`);
    console.log(
      `   Total gas used: ${ethers.formatUnits(
        totalGasUsed.toString(),
        0
      )} units`
    );
    console.log(
      `   Estimated cost: ~${ethers.formatEther(
        (totalGasUsed * BigInt(20e9)).toString()
      )} ROSE`
    );
    console.log(`   Deployment file: ${deploymentFile}`);

    console.log("\n🏷️  Contract Addresses:");
    deployments.forEach((deployment) => {
      console.log(`   ${deployment.contractName}: ${deployment.address}`);
    });

    console.log("\n🎉 Phase 1 deployment completed successfully!");
    console.log("\n📋 Next Steps:");
    console.log("   1. Verify contracts on block explorer");
    console.log("   2. Update frontend configuration with new addresses");
    console.log("   3. Deploy subgraph with new contract addresses");
    console.log("   4. Begin Phase 1.5 (Sui infrastructure)");
  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

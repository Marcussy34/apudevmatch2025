import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as sapphire from "@oasisprotocol/sapphire-paratime";

describe("Gas Usage Performance Tests", function () {
  async function deployContracts() {
    const [owner, user1, user2] = await ethers.getSigners();

    // Deploy DeviceRegistry
    const DeviceRegistry = await ethers.getContractFactory("DeviceRegistry");
    const deviceRegistry = await DeviceRegistry.deploy();

    // Deploy WalletVault
    const WalletVault = await ethers.getContractFactory("WalletVault");
    const walletVault = await WalletVault.deploy();

    // Deploy AtomicVaultManager
    const AtomicVaultManager = await ethers.getContractFactory(
      "AtomicVaultManager"
    );
    const atomicVaultManager = await AtomicVaultManager.deploy();

    return {
      owner,
      user1,
      user2,
      deviceRegistry,
      walletVault,
      atomicVaultManager,
    };
  }

  describe("DeviceRegistry Performance", function () {
    it("Should measure gas costs for device registration", async function () {
      const { deviceRegistry, user1 } = await loadFixture(deployContracts);

      const deviceName = "Test Device";
      const publicKey = ethers.randomBytes(64);
      const fingerprint = ethers.randomBytes(32);

      const tx = await deviceRegistry
        .connect(user1)
        .registerDevice(deviceName, publicKey, fingerprint);
      const receipt = await tx.wait();

      console.log(`Device Registration Gas Used: ${receipt?.gasUsed}`);
      expect(receipt?.gasUsed).to.be.lessThan(500000); // Should be under 500k gas
    });

    it("Should measure authentication performance", async function () {
      const { deviceRegistry, user1 } = await loadFixture(deployContracts);

      // First register a device
      const deviceName = "Test Device";
      const publicKey = ethers.randomBytes(64);
      const fingerprint = ethers.randomBytes(32);

      const registerTx = await deviceRegistry
        .connect(user1)
        .registerDevice(deviceName, publicKey, fingerprint);
      const registerReceipt = await registerTx.wait();

      const deviceId =
        registerReceipt?.logs[0] && "data" in registerReceipt.logs[0]
          ? ethers.AbiCoder.defaultAbiCoder().decode(
              ["bytes32"],
              registerReceipt.logs[0].data
            )[0]
          : ethers.ZeroHash;

      // Authenticate device
      const challenge = ethers.randomBytes(32);
      const signature = ethers.randomBytes(64);

      const authTx = await deviceRegistry
        .connect(user1)
        .authenticateDevice(deviceId, challenge, signature);
      const authReceipt = await authTx.wait();

      console.log(`Device Authentication Gas Used: ${authReceipt?.gasUsed}`);
      expect(authReceipt?.gasUsed).to.be.lessThan(200000); // Should be under 200k gas
    });
  });

  describe("WalletVault Performance", function () {
    it("Should measure wallet import performance", async function () {
      const { walletVault, user1 } = await loadFixture(deployContracts);

      const encryptedSeed = ethers.randomBytes(64);
      const walletName = "Performance Test Wallet";

      const tx = await walletVault
        .connect(user1)
        .importSeedPhrase(encryptedSeed, walletName);
      const receipt = await tx.wait();

      console.log(`Wallet Import Gas Used: ${receipt?.gasUsed}`);
      expect(receipt?.gasUsed).to.be.lessThan(400000); // Should be under 400k gas
    });

    it("Should measure key derivation performance", async function () {
      const { walletVault, user1 } = await loadFixture(deployContracts);

      // First import a wallet
      const encryptedSeed = ethers.randomBytes(64);
      const walletName = "Performance Test Wallet";

      const importTx = await walletVault
        .connect(user1)
        .importSeedPhrase(encryptedSeed, walletName);
      const importReceipt = await importTx.wait();

      const walletId =
        importReceipt?.logs[0] && "data" in importReceipt.logs[0]
          ? ethers.AbiCoder.defaultAbiCoder().decode(
              ["bytes32"],
              importReceipt.logs[0].data
            )[0]
          : ethers.ZeroHash;

      // Derive keys for multiple chains
      const chainTypes = [1, 2, 3]; // Ethereum, Polygon, BSC

      const deriveTx = await walletVault
        .connect(user1)
        .deriveKeysFromSeed(walletId, chainTypes);
      const deriveReceipt = await deriveTx.wait();

      console.log(
        `Key Derivation (3 chains) Gas Used: ${deriveReceipt?.gasUsed}`
      );
      expect(deriveReceipt?.gasUsed).to.be.lessThan(300000); // Should be under 300k gas
    });

    it("Should measure transaction signing performance", async function () {
      const { walletVault, user1 } = await loadFixture(deployContracts);

      // Import wallet and derive keys
      const encryptedSeed = ethers.randomBytes(64);
      const walletName = "Performance Test Wallet";

      const importTx = await walletVault
        .connect(user1)
        .importSeedPhrase(encryptedSeed, walletName);
      const importReceipt = await importTx.wait();

      const walletId =
        importReceipt?.logs[0] && "data" in importReceipt.logs[0]
          ? ethers.AbiCoder.defaultAbiCoder().decode(
              ["bytes32"],
              importReceipt.logs[0].data
            )[0]
          : ethers.ZeroHash;

      await walletVault.connect(user1).deriveKeysFromSeed(walletId, [1]); // Ethereum

      // Sign transaction
      const txHash = ethers.randomBytes(32);
      const txData = ethers.randomBytes(128);

      const signTx = await walletVault
        .connect(user1)
        .signTransaction(walletId, 1, txHash, txData);
      const signReceipt = await signTx.wait();

      console.log(`Transaction Signing Gas Used: ${signReceipt?.gasUsed}`);
      expect(signReceipt?.gasUsed).to.be.lessThan(250000); // Should be under 250k gas
    });
  });

  describe("AtomicVaultManager Performance", function () {
    it("Should measure atomic update performance", async function () {
      const { atomicVaultManager, user1 } = await loadFixture(deployContracts);

      const vaultId = ethers.randomBytes(32);
      const vaultData = ethers.randomBytes(1024); // 1KB of data

      const tx = await atomicVaultManager
        .connect(user1)
        .executeAtomicUpdate(vaultId, vaultData);
      const receipt = await tx.wait();

      console.log(`Atomic Update Gas Used: ${receipt?.gasUsed}`);
      expect(receipt?.gasUsed).to.be.lessThan(600000); // Should be under 600k gas
    });
  });

  describe("Deployment Costs", function () {
    it("Should measure contract deployment costs", async function () {
      // Deploy fresh contracts to measure deployment costs
      const DeviceRegistry = await ethers.getContractFactory("DeviceRegistry");
      const deviceRegistryDeploy = await DeviceRegistry.getDeployTransaction();
      console.log(
        `DeviceRegistry Deployment Gas Estimate: ${deviceRegistryDeploy.gasLimit}`
      );

      const WalletVault = await ethers.getContractFactory("WalletVault");
      const walletVaultDeploy = await WalletVault.getDeployTransaction();
      console.log(
        `WalletVault Deployment Gas Estimate: ${walletVaultDeploy.gasLimit}`
      );

      const AtomicVaultManager = await ethers.getContractFactory(
        "AtomicVaultManager"
      );
      const atomicVaultManagerDeploy =
        await AtomicVaultManager.getDeployTransaction();
      console.log(
        `AtomicVaultManager Deployment Gas Estimate: ${atomicVaultManagerDeploy.gasLimit}`
      );

      // All contracts should deploy under 5M gas
      expect(deviceRegistryDeploy.gasLimit).to.be.lessThan(5000000);
      expect(walletVaultDeploy.gasLimit).to.be.lessThan(5000000);
      expect(atomicVaultManagerDeploy.gasLimit).to.be.lessThan(5000000);
    });
  });

  describe("Bulk Operations Performance", function () {
    it("Should measure bulk device registration performance", async function () {
      const { deviceRegistry, user1 } = await loadFixture(deployContracts);

      const batchSize = 5;
      const startTime = Date.now();

      for (let i = 0; i < batchSize; i++) {
        const deviceName = `Bulk Device ${i}`;
        const publicKey = ethers.randomBytes(64);
        const fingerprint = ethers.randomBytes(32);

        await deviceRegistry
          .connect(user1)
          .registerDevice(deviceName, publicKey, fingerprint);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      console.log(
        `Bulk Registration (${batchSize} devices) Total Time: ${totalTime}ms`
      );
      console.log(`Average Time per Device: ${totalTime / batchSize}ms`);

      // Should process devices reasonably fast
      expect(totalTime / batchSize).to.be.lessThan(5000); // Less than 5s per device
    });
  });
});

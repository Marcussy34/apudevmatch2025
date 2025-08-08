import { expect } from "chai";
import { ethers } from "hardhat";
import { AtomicVaultManager } from "../typechain-types";

describe("AtomicVaultManager", function () {
  let atomicVaultManager: AtomicVaultManager;
  let owner: any;
  let user: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const AtomicVaultManager = await ethers.getContractFactory("AtomicVaultManager");
    atomicVaultManager = await AtomicVaultManager.deploy();
  });

  describe("Atomic Operations", function () {
    it("Should execute atomic vault update", async function () {
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("test-vault"));
      const vaultData = ethers.toUtf8Bytes("test vault data");

      await expect(
        atomicVaultManager.connect(user).executeAtomicUpdate(vaultId, vaultData)
      ).to.emit(atomicVaultManager, "AtomicUpdateStarted");
    });

    it("Should verify atomic completion", async function () {
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("test-vault"));
      const vaultData = ethers.toUtf8Bytes("test vault data");

      const result = await atomicVaultManager.connect(user).executeAtomicUpdate.staticCall(vaultId, vaultData);
      const [walrusCID, suiTxHash] = result;

      const isCompleted = await atomicVaultManager.verifyAtomicCompletion(vaultId, walrusCID, suiTxHash);
      expect(isCompleted).to.be.false; // Will be false since we haven't actually executed
    });

    it("Should get operation statistics", async function () {
      const stats = await atomicVaultManager.getOperationStats();
      expect(stats.total).to.equal(0);
      expect(stats.successful).to.equal(0);
      expect(stats.failed).to.equal(0);
    });

    it("Should handle vault operations", async function () {
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("test-vault"));
      const operations = await atomicVaultManager.getVaultOperations(vaultId);
      expect(operations).to.have.length(0);
    });

    it("Should handle user operations", async function () {
      const userAddress = await user.getAddress();
      const operations = await atomicVaultManager.getUserOperations(userAddress);
      expect(operations).to.have.length(0);
    });

    it("Should get pending operations", async function () {
      const userAddress = await user.getAddress();
      const pendingOps = await atomicVaultManager.getPendingOperations(userAddress);
      expect(pendingOps).to.have.length(0);
    });
  });

  describe("Configuration Management", function () {
    it("Should allow owner to update Walrus config", async function () {
      await atomicVaultManager.connect(owner).updateWalrusConfig(
        "https://new-walrus-endpoint.com",
        ethers.keccak256(ethers.toUtf8Bytes("new-api-key")),
        20 * 1024 * 1024, // 20MB
        10 // epochs
      );
    });

    it("Should allow owner to update Sui config", async function () {
      await atomicVaultManager.connect(owner).updateSuiConfig(
        "https://new-sui-endpoint.com",
        ethers.keccak256(ethers.toUtf8Bytes("new-package-id")),
        ethers.keccak256(ethers.toUtf8Bytes("new-module-id")),
        20000000 // gas limit
      );
    });

    it("Should allow owner to update operation config", async function () {
      await atomicVaultManager.connect(owner).updateOperationConfig(
        600, // 10 minutes timeout
        5, // max retries
        60, // retry delay
        false // require confirmation
      );
    });

    it("Should prevent non-owner from updating configs", async function () {
      await expect(
        atomicVaultManager.connect(user).updateWalrusConfig(
          "https://malicious-endpoint.com",
          ethers.keccak256(ethers.toUtf8Bytes("malicious-key")),
          1024,
          1
        )
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Operation Control", function () {
    it("Should allow owner to pause operations", async function () {
      await atomicVaultManager.connect(owner).pauseOperations();
      
      const isPaused = await atomicVaultManager.isOperationsPaused();
      expect(isPaused).to.be.true;

      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("test-vault"));
      const vaultData = ethers.toUtf8Bytes("test vault data");

      await expect(
        atomicVaultManager.connect(user).executeAtomicUpdate(vaultId, vaultData)
      ).to.be.revertedWith("Contract is paused");
    });

    it("Should allow owner to resume operations", async function () {
      await atomicVaultManager.connect(owner).pauseOperations();
      await atomicVaultManager.connect(owner).resumeOperations();
      
      const isPaused = await atomicVaultManager.isOperationsPaused();
      expect(isPaused).to.be.false;
    });

    it("Should allow owner to cleanup expired operations", async function () {
      await atomicVaultManager.connect(owner).cleanupExpiredOperations(86400); // 1 day
    });

    it("Should prevent non-owner from operation control", async function () {
      await expect(
        atomicVaultManager.connect(user).pauseOperations()
      ).to.be.revertedWith("Not authorized");

      await expect(
        atomicVaultManager.connect(user).resumeOperations()
      ).to.be.revertedWith("Not authorized");

      await expect(
        atomicVaultManager.connect(user).cleanupExpiredOperations(86400)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Input Validation", function () {
    it("Should reject invalid vault ID", async function () {
      const vaultData = ethers.toUtf8Bytes("test vault data");

      await expect(
        atomicVaultManager.connect(user).executeAtomicUpdate(ethers.ZeroHash, vaultData)
      ).to.be.revertedWith("Invalid vault ID");
    });

    it("Should reject empty vault data", async function () {
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("test-vault"));

      await expect(
        atomicVaultManager.connect(user).executeAtomicUpdate(vaultId, "0x")
      ).to.be.revertedWith("Empty vault data");
    });
  });

  describe("Event Emissions", function () {
    it("Should emit vault events", async function () {
      await atomicVaultManager.emitVaultEvent(
        await user.getAddress(),
        1,
        ethers.toUtf8Bytes("test data")
      );
    });

    it("Should emit user flow events", async function () {
      await atomicVaultManager.emitUserFlowEvent(
        await user.getAddress(),
        1, // flow type
        1, // step
        true, // success
        ethers.toUtf8Bytes("test data")
      );
    });
  });
});
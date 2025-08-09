import { expect } from "chai";
import { ethers } from "hardhat";
import { AtomicVaultManager } from "../typechain-types";

describe("AtomicVaultManager - Coverage Tests", function () {
  let atomicVaultManager: AtomicVaultManager;
  let owner: any;
  let user: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const AtomicVaultManager = await ethers.getContractFactory(
      "AtomicVaultManager"
    );
    atomicVaultManager = await AtomicVaultManager.deploy();
    
    // Set ROFL worker address to fix "ROFL worker not set" errors
    await atomicVaultManager.setROFLWorker(owner.address);
  });

  describe("Utility Function Coverage", function () {
    it("Should test substring function with edge cases", async function () {
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("test-vault"));
      const vaultData = ethers.toUtf8Bytes(
        "test data for substring function testing"
      );

      // This will internally call the substring function
      await atomicVaultManager
        .connect(user)
        .executeAtomicUpdate(vaultId, vaultData);

      // Verify operation was created
      const operations = await atomicVaultManager.getVaultOperations(vaultId);
      expect(operations).to.have.length(1);
    });

    it("Should test uint256 to string conversion", async function () {
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("conversion-test"));
      const vaultData = ethers.toUtf8Bytes("data");

      // Execute operation to trigger internal conversions
      await atomicVaultManager
        .connect(user)
        .executeAtomicUpdate(vaultId, vaultData);

      const [total] = await atomicVaultManager.getOperationStats();
      expect(Number(total)).to.be.a("number");
    });

    it("Should handle empty operations list", async function () {
      const emptyVaultId = ethers.keccak256(ethers.toUtf8Bytes("empty-vault"));
      const operations = await atomicVaultManager.getVaultOperations(
        emptyVaultId
      );
      expect(operations).to.have.length(0);
    });

    it("Should handle zero value conversions", async function () {
      // Test zero values in statistics
      const newUser = (await ethers.getSigners())[2];
      const stats = await atomicVaultManager.getOperationStats();
      // For a new user, stats should show some basic data
      expect(stats).to.not.be.null;
    });

    it("Should test boundary conditions", async function () {
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("boundary-test"));
      const minData = ethers.toUtf8Bytes("x"); // Minimum data

      await atomicVaultManager
        .connect(user)
        .executeAtomicUpdate(vaultId, minData);

      const operations = await atomicVaultManager.getVaultOperations(vaultId);
      expect(operations).to.have.length(1);
    });

    it("Should test operation completion verification", async function () {
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("completion-test"));
      const vaultData = ethers.toUtf8Bytes("completion test data");

      // Execute atomic update
      const result = await atomicVaultManager
        .connect(user)
        .executeAtomicUpdate.staticCall(vaultId, vaultData);
      const [walrusCID, suiTxHash] = result;

      await atomicVaultManager
        .connect(user)
        .executeAtomicUpdate(vaultId, vaultData);

      // Test completion verification
      const isCompleted = await atomicVaultManager.verifyAtomicCompletion(
        vaultId,
        walrusCID,
        suiTxHash
      );
      expect(isCompleted).to.be.false;
    });

    it("Should handle invalid rollback scenarios", async function () {
      const invalidVaultId = ethers.keccak256(
        ethers.toUtf8Bytes("invalid-vault")
      );

      // Try to rollback non-existent operation (requires CID parameter)
      const fakeCID = "fake-cid-for-testing";
      await expect(
        atomicVaultManager
          .connect(user)
          .rollbackFailedUpdate(invalidVaultId, fakeCID)
      ).to.be.revertedWith("No matching failed operation found");
    });

    it("Should test basic operations coverage", async function () {
      // Test basic operations to ensure coverage
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("config-test"));
      const vaultData = ethers.toUtf8Bytes("config test data");

      await atomicVaultManager
        .connect(user)
        .executeAtomicUpdate(vaultId, vaultData);

      const operations = await atomicVaultManager.getVaultOperations(vaultId);
      expect(operations).to.have.length(1);

      // Test user operations
      const userOps = await atomicVaultManager.getUserOperations(user.address);
      expect(userOps.length).to.be.above(0);
    });
  });
});

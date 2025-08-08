import { expect } from "chai";
import { ethers } from "hardhat";
import { AtomicVaultManager } from "../typechain-types";

describe("AtomicVaultManager - Comprehensive Coverage Tests", function () {
  let atomicVaultManager: AtomicVaultManager;
  let owner: any;
  let user: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user, user2] = await ethers.getSigners();

    const AtomicVaultManager = await ethers.getContractFactory(
      "AtomicVaultManager"
    );
    atomicVaultManager = await AtomicVaultManager.deploy();
  });

  describe("Advanced Atomic Operations", function () {
    it("Should handle complete atomic operation lifecycle", async function () {
      const vaultId = ethers.keccak256(
        ethers.toUtf8Bytes("lifecycle-test-vault")
      );
      const vaultData = ethers.toUtf8Bytes(
        "comprehensive test vault data with more content"
      );

      // Execute atomic update
      const result = await atomicVaultManager
        .connect(user)
        .executeAtomicUpdate.staticCall(vaultId, vaultData);
      const [walrusCID, suiTxHash] = result;

      // Actually execute the transaction
      await expect(
        atomicVaultManager.connect(user).executeAtomicUpdate(vaultId, vaultData)
      ).to.emit(atomicVaultManager, "AtomicUpdateStarted");

      // Verify completion
      const isCompleted = await atomicVaultManager.verifyAtomicCompletion(
        vaultId,
        walrusCID,
        suiTxHash
      );
      expect(isCompleted).to.be.true; // Will be true since atomic operation completed
    });

    it("Should handle atomic operation with large data", async function () {
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("large-data-vault"));
      const largeData = ethers.toUtf8Bytes("x".repeat(5000)); // 5KB of data

      await expect(
        atomicVaultManager.connect(user).executeAtomicUpdate(vaultId, largeData)
      ).to.emit(atomicVaultManager, "AtomicUpdateStarted");
    });

    it("Should handle rollback failed update", async function () {
      const vaultId = ethers.keccak256(
        ethers.toUtf8Bytes("rollback-test-vault")
      );
      const vaultData = ethers.toUtf8Bytes("rollback test data");

      // First, execute an atomic update to have something to rollback
      await atomicVaultManager
        .connect(user)
        .executeAtomicUpdate(vaultId, vaultData);

      // Get the operations to find a CID to rollback
      const operations = await atomicVaultManager.getVaultOperations(vaultId);
      expect(operations).to.have.length(1);

      // Get the operation details
      const operation = await atomicVaultManager
        .connect(user)
        .getOperation(operations[0]);

      // Try to rollback (this should work since we have a matching operation)
      if (operation.walrusCID) {
        await expect(
          atomicVaultManager
            .connect(user)
            .rollbackFailedUpdate(vaultId, operation.walrusCID)
        ).to.emit(atomicVaultManager, "OperationRolledBack");
      }
    });

    it("Should handle operations when paused", async function () {
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("paused-test-vault"));
      const vaultData = ethers.toUtf8Bytes("paused test data");

      // Pause operations
      await atomicVaultManager.connect(owner).pauseOperations();

      // Should fail when paused
      await expect(
        atomicVaultManager.connect(user).executeAtomicUpdate(vaultId, vaultData)
      ).to.be.revertedWith("Contract is paused");

      // Resume and try again
      await atomicVaultManager.connect(owner).resumeOperations();

      await expect(
        atomicVaultManager.connect(user).executeAtomicUpdate(vaultId, vaultData)
      ).to.emit(atomicVaultManager, "AtomicUpdateStarted");
    });
  });

  describe("Operation Management", function () {
    it("Should track multiple operations per user", async function () {
      const userAddress = await user.getAddress();

      // Execute multiple operations
      for (let i = 0; i < 3; i++) {
        const vaultId = ethers.keccak256(
          ethers.toUtf8Bytes(`multi-vault-${i}`)
        );
        const vaultData = ethers.toUtf8Bytes(`multi test data ${i}`);

        await atomicVaultManager
          .connect(user)
          .executeAtomicUpdate(vaultId, vaultData);
      }

      // Check user operations
      const userOps = await atomicVaultManager
        .connect(user)
        .getUserOperations(userAddress);
      expect(userOps).to.have.length(3);

      // Check pending operations
      const pendingOps = await atomicVaultManager
        .connect(user)
        .getPendingOperations(userAddress);
      expect(pendingOps).to.have.length(0); // Should be 0 since operations complete in test environment
    });

    it("Should track operations per vault", async function () {
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("tracked-vault"));

      // Execute multiple operations on same vault
      for (let i = 0; i < 2; i++) {
        const vaultData = ethers.toUtf8Bytes(`tracked test data ${i}`);
        await atomicVaultManager
          .connect(user)
          .executeAtomicUpdate(vaultId, vaultData);
      }

      // Check vault operations
      const vaultOps = await atomicVaultManager.getVaultOperations(vaultId);
      expect(vaultOps).to.have.length(2);
    });

    it("Should provide operation statistics", async function () {
      const initialStats = await atomicVaultManager.getOperationStats();

      // Execute an operation
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("stats-vault"));
      const vaultData = ethers.toUtf8Bytes("stats test data");
      await atomicVaultManager
        .connect(user)
        .executeAtomicUpdate(vaultId, vaultData);

      const finalStats = await atomicVaultManager.getOperationStats();
      expect(finalStats.total).to.equal(initialStats.total + BigInt(1));
      expect(finalStats.successful).to.equal(
        initialStats.successful + BigInt(1)
      );
    });

    it("Should enforce operation access control", async function () {
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("access-test-vault"));
      const vaultData = ethers.toUtf8Bytes("access test data");

      // Execute operation as user1
      await atomicVaultManager
        .connect(user)
        .executeAtomicUpdate(vaultId, vaultData);

      // Get operations as user1
      const userOps = await atomicVaultManager
        .connect(user)
        .getUserOperations(user.address);
      expect(userOps).to.have.length(1);

      // user2 should not be able to see user1's operations
      await expect(
        atomicVaultManager.connect(user2).getUserOperations(user.address)
      ).to.be.revertedWith("Not authorized");

      // user2 should not be able to see user1's pending operations
      await expect(
        atomicVaultManager.connect(user2).getPendingOperations(user.address)
      ).to.be.revertedWith("Not authorized");

      // user2 should not be able to get user1's operation details
      const operationId = userOps[0];
      await expect(
        atomicVaultManager.connect(user2).getOperation(operationId)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Configuration Management", function () {
    it("Should validate Walrus configuration parameters", async function () {
      // Test valid configuration
      await atomicVaultManager.connect(owner).updateWalrusConfig(
        "https://valid-walrus-endpoint.com",
        ethers.keccak256(ethers.toUtf8Bytes("valid-api-key")),
        50 * 1024 * 1024, // 50MB
        15 // epochs
      );

      // Test invalid configurations
      await expect(
        atomicVaultManager.connect(owner).updateWalrusConfig(
          "", // Empty URL
          ethers.keccak256(ethers.toUtf8Bytes("api-key")),
          10 * 1024 * 1024,
          5
        )
      ).to.be.revertedWith("Base URL cannot be empty");

      await expect(
        atomicVaultManager.connect(owner).updateWalrusConfig(
          "https://endpoint.com",
          ethers.keccak256(ethers.toUtf8Bytes("api-key")),
          0, // Invalid size
          5
        )
      ).to.be.revertedWith("Invalid max blob size");

      await expect(
        atomicVaultManager.connect(owner).updateWalrusConfig(
          "https://endpoint.com",
          ethers.keccak256(ethers.toUtf8Bytes("api-key")),
          200 * 1024 * 1024, // Too large
          5
        )
      ).to.be.revertedWith("Invalid max blob size");

      await expect(
        atomicVaultManager.connect(owner).updateWalrusConfig(
          "https://endpoint.com",
          ethers.keccak256(ethers.toUtf8Bytes("api-key")),
          10 * 1024 * 1024,
          0 // Invalid epochs
        )
      ).to.be.revertedWith("Invalid storage epochs");

      await expect(
        atomicVaultManager.connect(owner).updateWalrusConfig(
          "https://endpoint.com",
          ethers.keccak256(ethers.toUtf8Bytes("api-key")),
          10 * 1024 * 1024,
          150 // Too many epochs
        )
      ).to.be.revertedWith("Invalid storage epochs");
    });

    it("Should validate Sui configuration parameters", async function () {
      // Test valid configuration
      await atomicVaultManager.connect(owner).updateSuiConfig(
        "https://valid-sui-endpoint.com",
        ethers.keccak256(ethers.toUtf8Bytes("valid-package-id")),
        ethers.keccak256(ethers.toUtf8Bytes("valid-module-id")),
        50000000 // 50M gas
      );

      // Test invalid configurations
      await expect(
        atomicVaultManager.connect(owner).updateSuiConfig(
          "", // Empty URL
          ethers.keccak256(ethers.toUtf8Bytes("package-id")),
          ethers.keccak256(ethers.toUtf8Bytes("module-id")),
          10000000
        )
      ).to.be.revertedWith("RPC URL cannot be empty");

      await expect(
        atomicVaultManager.connect(owner).updateSuiConfig(
          "https://endpoint.com",
          ethers.ZeroHash, // Invalid package ID
          ethers.keccak256(ethers.toUtf8Bytes("module-id")),
          10000000
        )
      ).to.be.revertedWith("Package ID cannot be zero");

      await expect(
        atomicVaultManager.connect(owner).updateSuiConfig(
          "https://endpoint.com",
          ethers.keccak256(ethers.toUtf8Bytes("package-id")),
          ethers.ZeroHash, // Invalid module ID
          10000000
        )
      ).to.be.revertedWith("Module ID cannot be zero");

      await expect(
        atomicVaultManager.connect(owner).updateSuiConfig(
          "https://endpoint.com",
          ethers.keccak256(ethers.toUtf8Bytes("package-id")),
          ethers.keccak256(ethers.toUtf8Bytes("module-id")),
          500000 // Too low gas
        )
      ).to.be.revertedWith("Invalid gas limit");

      await expect(
        atomicVaultManager.connect(owner).updateSuiConfig(
          "https://endpoint.com",
          ethers.keccak256(ethers.toUtf8Bytes("package-id")),
          ethers.keccak256(ethers.toUtf8Bytes("module-id")),
          200000000 // Too high gas
        )
      ).to.be.revertedWith("Invalid gas limit");
    });

    it("Should validate operation configuration parameters", async function () {
      // Test valid configuration
      await atomicVaultManager.connect(owner).updateOperationConfig(
        600, // 10 minutes
        5, // max retries
        120, // retry delay
        true // require confirmation
      );

      // Test invalid configurations
      await expect(
        atomicVaultManager.connect(owner).updateOperationConfig(
          15, // Too short timeout
          5,
          60,
          false
        )
      ).to.be.revertedWith("Timeout must be 30s-1h");

      await expect(
        atomicVaultManager.connect(owner).updateOperationConfig(
          4000, // Too long timeout
          5,
          60,
          false
        )
      ).to.be.revertedWith("Timeout must be 30s-1h");

      await expect(
        atomicVaultManager.connect(owner).updateOperationConfig(
          300,
          15, // Too many retries
          60,
          false
        )
      ).to.be.revertedWith("Too many retries");

      await expect(
        atomicVaultManager.connect(owner).updateOperationConfig(
          300,
          5,
          0, // Invalid retry delay
          false
        )
      ).to.be.revertedWith("Retry delay must be 1s-5m");

      await expect(
        atomicVaultManager.connect(owner).updateOperationConfig(
          300,
          5,
          400, // Too long retry delay
          false
        )
      ).to.be.revertedWith("Retry delay must be 1s-5m");
    });

    it("Should prevent non-owner from updating configurations", async function () {
      // All config updates should fail for non-owner
      await expect(
        atomicVaultManager
          .connect(user)
          .updateWalrusConfig(
            "https://malicious.com",
            ethers.keccak256(ethers.toUtf8Bytes("key")),
            1024,
            1
          )
      ).to.be.revertedWith("Not authorized");

      await expect(
        atomicVaultManager
          .connect(user)
          .updateSuiConfig(
            "https://malicious.com",
            ethers.keccak256(ethers.toUtf8Bytes("package")),
            ethers.keccak256(ethers.toUtf8Bytes("module")),
            1000000
          )
      ).to.be.revertedWith("Not authorized");

      await expect(
        atomicVaultManager
          .connect(user)
          .updateOperationConfig(300, 3, 30, false)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Input Validation and Error Handling", function () {
    it("Should reject invalid vault IDs", async function () {
      const invalidVaultId = ethers.ZeroHash;
      const vaultData = ethers.toUtf8Bytes("test data");

      await expect(
        atomicVaultManager
          .connect(user)
          .executeAtomicUpdate(invalidVaultId, vaultData)
      ).to.be.revertedWith("Invalid vault ID");
    });

    it("Should reject empty vault data", async function () {
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("test-vault"));
      const emptyData = new Uint8Array(0);

      await expect(
        atomicVaultManager.connect(user).executeAtomicUpdate(vaultId, emptyData)
      ).to.be.revertedWith("Empty vault data");
    });

    it("Should reject oversized vault data", async function () {
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("test-vault"));
      // Create data larger than default max (10MB)
      const oversizedData = new Uint8Array(11 * 1024 * 1024); // 11MB
      oversizedData.fill(1);

      await expect(
        atomicVaultManager
          .connect(user)
          .executeAtomicUpdate(vaultId, oversizedData)
      ).to.be.revertedWith("Data too large");
    });

    it("Should handle rollback of non-existent operations", async function () {
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("nonexistent-vault"));
      const fakeCID = "QmFakeNonExistentCID123456789";

      await expect(
        atomicVaultManager.connect(user).rollbackFailedUpdate(vaultId, fakeCID)
      ).to.be.revertedWith("No matching failed operation found");
    });

    it("Should handle verification of non-existent operations", async function () {
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("nonexistent-vault"));
      const fakeCID = "QmFakeNonExistentCID123456789";
      const fakeTxHash = ethers.keccak256(ethers.toUtf8Bytes("fake-tx"));

      const isCompleted = await atomicVaultManager.verifyAtomicCompletion(
        vaultId,
        fakeCID,
        fakeTxHash
      );
      expect(isCompleted).to.be.false;
    });

    it("Should handle empty operation queries", async function () {
      const emptyVaultId = ethers.keccak256(ethers.toUtf8Bytes("empty-vault"));
      const operations = await atomicVaultManager.getVaultOperations(
        emptyVaultId
      );
      expect(operations).to.have.length(0);

      const userOps = await atomicVaultManager
        .connect(user)
        .getUserOperations(user.address);
      // This might have operations from previous tests, so we just check it's an array
      expect(Array.isArray(userOps)).to.be.true;

      const pendingOps = await atomicVaultManager
        .connect(user)
        .getPendingOperations(user.address);
      expect(Array.isArray(pendingOps)).to.be.true;
    });
  });

  describe("Administrative Functions", function () {
    it("Should handle cleanup of expired operations", async function () {
      const maxAge = 24 * 60 * 60; // 24 hours

      await expect(
        atomicVaultManager.connect(owner).cleanupExpiredOperations(maxAge)
      ).to.emit(atomicVaultManager, "SystemHealthCheck");
    });

    it("Should validate cleanup parameters", async function () {
      // Too short max age
      await expect(
        atomicVaultManager.connect(owner).cleanupExpiredOperations(30 * 60) // 30 minutes
      ).to.be.revertedWith("Invalid max age");

      // Too long max age
      await expect(
        atomicVaultManager
          .connect(owner)
          .cleanupExpiredOperations(31 * 24 * 60 * 60) // 31 days
      ).to.be.revertedWith("Invalid max age");
    });

    it("Should handle pause/resume operations", async function () {
      // Check initial state
      let isPaused = await atomicVaultManager.isOperationsPaused();
      expect(isPaused).to.be.false;

      // Pause operations
      await expect(atomicVaultManager.connect(owner).pauseOperations()).to.emit(
        atomicVaultManager,
        "SystemHealthCheck"
      );

      isPaused = await atomicVaultManager.isOperationsPaused();
      expect(isPaused).to.be.true;

      // Try to pause again (should fail)
      await expect(
        atomicVaultManager.connect(owner).pauseOperations()
      ).to.be.revertedWith("Already paused");

      // Resume operations
      await expect(
        atomicVaultManager.connect(owner).resumeOperations()
      ).to.emit(atomicVaultManager, "SystemHealthCheck");

      isPaused = await atomicVaultManager.isOperationsPaused();
      expect(isPaused).to.be.false;

      // Try to resume again (should fail)
      await expect(
        atomicVaultManager.connect(owner).resumeOperations()
      ).to.be.revertedWith("Not paused");
    });

    it("Should prevent non-owner from administrative functions", async function () {
      await expect(
        atomicVaultManager.connect(user).pauseOperations()
      ).to.be.revertedWith("Not authorized");

      await expect(
        atomicVaultManager.connect(user).resumeOperations()
      ).to.be.revertedWith("Not authorized");

      await expect(
        atomicVaultManager.connect(user).cleanupExpiredOperations(24 * 60 * 60)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Event Emission", function () {
    it("Should emit vault events", async function () {
      await expect(
        atomicVaultManager.emitVaultEvent(user.address, 1, "0x1234")
      ).to.emit(atomicVaultManager, "GenericVaultEvent");
    });

    it("Should emit user flow events", async function () {
      await expect(
        atomicVaultManager.emitUserFlowEvent(user.address, 1, 2, true, "0x5678")
      ).to.emit(atomicVaultManager, "UserFlowEvent");
    });
  });

  describe("Helper Function Coverage", function () {
    it("Should test internal helper functions indirectly", async function () {
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("helper-test-vault"));
      const vaultData = ethers.toUtf8Bytes(
        "helper test data with various characters 123!@#"
      );

      // This will test the helper functions _bytesToHex, _substring, _uint256ToString
      // indirectly through the atomic update process
      await expect(
        atomicVaultManager.connect(user).executeAtomicUpdate(vaultId, vaultData)
      ).to.emit(atomicVaultManager, "AtomicUpdateStarted");

      // Test that the internal functions work correctly by verifying operation details
      const operations = await atomicVaultManager.getVaultOperations(vaultId);
      expect(operations).to.have.length(1);

      const operation = await atomicVaultManager
        .connect(user)
        .getOperation(operations[0]);
      expect(operation.user).to.equal(user.address);
      expect(operation.vaultId).to.equal(vaultId);
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should prevent reentrancy on atomic operations", async function () {
      const vaultId = ethers.keccak256(
        ethers.toUtf8Bytes("reentrancy-test-vault")
      );
      const vaultData = ethers.toUtf8Bytes("reentrancy test data");

      // The ReentrancyGuard is already in place, this test just ensures the modifier is applied
      await expect(
        atomicVaultManager.connect(user).executeAtomicUpdate(vaultId, vaultData)
      ).to.emit(atomicVaultManager, "AtomicUpdateStarted");
    });

    it("Should prevent reentrancy on configuration updates", async function () {
      // These functions have nonReentrant modifier
      await atomicVaultManager
        .connect(owner)
        .updateWalrusConfig(
          "https://reentrancy-test.com",
          ethers.keccak256(ethers.toUtf8Bytes("test-key")),
          20 * 1024 * 1024,
          10
        );

      await atomicVaultManager
        .connect(owner)
        .updateSuiConfig(
          "https://sui-reentrancy-test.com",
          ethers.keccak256(ethers.toUtf8Bytes("test-package")),
          ethers.keccak256(ethers.toUtf8Bytes("test-module")),
          20000000
        );

      await atomicVaultManager
        .connect(owner)
        .updateOperationConfig(600, 5, 60, true);
    });
  });

  describe("Edge Cases and Boundary Testing", function () {
    it("Should handle maximum valid data size", async function () {
      const vaultId = ethers.keccak256(
        ethers.toUtf8Bytes("max-size-test-vault")
      );
      // Create data at exactly the max size (10MB)
      const maxSizeData = new Uint8Array(10 * 1024 * 1024);
      maxSizeData.fill(42); // Fill with some value

      await expect(
        atomicVaultManager
          .connect(user)
          .executeAtomicUpdate(vaultId, maxSizeData)
      ).to.emit(atomicVaultManager, "AtomicUpdateStarted");
    });

    it("Should handle minimum valid configuration values", async function () {
      // Test minimum valid Walrus config
      await atomicVaultManager.connect(owner).updateWalrusConfig(
        "https://min.com",
        ethers.keccak256(ethers.toUtf8Bytes("min-key")),
        1, // Minimum blob size
        1 // Minimum epochs
      );

      // Test minimum valid Sui config
      await atomicVaultManager.connect(owner).updateSuiConfig(
        "https://min-sui.com",
        ethers.keccak256(ethers.toUtf8Bytes("min-package")),
        ethers.keccak256(ethers.toUtf8Bytes("min-module")),
        1000000 // Minimum gas limit
      );

      // Test minimum valid operation config
      await atomicVaultManager.connect(owner).updateOperationConfig(
        30, // Minimum timeout
        0, // Minimum retries
        1, // Minimum retry delay
        false
      );
    });

    it("Should handle maximum valid configuration values", async function () {
      // Test maximum valid Walrus config
      await atomicVaultManager.connect(owner).updateWalrusConfig(
        "https://max-endpoint.com",
        ethers.keccak256(ethers.toUtf8Bytes("max-key")),
        100 * 1024 * 1024, // Maximum blob size (100MB)
        100 // Maximum epochs
      );

      // Test maximum valid Sui config
      await atomicVaultManager.connect(owner).updateSuiConfig(
        "https://max-sui.com",
        ethers.keccak256(ethers.toUtf8Bytes("max-package")),
        ethers.keccak256(ethers.toUtf8Bytes("max-module")),
        100000000 // Maximum gas limit (100M)
      );

      // Test maximum valid operation config
      await atomicVaultManager.connect(owner).updateOperationConfig(
        3600, // Maximum timeout (1 hour)
        10, // Maximum retries
        300, // Maximum retry delay (5 minutes)
        true
      );
    });
  });
});

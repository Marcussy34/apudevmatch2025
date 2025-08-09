import { expect } from "chai";
import { ethers } from "hardhat";
import { RecoveryManager } from "../typechain-types";

describe("RecoveryManager", function () {
  let recoveryManager: RecoveryManager;
  let owner: any;
  let user: any;
  let guardian1: any;
  let guardian2: any;
  let guardian3: any;

  beforeEach(async function () {
    [owner, user, guardian1, guardian2, guardian3] = await ethers.getSigners();

    const RecoveryManager = await ethers.getContractFactory("RecoveryManager");
    recoveryManager = await RecoveryManager.deploy();
  });

  describe("Guardian Management", function () {
    it("Should add guardians", async function () {
      const guardianAddress = await guardian1.getAddress();
      const name = "Guardian 1";
      const contactHash = ethers.keccak256(
        ethers.toUtf8Bytes("contact@guardian1.com")
      );

      await expect(
        recoveryManager
          .connect(user)
          .addGuardian(guardianAddress, name, contactHash)
      ).to.emit(recoveryManager, "GuardianAdded");

      const guardians = await recoveryManager.getUserGuardians(
        await user.getAddress()
      );
      expect(guardians).to.have.length(1);
      expect(guardians[0].guardianAddress).to.equal(guardianAddress);
      expect(guardians[0].name).to.equal(name);
    });

    it("Should prevent adding invalid guardian", async function () {
      const name = "Invalid Guardian";
      const contactHash = ethers.keccak256(
        ethers.toUtf8Bytes("contact@invalid.com")
      );

      await expect(
        recoveryManager
          .connect(user)
          .addGuardian(ethers.ZeroAddress, name, contactHash)
      ).to.be.revertedWith("Invalid guardian address");

      await expect(
        recoveryManager
          .connect(user)
          .addGuardian(await user.getAddress(), name, contactHash)
      ).to.be.revertedWith("Cannot add self as guardian");

      await expect(
        recoveryManager
          .connect(user)
          .addGuardian(await guardian1.getAddress(), "", contactHash)
      ).to.be.revertedWith("Guardian name required");
    });

    it("Should remove guardians", async function () {
      const guardianAddress = await guardian1.getAddress();
      const name = "Guardian 1";
      const contactHash = ethers.keccak256(
        ethers.toUtf8Bytes("contact@guardian1.com")
      );

      await recoveryManager
        .connect(user)
        .addGuardian(guardianAddress, name, contactHash);

      await expect(
        recoveryManager.connect(user).removeGuardian(guardianAddress)
      ).to.emit(recoveryManager, "GuardianRemoved");

      const guardians = await recoveryManager.getUserGuardians(
        await user.getAddress()
      );
      expect(guardians[0].isActive).to.be.false;
    });

    it("Should prevent adding too many guardians", async function () {
      // Add 10 guardians (max)
      for (let i = 0; i < 10; i++) {
        const wallet = ethers.Wallet.createRandom();
        const name = `Guardian ${i}`;
        const contactHash = ethers.keccak256(
          ethers.toUtf8Bytes(`contact${i}@guardian.com`)
        );

        await recoveryManager
          .connect(user)
          .addGuardian(wallet.address, name, contactHash);
      }

      // 11th guardian should fail
      const wallet = ethers.Wallet.createRandom();
      const name = "Guardian 11";
      const contactHash = ethers.keccak256(
        ethers.toUtf8Bytes("contact11@guardian.com")
      );

      await expect(
        recoveryManager
          .connect(user)
          .addGuardian(wallet.address, name, contactHash)
      ).to.be.revertedWith("Too many guardians");
    });

    it("Should prevent duplicate guardians", async function () {
      const guardianAddress = await guardian1.getAddress();
      const name = "Guardian 1";
      const contactHash = ethers.keccak256(
        ethers.toUtf8Bytes("contact@guardian1.com")
      );

      await recoveryManager
        .connect(user)
        .addGuardian(guardianAddress, name, contactHash);

      await expect(
        recoveryManager
          .connect(user)
          .addGuardian(guardianAddress, "Duplicate", contactHash)
      ).to.be.revertedWith("Guardian already exists");
    });
  });

  describe("Recovery Process", function () {
    beforeEach(async function () {
      // Add guardians
      const guardians = [guardian1, guardian2, guardian3];
      for (let i = 0; i < guardians.length; i++) {
        const address = await guardians[i].getAddress();
        const name = `Guardian ${i + 1}`;
        const contactHash = ethers.keccak256(
          ethers.toUtf8Bytes(`contact${i}@guardian.com`)
        );

        await recoveryManager
          .connect(user)
          .addGuardian(address, name, contactHash);
      }
    });

    it("Should initiate recovery", async function () {
      const threshold = 2;
      const encryptedRecoveryData = ethers.toUtf8Bytes(
        "encrypted recovery data"
      );

      await expect(
        recoveryManager
          .connect(user)
          .initiateRecovery(threshold, encryptedRecoveryData)
      ).to.emit(
        recoveryManager,
        "RecoveryInitiated(address,bytes32,uint256)"
      );

      const recoveryRequests = await recoveryManager.getUserRecoveryRequests(
        await user.getAddress()
      );
      expect(recoveryRequests).to.have.length(1);
    });

    it("Should require minimum threshold", async function () {
      const threshold = 1; // Below minimum
      const encryptedRecoveryData = ethers.toUtf8Bytes(
        "encrypted recovery data"
      );

      await expect(
        recoveryManager
          .connect(user)
          .initiateRecovery(threshold, encryptedRecoveryData)
      ).to.be.revertedWith("Threshold too low");
    });

    it("Should require sufficient guardians", async function () {
      const threshold = 5; // More than available guardians
      const encryptedRecoveryData = ethers.toUtf8Bytes(
        "encrypted recovery data"
      );

      await expect(
        recoveryManager
          .connect(user)
          .initiateRecovery(threshold, encryptedRecoveryData)
      ).to.be.revertedWith("Not enough active guardians");
    });

    it("Should allow guardians to approve recovery", async function () {
      const threshold = 2;
      const encryptedRecoveryData = ethers.toUtf8Bytes(
        "encrypted recovery data"
      );

      const initiateRecoveryTx = await recoveryManager
        .connect(user)
        .initiateRecovery(threshold, encryptedRecoveryData);
      const receipt = await initiateRecoveryTx.wait();

      const event = receipt?.logs.find(
        (log) =>
          recoveryManager.interface.parseLog(log as any)?.name ===
          "RecoveryInitiated"
      );
      const parsedEvent = recoveryManager.interface.parseLog(event as any);
      const recoveryId = parsedEvent?.args[1];

      // First guardian approves
      await expect(
        recoveryManager.connect(guardian1).approveRecovery(recoveryId)
      ).to.emit(recoveryManager, "GuardianApproved");

      // Second guardian approves - should complete recovery
      await expect(
        recoveryManager.connect(guardian2).approveRecovery(recoveryId)
      ).to.emit(
        recoveryManager,
        "RecoveryCompleted(address,bytes32,uint256)"
      );
    });

    it("Should prevent non-guardian from approving", async function () {
      const threshold = 2;
      const encryptedRecoveryData = ethers.toUtf8Bytes(
        "encrypted recovery data"
      );

      const initiateRecoveryTx = await recoveryManager
        .connect(user)
        .initiateRecovery(threshold, encryptedRecoveryData);
      const receipt = await initiateRecoveryTx.wait();

      const event = receipt?.logs.find(
        (log) =>
          recoveryManager.interface.parseLog(log as any)?.name ===
          "RecoveryInitiated"
      );
      const parsedEvent = recoveryManager.interface.parseLog(event as any);
      const recoveryId = parsedEvent?.args[1];

      await expect(
        recoveryManager.connect(user).approveRecovery(recoveryId)
      ).to.be.revertedWith("Not an authorized guardian");
    });

    it("Should prevent duplicate approvals", async function () {
      const threshold = 2;
      const encryptedRecoveryData = ethers.toUtf8Bytes(
        "encrypted recovery data"
      );

      const initiateRecoveryTx = await recoveryManager
        .connect(user)
        .initiateRecovery(threshold, encryptedRecoveryData);
      const receipt = await initiateRecoveryTx.wait();

      const event = receipt?.logs.find(
        (log) =>
          recoveryManager.interface.parseLog(log as any)?.name ===
          "RecoveryInitiated"
      );
      const parsedEvent = recoveryManager.interface.parseLog(event as any);
      const recoveryId = parsedEvent?.args[1];

      await recoveryManager.connect(guardian1).approveRecovery(recoveryId);

      await expect(
        recoveryManager.connect(guardian1).approveRecovery(recoveryId)
      ).to.be.revertedWith("Already approved");
    });

    it("Should cancel recovery", async function () {
      const threshold = 2;
      const encryptedRecoveryData = ethers.toUtf8Bytes(
        "encrypted recovery data"
      );

      const initiateRecoveryTx = await recoveryManager
        .connect(user)
        .initiateRecovery(threshold, encryptedRecoveryData);
      const receipt = await initiateRecoveryTx.wait();

      const event = receipt?.logs.find(
        (log) =>
          recoveryManager.interface.parseLog(log as any)?.name ===
          "RecoveryInitiated"
      );
      const parsedEvent = recoveryManager.interface.parseLog(event as any);
      const recoveryId = parsedEvent?.args[1];

      await recoveryManager.connect(user).cancelRecovery(recoveryId);

      // Should not be able to approve cancelled recovery
      await expect(
        recoveryManager.connect(guardian1).approveRecovery(recoveryId)
      ).to.be.revertedWith("Recovery not pending");
    });
  });

  describe("Recovery Shares", function () {
    it("Should create recovery shares", async function () {
      const threshold = 2;
      const shareData = [
        ethers.toUtf8Bytes("share1"),
        ethers.toUtf8Bytes("share2"),
        ethers.toUtf8Bytes("share3"),
      ];

      const shareIds = await recoveryManager
        .connect(user)
        .createRecoveryShares.staticCall(threshold, shareData);
      expect(shareIds).to.have.length(3);

      await expect(
        recoveryManager.connect(user).createRecoveryShares(threshold, shareData)
      ).to.emit(recoveryManager, "RecoveryShareCreated");
    });

    it("Should validate threshold for shares", async function () {
      const shareData = [ethers.toUtf8Bytes("share1")];

      await expect(
        recoveryManager.connect(user).createRecoveryShares(0, shareData)
      ).to.be.revertedWith("Invalid threshold");

      await expect(
        recoveryManager.connect(user).createRecoveryShares(2, shareData)
      ).to.be.revertedWith("Invalid threshold");
    });

    it("Should limit number of shares", async function () {
      const threshold = 1;
      const shareData = [];

      // Create 11 shares (exceeding max)
      for (let i = 0; i < 11; i++) {
        shareData.push(ethers.toUtf8Bytes(`share${i}`));
      }

      await expect(
        recoveryManager.connect(user).createRecoveryShares(threshold, shareData)
      ).to.be.revertedWith("Too many shares");
    });

    it("Should reconstruct secret from shares", async function () {
      const threshold = 2;
      const shareData = [
        ethers.toUtf8Bytes("share1"),
        ethers.toUtf8Bytes("share2"),
        ethers.toUtf8Bytes("share3"),
      ];

      const shareIds = await recoveryManager
        .connect(user)
        .createRecoveryShares.staticCall(threshold, shareData);
      await recoveryManager
        .connect(user)
        .createRecoveryShares(threshold, shareData);

      // Use first two shares for reconstruction
      const shareProofs = [shareData[0], shareData[1]];
      const selectedShareIds = [shareIds[0], shareIds[1]];

      const result = await recoveryManager
        .connect(user)
        .reconstructFromShares(selectedShareIds, shareProofs);
      expect(result.success).to.be.true;
      expect(result.reconstructedData).to.not.be.empty;
    });
  });

  describe("Access Control", function () {
    it("Should allow user or owner to get guardians", async function () {
      const userAddress = await user.getAddress();

      // User can access their own guardians
      const guardians1 = await recoveryManager
        .connect(user)
        .getUserGuardians(userAddress);
      expect(guardians1).to.have.length(0);

      // Owner can access user's guardians
      const guardians2 = await recoveryManager
        .connect(owner)
        .getUserGuardians(userAddress);
      expect(guardians2).to.have.length(0);

      // Other users cannot access
      await expect(
        recoveryManager.connect(guardian1).getUserGuardians(userAddress)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should control recovery request access", async function () {
      const userAddress = await user.getAddress();

      // User can access their own requests
      const requests1 = await recoveryManager
        .connect(user)
        .getUserRecoveryRequests(userAddress);
      expect(requests1).to.have.length(0);

      // Owner can access user's requests
      const requests2 = await recoveryManager
        .connect(owner)
        .getUserRecoveryRequests(userAddress);
      expect(requests2).to.have.length(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set recovery period", async function () {
      await recoveryManager.connect(owner).setRecoveryPeriod(14 * 24 * 3600); // 14 days
    });

    it("Should allow owner to set guardian limits", async function () {
      await recoveryManager.connect(owner).setGuardianLimits(3, 15);
    });

    it("Should allow owner to emergency recovery", async function () {
      const userAddress = await user.getAddress();
      const newOwner = await guardian1.getAddress();

      await expect(
        recoveryManager
          .connect(owner)
          .emergencyRecovery(userAddress, newOwner, "Security breach")
      ).to.emit(
        recoveryManager,
        "RecoveryInitiated(address,bytes32,uint256)"
      );
      // Also emits RecoveryCompleted per implementation
      await expect(
        recoveryManager
          .connect(owner)
          .emergencyRecovery(userAddress, newOwner, "Security breach 2")
      ).to.emit(
        recoveryManager,
        "RecoveryCompleted(address,bytes32,uint256)"
      );
    });

    it("Should prevent non-owner from admin functions", async function () {
      await expect(
        recoveryManager.connect(user).setRecoveryPeriod(7 * 24 * 3600)
      ).to.be.revertedWith("Not authorized");

      await expect(
        recoveryManager.connect(user).setGuardianLimits(1, 5)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should allow owner to pause/unpause", async function () {
      await recoveryManager.connect(owner).pause();

      const guardianAddress = await guardian1.getAddress();
      const name = "Guardian 1";
      const contactHash = ethers.keccak256(
        ethers.toUtf8Bytes("contact@guardian1.com")
      );

      await expect(
        recoveryManager
          .connect(user)
          .addGuardian(guardianAddress, name, contactHash)
      ).to.be.revertedWith("Contract is paused");

      await recoveryManager.connect(owner).unpause();

      await expect(
        recoveryManager
          .connect(user)
          .addGuardian(guardianAddress, name, contactHash)
      ).to.emit(recoveryManager, "GuardianAdded");
    });
  });

  describe("Event Emissions", function () {
    it("Should emit vault events", async function () {
      await recoveryManager.emitVaultEvent(
        await user.getAddress(),
        1,
        ethers.toUtf8Bytes("test data")
      );
    });

    it("Should emit user flow events", async function () {
      await recoveryManager.emitUserFlowEvent(
        await user.getAddress(),
        1, // flow type
        1, // step
        true, // success
        ethers.toUtf8Bytes("test data")
      );
    });
  });
});

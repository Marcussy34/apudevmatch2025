import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { MirrorInbox, GrandWardenVault, WalletVault, DeviceRegistry, AtomicVaultManager, RecoveryManager } from "../typechain-types";

describe("MirrorInbox", function () {
  let mirrorInbox: MirrorInbox;
  let grandWardenVault: GrandWardenVault;
  let walletVault: WalletVault;
  let deviceRegistry: DeviceRegistry;
  let atomicVaultManager: AtomicVaultManager;
  let recoveryManager: RecoveryManager;
  let owner: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let roflWorker: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, user, roflWorker] = await ethers.getSigners();

    // Deploy all dependency contracts
    const GrandWardenVault = await ethers.getContractFactory("GrandWardenVault");
    grandWardenVault = await GrandWardenVault.deploy();

    const WalletVault = await ethers.getContractFactory("WalletVault");
    walletVault = await WalletVault.deploy();

    const DeviceRegistry = await ethers.getContractFactory("DeviceRegistry");
    deviceRegistry = await DeviceRegistry.deploy();

    const AtomicVaultManager = await ethers.getContractFactory("AtomicVaultManager");
    atomicVaultManager = await AtomicVaultManager.deploy();

    const RecoveryManager = await ethers.getContractFactory("RecoveryManager");
    recoveryManager = await RecoveryManager.deploy();

    // Deploy MirrorInbox with all contract addresses
    const MirrorInbox = await ethers.getContractFactory("MirrorInbox");
    mirrorInbox = await MirrorInbox.deploy(
      await grandWardenVault.getAddress(),
      await walletVault.getAddress(),
      await deviceRegistry.getAddress(),
      await atomicVaultManager.getAddress(),
      await recoveryManager.getAddress()
    );

    // Add ROFL worker to allowlist
    await mirrorInbox.connect(owner).updateAllowlist(roflWorker.address, true);
  });

  describe("Deployment", function () {
    it("Should set the correct contract addresses", async function () {
      const addresses = await mirrorInbox.getContractAddresses();
      expect(addresses.grandWardenVault).to.equal(await grandWardenVault.getAddress());
      expect(addresses.walletVault).to.equal(await walletVault.getAddress());
      expect(addresses.deviceRegistry).to.equal(await deviceRegistry.getAddress());
      expect(addresses.atomicVaultManager).to.equal(await atomicVaultManager.getAddress());
      expect(addresses.recoveryManager).to.equal(await recoveryManager.getAddress());
    });

    it("Should have correct default configuration", async function () {
      const config = await mirrorInbox.getConfig();
      expect(config.maxGap).to.equal(100);
      expect(config.allowlistEnabled).to.be.true;
      expect(config.paused).to.be.false;
    });

    it("Should set owner as admin", async function () {
      expect(await mirrorInbox.hasRole(await mirrorInbox.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });
  });

  describe("Access Control", function () {
    it("Should allow only allowlisted addresses to mirror events", async function () {
      const eventData = {
        suiTxHash: ethers.id("test-tx"),
        suiEventSequence: 1,
        userAddress: user.address,
        eventType: 0, // VaultCreated
        payload: "0x",
        timestampMs: Date.now()
      };

      await expect(
        mirrorInbox.connect(user).mirrorEvent(eventData)
      ).to.be.revertedWith("Not authorized");

      // Should work for allowlisted address
      await expect(
        mirrorInbox.connect(roflWorker).mirrorEvent(eventData)
      ).to.not.be.reverted;
    });

    it("Should allow admin to update allowlist", async function () {
      await mirrorInbox.connect(owner).updateAllowlist(user.address, true);
      expect(await mirrorInbox.isAllowlisted(user.address)).to.be.true;

      await mirrorInbox.connect(owner).updateAllowlist(user.address, false);
      expect(await mirrorInbox.isAllowlisted(user.address)).to.be.false;
    });

    it("Should not allow non-admin to update allowlist", async function () {
      await expect(
        mirrorInbox.connect(user).updateAllowlist(user.address, true)
      ).to.be.reverted;
    });
  });

  describe("Event Mirroring", function () {
    it("Should prevent duplicate events (idempotency)", async function () {
      const eventData = {
        suiTxHash: ethers.id("test-tx"),
        suiEventSequence: 1,
        userAddress: user.address,
        eventType: 0, // VaultCreated
        payload: "0x",
        timestampMs: Date.now()
      };

      await mirrorInbox.connect(roflWorker).mirrorEvent(eventData);
      
      // Same event should be rejected
      await expect(
        mirrorInbox.connect(roflWorker).mirrorEvent(eventData)
      ).to.be.revertedWith("Event already processed");
    });

    it("Should enforce sequential ordering", async function () {
      const baseEvent = {
        suiTxHash: ethers.id("test-tx"),
        userAddress: user.address,
        eventType: 0,
        payload: "0x",
        timestampMs: Date.now()
      };

      // Process sequence 1
      await mirrorInbox.connect(roflWorker).mirrorEvent({
        ...baseEvent,
        suiEventSequence: 1
      });

      // Trying to process sequence 3 should fail (gap too large)
      await expect(
        mirrorInbox.connect(roflWorker).mirrorEvent({
          ...baseEvent,
          suiTxHash: ethers.id("test-tx-2"),
          suiEventSequence: 102 // Gap of 101 > maxGap of 100
        })
      ).to.be.revertedWith("Sequence gap too large");
    });

    it("Should emit VaultCreated event correctly", async function () {
      const vaultId = ethers.id("test-vault");
      const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32"],
        [vaultId]
      );

      const eventData = {
        suiTxHash: ethers.id("test-tx"),
        suiEventSequence: 1,
        userAddress: user.address,
        eventType: 0, // VaultCreated
        payload: payload,
        timestampMs: Date.now()
      };

      await expect(
        mirrorInbox.connect(roflWorker).mirrorEvent(eventData)
      ).to.emit(mirrorInbox, "VaultCreated")
       .withArgs(user.address, vaultId, anyValue);
    });

    it("Should emit DeviceRegistered event correctly", async function () {
      const deviceId = ethers.id("test-device");
      const deviceName = "Test Device";
      const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "string"],
        [deviceId, deviceName]
      );

      const eventData = {
        suiTxHash: ethers.id("test-tx"),
        suiEventSequence: 1,
        userAddress: user.address,
        eventType: 1, // DeviceRegistered
        payload: payload,
        timestampMs: Date.now()
      };

      await expect(
        mirrorInbox.connect(roflWorker).mirrorEvent(eventData)
      ).to.emit(mirrorInbox, "DeviceRegistered")
       .withArgs(user.address, deviceId, deviceName, anyValue);
    });
  });

  describe("Emergency Controls", function () {
    it("Should allow admin to pause and unpause", async function () {
      await mirrorInbox.connect(owner).pause();
      let config = await mirrorInbox.getConfig();
      expect(config.paused).to.be.true;

      const eventData = {
        suiTxHash: ethers.id("test-tx"),
        suiEventSequence: 1,
        userAddress: user.address,
        eventType: 0,
        payload: "0x",
        timestampMs: Date.now()
      };

      await expect(
        mirrorInbox.connect(roflWorker).mirrorEvent(eventData)
      ).to.be.revertedWith("Contract is paused");

      await mirrorInbox.connect(owner).unpause();
      config = await mirrorInbox.getConfig();
      expect(config.paused).to.be.false;

      await expect(
        mirrorInbox.connect(roflWorker).mirrorEvent(eventData)
      ).to.not.be.reverted;
    });

    it("Should allow admin to update configuration", async function () {
      await mirrorInbox.connect(owner).updateConfig(200, false);
      const config = await mirrorInbox.getConfig();
      expect(config.maxGap).to.equal(200);
      expect(config.allowlistEnabled).to.be.false;
    });
  });

  describe("Statistics and Monitoring", function () {
    it("Should track processed event statistics", async function () {
      const eventData = {
        suiTxHash: ethers.id("test-tx"),
        suiEventSequence: 1,
        userAddress: user.address,
        eventType: 0,
        payload: "0x",
        timestampMs: Date.now()
      };

      await mirrorInbox.connect(roflWorker).mirrorEvent(eventData);
      
      const stats = await mirrorInbox.getProcessingStats();
      expect(stats.totalEvents).to.equal(1);
      expect(stats.lastSequence).to.equal(1);
    });
  });
});

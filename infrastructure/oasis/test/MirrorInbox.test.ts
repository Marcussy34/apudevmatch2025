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
    await mirrorInbox.connect(owner).setAllowedSender(roflWorker.address, true);
  });

  describe("Deployment", function () {
    it("Should set the correct contract addresses", async function () {
      const [grandWardenAddr, walletVaultAddr, deviceRegistryAddr, atomicVaultManagerAddr, recoveryManagerAddr] = await mirrorInbox.getContractAddresses();
      expect(grandWardenAddr).to.equal(await grandWardenVault.getAddress());
      expect(walletVaultAddr).to.equal(await walletVault.getAddress());
      expect(deviceRegistryAddr).to.equal(await deviceRegistry.getAddress());
      expect(atomicVaultManagerAddr).to.equal(await atomicVaultManager.getAddress());
      expect(recoveryManagerAddr).to.equal(await recoveryManager.getAddress());
    });

    it("Should have correct default configuration", async function () {
      const config = await mirrorInbox.getConfig();
      expect(config.maxGap).to.equal(100n);
      expect(config.expiry).to.equal(3600n);
      expect(config.paused).to.be.false;
    });

    it("Should set owner correctly", async function () {
      expect(await mirrorInbox.owner()).to.equal(owner.address);
    });
  });

  describe("Access Control", function () {
    it("Should allow only allowed senders to mirror events", async function () {
      const eventType = 0; // VaultCreated
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("test-vault"));
      const eventTimestamp = 1710000000n;
      const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "uint256"],
        [vaultId, eventTimestamp]
      );
      const payload = {
        version: 1n,
        user: user.address,
        data: encodedData,
        timestamp: eventTimestamp,
        sourceChain: ethers.encodeBytes32String("sui"),
        sourceTxHash: ethers.keccak256(ethers.toUtf8Bytes("src-unique-1")),
      } as any;
      const eventId = ethers.keccak256(ethers.toUtf8Bytes("unique-event-1"));
      const sequence = 1;
      const attestation = "0x";

      await expect(
        mirrorInbox.connect(user).mirrorEvent(eventType, payload, eventId, sequence, attestation)
      ).to.be.revertedWith("MirrorInbox: not allowed");

      // Should work for allowed sender
      await expect(
        mirrorInbox.connect(roflWorker).mirrorEvent(eventType, payload, eventId, sequence, attestation)
      ).to.not.be.reverted;
    });

    it("Should allow admin to update allowlist", async function () {
      await mirrorInbox.connect(owner).setAllowedSender(user.address, true);
      expect(await mirrorInbox.isAllowedSender(user.address)).to.be.true;

      await mirrorInbox.connect(owner).setAllowedSender(user.address, false);
      expect(await mirrorInbox.isAllowedSender(user.address)).to.be.false;
    });

    it("Should not allow non-admin to update allowlist", async function () {
      await expect(
        mirrorInbox.connect(user).setAllowedSender(user.address, true)
      ).to.be.reverted;
    });

    it("Should allow admin to set ROFL worker", async function () {
      await mirrorInbox.connect(owner).setROFLWorker(user.address);
      // This should succeed as admin
    });

    it("Should not allow non-admin to set ROFL worker", async function () {
      await expect(
        mirrorInbox.connect(user).setROFLWorker(user.address)
      ).to.be.reverted;
    });
  });

  describe("Event Mirroring", function () {
    it("Should prevent duplicate events (idempotency)", async function () {
      const eventType = 0; // VaultCreated
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("test-vault"));
      const eventTimestamp = 1710000001n;
      const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "uint256"],
        [vaultId, eventTimestamp]
      );
      const payload = {
        version: 1n,
        user: user.address,
        data: encodedData,
        timestamp: eventTimestamp,
        sourceChain: ethers.encodeBytes32String("sui"),
        sourceTxHash: ethers.keccak256(ethers.toUtf8Bytes("src-duplicate")),
      } as any;
      const eventId = ethers.keccak256(ethers.toUtf8Bytes("duplicate-test"));
      const sequence = 1;
      const attestation = "0x";

      await mirrorInbox.connect(roflWorker).mirrorEvent(eventType, payload, eventId, sequence, attestation);
      
      // Same event should be rejected
      await expect(
        mirrorInbox.connect(roflWorker).mirrorEvent(eventType, payload, eventId, sequence, attestation)
      ).to.be.revertedWith("MirrorInbox: event already processed");
    });

    it("Should emit VaultCreated event correctly", async function () {
      const eventType = 0; // VaultCreated
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("test-vault"));
      const eventTimestamp = 1710000002n;
      const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "uint256"],
        [vaultId, eventTimestamp]
      );
      const payload = {
        version: 1n,
        user: user.address,
        data: encodedData,
        timestamp: eventTimestamp,
        sourceChain: ethers.encodeBytes32String("sui"),
        sourceTxHash: ethers.keccak256(ethers.toUtf8Bytes("vault-created-src")),
      } as any;
      const eventId = ethers.keccak256(ethers.toUtf8Bytes("vault-created-test"));
      const sequence = 1;
      const attestation = "0x";

      await expect(
        mirrorInbox.connect(roflWorker).mirrorEvent(eventType, payload, eventId, sequence, attestation)
      ).to.emit(mirrorInbox, "VaultCreated")
       .withArgs(user.address, vaultId, eventTimestamp);
    });

    it("Should emit DeviceRegistered event correctly", async function () {
      const eventType = 1; // DeviceRegistered
      const deviceId = ethers.keccak256(ethers.toUtf8Bytes("test-device"));
      const deviceName = "Test Device";
      const eventTimestamp = 1710000003n;
      const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "string", "uint256"],
        [deviceId, deviceName, eventTimestamp]
      );
      const payload = {
        version: 1n,
        user: user.address,
        data: encodedData,
        timestamp: eventTimestamp,
        sourceChain: ethers.encodeBytes32String("sui"),
        sourceTxHash: ethers.keccak256(ethers.toUtf8Bytes("device-registered-src")),
      } as any;
      const eventId = ethers.keccak256(ethers.toUtf8Bytes("device-registered-test"));
      const sequence = 1;
      const attestation = "0x";

      await expect(
        mirrorInbox.connect(roflWorker).mirrorEvent(eventType, payload, eventId, sequence, attestation)
      ).to.emit(mirrorInbox, "DeviceRegistered")
       .withArgs(user.address, deviceId, deviceName, eventTimestamp);
    });

    it("Should enforce sequential ordering", async function () {
      const eventType = 0;
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("test-vault"));
      const ts1 = 1710000004n;
      const payload = {
        version: 1n,
        user: user.address,
        data: ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "uint256"], [vaultId, ts1]),
        timestamp: ts1,
        sourceChain: ethers.encodeBytes32String("sui"),
        sourceTxHash: ethers.keccak256(ethers.toUtf8Bytes("seq-enforce-src-1")),
      } as any;
      const attestation = "0x";

      // Process sequence 1
      await mirrorInbox.connect(roflWorker).mirrorEvent(
        eventType,
        payload,
        ethers.keccak256(ethers.toUtf8Bytes("event-1")),
        1,
        attestation
      );

      // Trying to process sequence 102 should fail (gap too large, maxGap = 100)
      await expect(
        mirrorInbox.connect(roflWorker).mirrorEvent(
          eventType,
          payload,
          ethers.keccak256(ethers.toUtf8Bytes("event-102")),
          102,
          attestation
        )
      ).to.be.revertedWith("MirrorInbox: sequence gap too large");
    });
  });

  describe("Emergency Controls", function () {
    it("Should allow admin to pause and unpause", async function () {
      await mirrorInbox.connect(owner).setPaused(true);
      let config = await mirrorInbox.getConfig();
      expect(config.paused).to.be.true;

      const eventType = 0;
      const ts = 1710000005n;
      const payload = {
        version: 1n,
        user: user.address,
        data: ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "uint256"], [
          ethers.keccak256(ethers.toUtf8Bytes("test-vault")),
          ts,
        ]),
        timestamp: ts,
        sourceChain: ethers.encodeBytes32String("sui"),
        sourceTxHash: ethers.keccak256(ethers.toUtf8Bytes("paused-src")),
      } as any;
      const eventId = ethers.keccak256(ethers.toUtf8Bytes("paused-test"));
      const sequence = 1;
      const attestation = "0x";

      await expect(
        mirrorInbox.connect(roflWorker).mirrorEvent(eventType, payload, eventId, sequence, attestation)
      ).to.be.revertedWith("MirrorInbox: paused");

      await mirrorInbox.connect(owner).setPaused(false);
      config = await mirrorInbox.getConfig();
      expect(config.paused).to.be.false;

      await expect(
        mirrorInbox.connect(roflWorker).mirrorEvent(eventType, payload, eventId, sequence, attestation)
      ).to.not.be.reverted;
    });

    it("Should allow admin to update configuration", async function () {
      await mirrorInbox.connect(owner).updateConfig(200, 7200);
      const config = await mirrorInbox.getConfig();
      expect(config.maxGap).to.equal(200n);
      expect(config.expiry).to.equal(7200n);
    });

    it("Should not allow non-admin to pause", async function () {
      await expect(
        mirrorInbox.connect(user).setPaused(true)
      ).to.be.reverted;
    });

    it("Should not allow non-admin to update config", async function () {
      await expect(
        mirrorInbox.connect(user).updateConfig(200, 7200)
      ).to.be.reverted;
    });
  });

  describe("Statistics and Monitoring", function () {
    it("Should track event processing statistics", async function () {
      const eventType = 0;
      const vaultId = ethers.keccak256(ethers.toUtf8Bytes("test-vault"));
      const ts = 1710000006n;
      const payload = {
        version: 1n,
        user: user.address,
        data: ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "uint256"], [vaultId, ts]),
        timestamp: ts,
        sourceChain: ethers.encodeBytes32String("sui"),
        sourceTxHash: ethers.keccak256(ethers.toUtf8Bytes("stats-src")),
      } as any;
      const eventId = ethers.keccak256(ethers.toUtf8Bytes("stats-test"));
      const sequence = 1;
      const attestation = "0x";

      await mirrorInbox.connect(roflWorker).mirrorEvent(eventType, payload, eventId, sequence, attestation);
      
      // Check if event was processed
      expect(await mirrorInbox.isEventProcessed(eventId)).to.be.true;
      expect(await mirrorInbox.getLastSequence(user.address)).to.equal(1n);
    });

    it("Should check event processing status", async function () {
      const eventId = ethers.keccak256(ethers.toUtf8Bytes("non-existent"));
      expect(await mirrorInbox.isEventProcessed(eventId)).to.be.false;
    });

    it("Should get last sequence for user", async function () {
      expect(await mirrorInbox.getLastSequence(user.address)).to.equal(0n);
    });
  });

  describe("Vault Event Functions", function () {
    it("Should emit vault events", async function () {
      await expect(
        mirrorInbox.connect(roflWorker).emitVaultEvent(user.address, 1, "0x1234")
      ).to.emit(mirrorInbox, "VaultEvent");
    });

    it("Should emit user flow events", async function () {
      await expect(
        mirrorInbox.connect(roflWorker).emitUserFlowEvent(user.address, 1, 2, true, "0x5678")
      ).to.emit(mirrorInbox, "UserFlowEvent");
    });

    it("Should not allow non-authorized to emit vault events", async function () {
      await expect(
        mirrorInbox.connect(user).emitVaultEvent(user.address, 1, "0x1234")
      ).to.be.revertedWith("MirrorInbox: not allowed");
    });

    it("Should not allow non-authorized to emit user flow events", async function () {
      await expect(
        mirrorInbox.connect(user).emitUserFlowEvent(user.address, 1, 2, true, "0x5678")
      ).to.be.revertedWith("MirrorInbox: not allowed");
    });
  });

  describe("Ownership Transfer", function () {
    it("Should allow owner to transfer ownership", async function () {
      await mirrorInbox.connect(owner).transferOwnership(user.address);
      expect(await mirrorInbox.owner()).to.equal(user.address);
    });

    it("Should not allow non-owner to transfer ownership", async function () {
      await expect(
        mirrorInbox.connect(user).transferOwnership(user.address)
      ).to.be.reverted;
    });
  });
});
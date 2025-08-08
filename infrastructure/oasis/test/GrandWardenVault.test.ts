import { expect } from "chai";
import { ethers } from "hardhat";
import {
  GrandWardenVault,
  WalletVault,
  DeviceRegistry,
} from "../typechain-types";

describe("Grand Warden Phase 1 - Core Contracts", function () {
  let grandWardenVault: GrandWardenVault;
  let walletVault: WalletVault;
  let deviceRegistry: DeviceRegistry;
  let owner: any;
  let user: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy contracts
    const GrandWardenVault = await ethers.getContractFactory(
      "GrandWardenVault"
    );
    grandWardenVault = await GrandWardenVault.deploy();

    const WalletVault = await ethers.getContractFactory("WalletVault");
    walletVault = await WalletVault.deploy();

    const DeviceRegistry = await ethers.getContractFactory("DeviceRegistry");
    deviceRegistry = await DeviceRegistry.deploy();
  });

  describe("GrandWardenVault", function () {
    it("Should create a vault successfully", async function () {
      const vaultData = ethers.encodeBytes32String("test-vault-data");

      const tx = await grandWardenVault.connect(user).createVault(vaultData);
      const receipt = await tx.wait();

      // Check that VaultCreated event was emitted
      const event = receipt?.logs.find(
        (log) =>
          grandWardenVault.interface.parseLog(log as any)?.name ===
          "VaultCreated"
      );
      expect(event).to.not.be.undefined;
    });

    it("Should add credentials to vault", async function () {
      const vaultData = ethers.encodeBytes32String("test-vault-data");
      const createTx = await grandWardenVault
        .connect(user)
        .createVault(vaultData);
      const createReceipt = await createTx.wait();

      // Get vault ID from event
      const createEvent = createReceipt?.logs.find(
        (log) =>
          grandWardenVault.interface.parseLog(log as any)?.name ===
          "VaultCreated"
      );
      const parsedEvent = grandWardenVault.interface.parseLog(
        createEvent as any
      );
      const vaultId = parsedEvent?.args[1]; // vaultId is second parameter

      // Add credential
      const domain = "example.com";
      const username = "testuser";
      const encryptedPassword =
        ethers.encodeBytes32String("encrypted-password");

      await expect(
        grandWardenVault
          .connect(user)
          .addCredential(vaultId, domain, username, encryptedPassword)
      ).to.emit(grandWardenVault, "CredentialAdded");
    });
  });

  describe("WalletVault", function () {
    it("Should import seed phrase successfully", async function () {
      const encryptedSeed = ethers.encodeBytes32String("encrypted-seed-phrase");
      const walletName = "My Test Wallet";

      await expect(
        walletVault.connect(user).importSeedPhrase(encryptedSeed, walletName)
      ).to.emit(walletVault, "WalletImported");
    });

    it("Should derive keys for multiple chains", async function () {
      const encryptedSeed = ethers.encodeBytes32String("encrypted-seed-phrase");
      const walletName = "My Test Wallet";

      const importTx = await walletVault
        .connect(user)
        .importSeedPhrase(encryptedSeed, walletName);
      const importReceipt = await importTx.wait();

      // Get wallet ID from event
      const importEvent = importReceipt?.logs.find(
        (log) =>
          walletVault.interface.parseLog(log as any)?.name === "WalletImported"
      );
      const parsedEvent = walletVault.interface.parseLog(importEvent as any);
      const walletId = parsedEvent?.args[1]; // walletId is second parameter

      // Derive keys for multiple chains
      const chainTypes = [1, 2]; // Ethereum and Polygon
      const deriveTx = await walletVault
        .connect(user)
        .deriveKeysFromSeed(walletId, chainTypes);

      // Wait for transaction and get return value
      await deriveTx.wait();

      // Verify wallet info was updated
      const walletInfo = await walletVault
        .connect(user)
        .getWalletInfo(walletId);
      expect(walletInfo.chainTypes).to.have.length(2);
      expect(walletInfo.chainTypes[0]).to.equal(1); // Ethereum
      expect(walletInfo.chainTypes[1]).to.equal(2); // Polygon
    });
  });

  describe("DeviceRegistry", function () {
    it("Should register device successfully", async function () {
      const deviceName = "My Test Device";
      const publicKeyHash = ethers.keccak256(
        ethers.encodeBytes32String("public-key")
      );
      const deviceFingerprint =
        ethers.encodeBytes32String("device-fingerprint");

      await expect(
        deviceRegistry
          .connect(user)
          .registerDevice(deviceName, publicKeyHash, deviceFingerprint)
      ).to.emit(deviceRegistry, "DeviceRegistered");
    });

    it("Should authenticate device", async function () {
      const deviceName = "My Test Device";
      const publicKeyHash = ethers.keccak256(
        ethers.encodeBytes32String("public-key")
      );
      const deviceFingerprint =
        ethers.encodeBytes32String("device-fingerprint");

      const registerTx = await deviceRegistry
        .connect(user)
        .registerDevice(deviceName, publicKeyHash, deviceFingerprint);
      const registerReceipt = await registerTx.wait();

      // Get device ID from event
      const registerEvent = registerReceipt?.logs.find(
        (log) =>
          deviceRegistry.interface.parseLog(log as any)?.name ===
          "DeviceRegistered"
      );
      const parsedEvent = deviceRegistry.interface.parseLog(
        registerEvent as any
      );
      const deviceId = parsedEvent?.args[1]; // deviceId is second parameter

      // Generate challenge
      const challenge = await deviceRegistry
        .connect(user)
        .generateAuthChallenge(deviceId);

      // Mock signature
      const signature = ethers.encodeBytes32String("mock-signature");

      // Authenticate device - should emit DeviceAuthenticated event
      await expect(
        deviceRegistry
          .connect(user)
          .authenticateDevice(deviceId, challenge, signature)
      ).to.emit(deviceRegistry, "DeviceAuthenticated");

      // Verify device is still authorized
      const isAuthorized = await deviceRegistry.isDeviceAuthorized(deviceId);
      expect(isAuthorized).to.be.true;
    });
  });

  describe("Integration Tests", function () {
    it("Should allow coordinated operations across contracts", async function () {
      // 1. Register device
      const deviceName = "Integration Test Device";
      const publicKeyHash = ethers.keccak256(
        ethers.encodeBytes32String("public-key")
      );
      const deviceFingerprint =
        ethers.encodeBytes32String("device-fingerprint");

      await deviceRegistry
        .connect(user)
        .registerDevice(deviceName, publicKeyHash, deviceFingerprint);

      // 2. Import wallet
      const encryptedSeed = ethers.encodeBytes32String("encrypted-seed-phrase");
      const walletName = "Integration Test Wallet";

      await walletVault
        .connect(user)
        .importSeedPhrase(encryptedSeed, walletName);

      // 3. Create password vault
      const vaultData = ethers.encodeBytes32String("integration-vault-data");

      await grandWardenVault.connect(user).createVault(vaultData);

      // All operations should succeed without reverting
      expect(true).to.be.true;
    });
  });
});

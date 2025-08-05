import { expect } from "chai";
import { ethers } from "hardhat";
import { DeviceRegistry } from "../typechain-types";

describe("DeviceRegistry - Comprehensive Tests", function () {
  let deviceRegistry: DeviceRegistry;
  let owner: any;
  let user: any;
  let otherUser: any;

  beforeEach(async function () {
    [owner, user, otherUser] = await ethers.getSigners();

    const DeviceRegistry = await ethers.getContractFactory("DeviceRegistry");
    deviceRegistry = await DeviceRegistry.deploy();
  });

  describe("Device Registration", function () {
    it("Should register multiple devices", async function () {
      const devices = [
        { name: "Device 1", key: "key1", fingerprint: "fp1" },
        { name: "Device 2", key: "key2", fingerprint: "fp2" },
        { name: "Device 3", key: "key3", fingerprint: "fp3" },
      ];

      for (const device of devices) {
        const publicKeyHash = ethers.keccak256(
          ethers.encodeBytes32String(device.key)
        );
        const deviceFingerprint = ethers.encodeBytes32String(
          device.fingerprint
        );

        await expect(
          deviceRegistry
            .connect(user)
            .registerDevice(device.name, publicKeyHash, deviceFingerprint)
        ).to.emit(deviceRegistry, "DeviceRegistered");
      }

      const userDevices = await deviceRegistry.getUserDevices(
        await user.getAddress()
      );
      expect(userDevices).to.have.length(3);
    });

    it("Should prevent registering too many devices", async function () {
      // Register 10 devices (default max)
      for (let i = 0; i < 10; i++) {
        const publicKeyHash = ethers.keccak256(
          ethers.encodeBytes32String(`key${i}`)
        );
        const deviceFingerprint = ethers.encodeBytes32String(`fp${i}`);

        await deviceRegistry
          .connect(user)
          .registerDevice(`Device ${i}`, publicKeyHash, deviceFingerprint);
      }

      // 11th device should fail
      const publicKeyHash = ethers.keccak256(
        ethers.encodeBytes32String("key11")
      );
      const deviceFingerprint = ethers.encodeBytes32String("fp11");

      await expect(
        deviceRegistry
          .connect(user)
          .registerDevice("Device 11", publicKeyHash, deviceFingerprint)
      ).to.be.revertedWith("Too many devices");
    });

    it("Should require valid device name", async function () {
      const publicKeyHash = ethers.keccak256(ethers.encodeBytes32String("key"));
      const deviceFingerprint = ethers.encodeBytes32String("fp");

      await expect(
        deviceRegistry
          .connect(user)
          .registerDevice("", publicKeyHash, deviceFingerprint)
      ).to.be.revertedWith("Device name required");
    });

    it("Should require valid public key hash", async function () {
      const deviceFingerprint = ethers.encodeBytes32String("fp");

      await expect(
        deviceRegistry
          .connect(user)
          .registerDevice("Device", ethers.ZeroHash, deviceFingerprint)
      ).to.be.revertedWith("Public key hash required");
    });

    it("Should get device information", async function () {
      const deviceName = "Test Device";
      const publicKeyHash = ethers.keccak256(ethers.encodeBytes32String("key"));
      const deviceFingerprint = ethers.encodeBytes32String("fp");

      const registerTx = await deviceRegistry
        .connect(user)
        .registerDevice(deviceName, publicKeyHash, deviceFingerprint);
      const receipt = await registerTx.wait();

      const event = receipt?.logs.find(
        (log) =>
          deviceRegistry.interface.parseLog(log as any)?.name ===
          "DeviceRegistered"
      );
      const parsedEvent = deviceRegistry.interface.parseLog(event as any);
      const deviceId = parsedEvent?.args[1];

      const device = await deviceRegistry.connect(user).getDevice(deviceId);
      expect(device.name).to.equal(deviceName);
      expect(device.publicKeyHash).to.equal(publicKeyHash);
      expect(device.owner).to.equal(await user.getAddress());
    });
  });

  describe("Device Authentication", function () {
    let deviceId: any;

    beforeEach(async function () {
      const deviceName = "Auth Test Device";
      const publicKeyHash = ethers.keccak256(
        ethers.encodeBytes32String("auth-key")
      );
      const deviceFingerprint = ethers.encodeBytes32String("auth-fp");

      const registerTx = await deviceRegistry
        .connect(user)
        .registerDevice(deviceName, publicKeyHash, deviceFingerprint);
      const receipt = await registerTx.wait();

      const event = receipt?.logs.find(
        (log) =>
          deviceRegistry.interface.parseLog(log as any)?.name ===
          "DeviceRegistered"
      );
      const parsedEvent = deviceRegistry.interface.parseLog(event as any);
      deviceId = parsedEvent?.args[1];
    });

    it("Should generate authentication challenges", async function () {
      const challenge = await deviceRegistry
        .connect(user)
        .generateAuthChallenge(deviceId);
      expect(challenge).to.not.equal(ethers.ZeroHash);

      // Note: Since challenges are based on block timestamp and hash,
      // they might be the same if generated in the same block
      // This is expected behavior for deterministic challenge generation
    });

    it("Should authenticate device with valid signature", async function () {
      const challenge = await deviceRegistry
        .connect(user)
        .generateAuthChallenge(deviceId);
      const signature = ethers.encodeBytes32String("valid-signature");

      await expect(
        deviceRegistry
          .connect(user)
          .authenticateDevice(deviceId, challenge, signature)
      ).to.emit(deviceRegistry, "DeviceAuthenticated");
    });

    it("Should record authentication history", async function () {
      const challenge = await deviceRegistry
        .connect(user)
        .generateAuthChallenge(deviceId);
      const signature = ethers.encodeBytes32String("signature");

      await deviceRegistry
        .connect(user)
        .authenticateDevice(deviceId, challenge, signature);

      const history = await deviceRegistry
        .connect(user)
        .getDeviceAuthHistory(deviceId, 10);
      expect(history).to.have.length(1);
      expect(history[0].challenge).to.equal(challenge);
    });

    it("Should check device authorization status", async function () {
      const isAuthorized = await deviceRegistry.isDeviceAuthorized(deviceId);
      expect(isAuthorized).to.be.true;
    });

    it("Should get device status", async function () {
      const status = await deviceRegistry
        .connect(user)
        .getDeviceStatus(deviceId);
      expect(status).to.equal(0); // Active status
    });
  });

  describe("Device Management", function () {
    let deviceId: any;

    beforeEach(async function () {
      const deviceName = "Management Test Device";
      const publicKeyHash = ethers.keccak256(
        ethers.encodeBytes32String("mgmt-key")
      );
      const deviceFingerprint = ethers.encodeBytes32String("mgmt-fp");

      const registerTx = await deviceRegistry
        .connect(user)
        .registerDevice(deviceName, publicKeyHash, deviceFingerprint);
      const receipt = await registerTx.wait();

      const event = receipt?.logs.find(
        (log) =>
          deviceRegistry.interface.parseLog(log as any)?.name ===
          "DeviceRegistered"
      );
      const parsedEvent = deviceRegistry.interface.parseLog(event as any);
      deviceId = parsedEvent?.args[1];
    });

    it("Should update device name", async function () {
      const newName = "Updated Device Name";

      await deviceRegistry.connect(user).updateDeviceName(deviceId, newName);

      const device = await deviceRegistry.connect(user).getDevice(deviceId);
      expect(device.name).to.equal(newName);
    });

    it("Should suspend device", async function () {
      await expect(
        deviceRegistry.connect(user).suspendDevice(deviceId)
      ).to.emit(deviceRegistry, "DeviceStatusChanged");

      const status = await deviceRegistry
        .connect(user)
        .getDeviceStatus(deviceId);
      expect(status).to.equal(1); // Suspended status

      const isAuthorized = await deviceRegistry.isDeviceAuthorized(deviceId);
      expect(isAuthorized).to.be.false;
    });

    it("Should reactivate suspended device", async function () {
      await deviceRegistry.connect(user).suspendDevice(deviceId);

      await expect(
        deviceRegistry.connect(user).reactivateDevice(deviceId)
      ).to.emit(deviceRegistry, "DeviceStatusChanged");

      const status = await deviceRegistry
        .connect(user)
        .getDeviceStatus(deviceId);
      expect(status).to.equal(0); // Active status

      const isAuthorized = await deviceRegistry.isDeviceAuthorized(deviceId);
      expect(isAuthorized).to.be.true;
    });

    it("Should revoke device", async function () {
      await expect(deviceRegistry.connect(user).revokeDevice(deviceId)).to.emit(
        deviceRegistry,
        "DeviceRevoked"
      );

      const status = await deviceRegistry
        .connect(user)
        .getDeviceStatus(deviceId);
      expect(status).to.equal(2); // Revoked status

      const isAuthorized = await deviceRegistry.isDeviceAuthorized(deviceId);
      expect(isAuthorized).to.be.false;
    });

    it("Should not allow authentication of revoked device", async function () {
      await deviceRegistry.connect(user).revokeDevice(deviceId);

      const challenge = await deviceRegistry
        .connect(user)
        .generateAuthChallenge(deviceId);
      const signature = ethers.encodeBytes32String("signature");

      await expect(
        deviceRegistry
          .connect(user)
          .authenticateDevice(deviceId, challenge, signature)
      ).to.be.revertedWith("Device not active");
    });
  });

  describe("Access Control", function () {
    let deviceId: any;

    beforeEach(async function () {
      const deviceName = "Access Control Device";
      const publicKeyHash = ethers.keccak256(
        ethers.encodeBytes32String("ac-key")
      );
      const deviceFingerprint = ethers.encodeBytes32String("ac-fp");

      const registerTx = await deviceRegistry
        .connect(user)
        .registerDevice(deviceName, publicKeyHash, deviceFingerprint);
      const receipt = await registerTx.wait();

      const event = receipt?.logs.find(
        (log) =>
          deviceRegistry.interface.parseLog(log as any)?.name ===
          "DeviceRegistered"
      );
      const parsedEvent = deviceRegistry.interface.parseLog(event as any);
      deviceId = parsedEvent?.args[1];
    });

    it("Should only allow device owner to access device info", async function () {
      await expect(
        deviceRegistry.connect(otherUser).getDevice(deviceId)
      ).to.be.revertedWith("Not device owner");
    });

    it("Should only allow device owner to manage device", async function () {
      await expect(
        deviceRegistry.connect(otherUser).suspendDevice(deviceId)
      ).to.be.revertedWith("Not device owner");

      await expect(
        deviceRegistry.connect(otherUser).revokeDevice(deviceId)
      ).to.be.revertedWith("Not device owner");
    });

    it("Should allow owner or device owner to get device status", async function () {
      // Device owner can access
      const status1 = await deviceRegistry
        .connect(user)
        .getDeviceStatus(deviceId);
      expect(status1).to.equal(0);

      // Contract owner can access
      const status2 = await deviceRegistry
        .connect(owner)
        .getDeviceStatus(deviceId);
      expect(status2).to.equal(0);

      // Other users cannot access
      await expect(
        deviceRegistry.connect(otherUser).getDeviceStatus(deviceId)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set max devices per user", async function () {
      await deviceRegistry
        .connect(owner)
        .setMaxDevicesPerUser(ethers.ZeroAddress, 5);

      // Now users should only be able to register 5 devices
      for (let i = 0; i < 5; i++) {
        const publicKeyHash = ethers.keccak256(
          ethers.encodeBytes32String(`key${i}`)
        );
        const deviceFingerprint = ethers.encodeBytes32String(`fp${i}`);

        await deviceRegistry
          .connect(user)
          .registerDevice(`Device ${i}`, publicKeyHash, deviceFingerprint);
      }

      // 6th device should fail
      const publicKeyHash = ethers.keccak256(
        ethers.encodeBytes32String("key6")
      );
      const deviceFingerprint = ethers.encodeBytes32String("fp6");

      await expect(
        deviceRegistry
          .connect(user)
          .registerDevice("Device 6", publicKeyHash, deviceFingerprint)
      ).to.be.revertedWith("Too many devices");
    });

    it("Should allow owner to set challenge expiry", async function () {
      await deviceRegistry.connect(owner).setAuthChallengeExpiry(600); // 10 minutes
      // This is just testing that the function doesn't revert
    });

    it("Should allow owner to emergency revoke device", async function () {
      const deviceName = "Emergency Device";
      const publicKeyHash = ethers.keccak256(
        ethers.encodeBytes32String("emergency-key")
      );
      const deviceFingerprint = ethers.encodeBytes32String("emergency-fp");

      const registerTx = await deviceRegistry
        .connect(user)
        .registerDevice(deviceName, publicKeyHash, deviceFingerprint);
      const receipt = await registerTx.wait();

      const event = receipt?.logs.find(
        (log) =>
          deviceRegistry.interface.parseLog(log as any)?.name ===
          "DeviceRegistered"
      );
      const parsedEvent = deviceRegistry.interface.parseLog(event as any);
      const deviceId = parsedEvent?.args[1];

      await expect(
        deviceRegistry
          .connect(owner)
          .emergencyRevokeDevice(deviceId, "Security breach")
      ).to.emit(deviceRegistry, "DeviceRevoked");

      const status = await deviceRegistry
        .connect(owner)
        .getDeviceStatus(deviceId);
      expect(status).to.equal(2); // Revoked status
    });

    it("Should prevent non-owner from admin functions", async function () {
      await expect(
        deviceRegistry.connect(user).setMaxDevicesPerUser(ethers.ZeroAddress, 5)
      ).to.be.revertedWith("Not authorized");

      await expect(
        deviceRegistry.connect(user).setAuthChallengeExpiry(600)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should allow owner to pause/unpause", async function () {
      await deviceRegistry.connect(owner).pause();

      const publicKeyHash = ethers.keccak256(ethers.encodeBytes32String("key"));
      const deviceFingerprint = ethers.encodeBytes32String("fp");

      await expect(
        deviceRegistry
          .connect(user)
          .registerDevice("Device", publicKeyHash, deviceFingerprint)
      ).to.be.revertedWith("Contract is paused");

      await deviceRegistry.connect(owner).unpause();

      await expect(
        deviceRegistry
          .connect(user)
          .registerDevice("Device", publicKeyHash, deviceFingerprint)
      ).to.emit(deviceRegistry, "DeviceRegistered");
    });
  });

  describe("Event Emissions", function () {
    it("Should emit generic vault events", async function () {
      await deviceRegistry.emitVaultEvent(
        await user.getAddress(),
        1,
        ethers.toUtf8Bytes("test data")
      );
    });

    it("Should emit user flow events", async function () {
      await deviceRegistry.emitUserFlowEvent(
        await user.getAddress(),
        1, // flow type
        1, // step
        true, // success
        ethers.toUtf8Bytes("test data")
      );
    });
  });
});

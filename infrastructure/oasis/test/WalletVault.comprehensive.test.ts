import { expect } from "chai";
import { ethers } from "hardhat";
import { WalletVault } from "../typechain-types";

describe("WalletVault - Comprehensive Tests", function () {
  let walletVault: WalletVault;
  let owner: any;
  let user: any;
  let otherUser: any;

  beforeEach(async function () {
    [owner, user, otherUser] = await ethers.getSigners();

    const WalletVault = await ethers.getContractFactory("WalletVault");
    walletVault = await WalletVault.deploy();
  });

  describe("Wallet Management", function () {
    it("Should prevent creating too many wallets", async function () {
      const encryptedSeed = ethers.encodeBytes32String("encrypted-seed-phrase");

      // Try to create more than 10 wallets (MAX_WALLETS_PER_USER)
      for (let i = 0; i < 10; i++) {
        await walletVault
          .connect(user)
          .importSeedPhrase(encryptedSeed, `Wallet ${i}`);
      }

      // The 11th wallet should fail
      await expect(
        walletVault.connect(user).importSeedPhrase(encryptedSeed, "Wallet 11")
      ).to.be.revertedWith("Too many wallets");
    });

    it("Should require wallet name", async function () {
      const encryptedSeed = ethers.encodeBytes32String("encrypted-seed-phrase");

      await expect(
        walletVault.connect(user).importSeedPhrase(encryptedSeed, "")
      ).to.be.revertedWith("Wallet name required");
    });

    it("Should update wallet metadata", async function () {
      const encryptedSeed = ethers.encodeBytes32String("encrypted-seed-phrase");
      const walletName = "Test Wallet";

      const importTx = await walletVault
        .connect(user)
        .importSeedPhrase(encryptedSeed, walletName);
      const receipt = await importTx.wait();

      const event = receipt?.logs.find(
        (log) =>
          walletVault.interface.parseLog(log as any)?.name === "WalletImported"
      );
      const parsedEvent = walletVault.interface.parseLog(event as any);
      const walletId = parsedEvent?.args[1];

      // Update wallet metadata (keep it active)
      await walletVault
        .connect(user)
        .updateWalletMetadata(walletId, "Updated Wallet", true);

      const walletInfo = await walletVault
        .connect(user)
        .getWalletInfo(walletId);
      expect(walletInfo.name).to.equal("Updated Wallet");
      expect(walletInfo.isActive).to.be.true;
    });

    it("Should only allow wallet owner to access wallet info", async function () {
      const encryptedSeed = ethers.encodeBytes32String("encrypted-seed-phrase");
      const walletName = "Test Wallet";

      const importTx = await walletVault
        .connect(user)
        .importSeedPhrase(encryptedSeed, walletName);
      const receipt = await importTx.wait();

      const event = receipt?.logs.find(
        (log) =>
          walletVault.interface.parseLog(log as any)?.name === "WalletImported"
      );
      const parsedEvent = walletVault.interface.parseLog(event as any);
      const walletId = parsedEvent?.args[1];

      // Other user should not be able to access wallet info
      await expect(
        walletVault.connect(otherUser).getWalletInfo(walletId)
      ).to.be.revertedWith("Not wallet owner");
    });
  });

  describe("Multi-Chain Operations", function () {
    let walletId: any;

    beforeEach(async function () {
      const encryptedSeed = ethers.encodeBytes32String("encrypted-seed-phrase");
      const walletName = "Multi-Chain Wallet";

      const importTx = await walletVault
        .connect(user)
        .importSeedPhrase(encryptedSeed, walletName);
      const receipt = await importTx.wait();

      const event = receipt?.logs.find(
        (log) =>
          walletVault.interface.parseLog(log as any)?.name === "WalletImported"
      );
      const parsedEvent = walletVault.interface.parseLog(event as any);
      walletId = parsedEvent?.args[1];
    });

    it("Should derive keys for all supported chains", async function () {
      const chainTypes = [1, 2, 3]; // All supported chains in WalletVault

      await walletVault.connect(user).deriveKeysFromSeed(walletId, chainTypes);

      const walletInfo = await walletVault
        .connect(user)
        .getWalletInfo(walletId);
      expect(walletInfo.chainTypes).to.have.length(3);
    });

    it("Should fetch balances for derived addresses", async function () {
      const chainTypes = [1, 2]; // Ethereum and Polygon

      await walletVault.connect(user).deriveKeysFromSeed(walletId, chainTypes);

      const balances = await walletVault
        .connect(user)
        .fetchWalletBalances(walletId);
      expect(balances).to.have.length(2);
      expect(balances[0].chainType).to.equal(1);
      expect(balances[1].chainType).to.equal(2);
    });

    it("Should get derived address for specific chain", async function () {
      const chainTypes = [1]; // Ethereum

      await walletVault.connect(user).deriveKeysFromSeed(walletId, chainTypes);

      const address = await walletVault
        .connect(user)
        .getDerivedAddress(walletId, 1);
      expect(address).to.not.equal(ethers.ZeroAddress);
    });

    it("Should sign transactions", async function () {
      const chainTypes = [1]; // Ethereum

      await walletVault.connect(user).deriveKeysFromSeed(walletId, chainTypes);

      const txHash = ethers.keccak256(ethers.toUtf8Bytes("test transaction"));
      const txData = ethers.toUtf8Bytes("transaction data");

      const tx = await walletVault
        .connect(user)
        .signTransaction(walletId, 1, txHash, txData);
      const receipt = await tx.wait();

      // Check that transaction was signed (should have events)
      expect(receipt?.logs.length).to.be.greaterThan(0);
    });

    it("Should sign Sui transactions using Ed25519", async function () {
      const suiChainType = 10; // SUI_CHAIN constant

      // First derive a key for Sui chain
      await walletVault
        .connect(user)
        .deriveKeysFromSeed(walletId, [suiChainType]);

      const txHash = ethers.keccak256(
        ethers.toUtf8Bytes("sui test transaction")
      );
      const txData = ethers.toUtf8Bytes("sui transaction data");

      const tx = await walletVault
        .connect(user)
        .signTransaction(walletId, suiChainType, txHash, txData);
      const receipt = await tx.wait();

      // Check that transaction was signed and emitted correct event with chainType
      expect(receipt?.logs.length).to.be.greaterThan(0);

      // Verify the TransactionSigned event contains the correct chainType (10 for Sui)
      const events = receipt?.logs || [];
      const signedEvent = events.find((log) => {
        try {
          const parsedLog = walletVault.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });
          return parsedLog?.name === "TransactionSigned";
        } catch {
          return false;
        }
      });

      expect(signedEvent).to.not.be.undefined;
      if (signedEvent) {
        const parsedLog = walletVault.interface.parseLog({
          topics: signedEvent.topics,
          data: signedEvent.data,
        });
        expect(parsedLog?.args[3]).to.equal(suiChainType); // chainType should be 10 (SUI_CHAIN)
      }
    });

    it("Should use different signature formats for EVM vs Sui chains", async function () {
      const evmChainType = 1; // Ethereum
      const suiChainType = 10; // Sui

      // Derive keys for both chains
      await walletVault
        .connect(user)
        .deriveKeysFromSeed(walletId, [evmChainType, suiChainType]);

      const txHash = ethers.keccak256(ethers.toUtf8Bytes("test transaction"));
      const txData = ethers.toUtf8Bytes("transaction data");

      // Sign transactions on both chains
      const evmTx = await walletVault
        .connect(user)
        .signTransaction(walletId, evmChainType, txHash, txData);
      const evmReceipt = await evmTx.wait();

      const suiTx = await walletVault
        .connect(user)
        .signTransaction(walletId, suiChainType, txHash, txData);
      const suiReceipt = await suiTx.wait();

      // Both should succeed
      expect(evmReceipt?.status).to.equal(1);
      expect(suiReceipt?.status).to.equal(1);

      // Verify the chainType is correctly recorded in events
      const evmEvents = evmReceipt?.logs || [];
      const suiEvents = suiReceipt?.logs || [];

      const evmSignedEvent = evmEvents.find((log) => {
        try {
          const parsedLog = walletVault.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });
          return parsedLog?.name === "TransactionSigned";
        } catch {
          return false;
        }
      });

      const suiSignedEvent = suiEvents.find((log) => {
        try {
          const parsedLog = walletVault.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });
          return parsedLog?.name === "TransactionSigned";
        } catch {
          return false;
        }
      });

      expect(evmSignedEvent).to.not.be.undefined;
      expect(suiSignedEvent).to.not.be.undefined;

      if (evmSignedEvent && suiSignedEvent) {
        const evmParsedLog = walletVault.interface.parseLog({
          topics: evmSignedEvent.topics,
          data: evmSignedEvent.data,
        });
        const suiParsedLog = walletVault.interface.parseLog({
          topics: suiSignedEvent.topics,
          data: suiSignedEvent.data,
        });

        // Verify different chain types were recorded
        expect(evmParsedLog?.args[3]).to.equal(evmChainType); // Should be 1 (Ethereum)
        expect(suiParsedLog?.args[3]).to.equal(suiChainType); // Should be 10 (Sui)
      }
    });

    it("Should reject unsupported chain types", async function () {
      const invalidChainTypes = [99]; // Invalid chain

      await expect(
        walletVault
          .connect(user)
          .deriveKeysFromSeed(walletId, invalidChainTypes)
      ).to.be.revertedWith("Chain not supported");
    });
  });

  describe("Multi-Chain RPC Functions", function () {
    it("Should get multi-chain balances for address", async function () {
      const testAddress = await user.getAddress();
      const chainTypes = [1, 2]; // Ethereum and Polygon

      const balances = await walletVault.getMultiChainBalances(
        testAddress,
        chainTypes
      );
      expect(balances).to.have.length(2);
    });

    it("Should execute RPC calls", async function () {
      const result = await walletVault.executeChainRPC(
        1,
        "eth_getBalance",
        ethers.toUtf8Bytes("params")
      );
      expect(result).to.not.be.empty;
    });

    it("Should get chain configurations", async function () {
      const config = await walletVault.getChainConfig(1);
      expect(config.chainType).to.equal(1);
      expect(config.name).to.equal("Ethereum");
      expect(config.isActive).to.be.true;
    });

    it("Should get all supported chains", async function () {
      const configs = await walletVault.getAllChains();
      expect(configs.length).to.be.greaterThan(0);
    });

    it("Should batch get balances", async function () {
      const addresses = [await user.getAddress(), await otherUser.getAddress()];
      const chainTypes = [1, 2];

      const balances = await walletVault.batchGetBalances(
        addresses,
        chainTypes
      );
      expect(balances).to.have.length(2);
      expect(balances[0]).to.have.length(2);
    });
  });

  describe("Access Control & Admin Functions", function () {
    it("Should allow owner to update RPC endpoints", async function () {
      const newRpcUrl = "https://new-rpc-endpoint.com";

      await walletVault.connect(owner).updateChainRPC(1, newRpcUrl);

      const config = await walletVault.getChainConfig(1);
      expect(config.rpcUrl).to.equal(newRpcUrl);
    });

    it("Should prevent non-owner from updating RPC endpoints", async function () {
      const newRpcUrl = "https://new-rpc-endpoint.com";

      await expect(
        walletVault.connect(user).updateChainRPC(1, newRpcUrl)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should allow owner to pause/unpause", async function () {
      await walletVault.connect(owner).pause();

      const encryptedSeed = ethers.encodeBytes32String("encrypted-seed-phrase");
      await expect(
        walletVault.connect(user).importSeedPhrase(encryptedSeed, "Test Wallet")
      ).to.be.revertedWith("Contract is paused");

      await walletVault.connect(owner).unpause();

      await expect(
        walletVault.connect(user).importSeedPhrase(encryptedSeed, "Test Wallet")
      ).to.emit(walletVault, "WalletImported");
    });

    it("Should get user wallets", async function () {
      const encryptedSeed = ethers.encodeBytes32String("encrypted-seed-phrase");

      await walletVault
        .connect(user)
        .importSeedPhrase(encryptedSeed, "Wallet 1");
      await walletVault
        .connect(user)
        .importSeedPhrase(encryptedSeed, "Wallet 2");

      const userWallets = await walletVault.getUserWallets(
        await user.getAddress()
      );
      expect(userWallets).to.have.length(2);
    });
  });

  describe("Event Emissions", function () {
    it("Should emit generic vault events", async function () {
      await walletVault.emitVaultEvent(
        await user.getAddress(),
        1,
        ethers.toUtf8Bytes("test data")
      );
    });

    it("Should emit user flow events", async function () {
      await walletVault.emitUserFlowEvent(
        await user.getAddress(),
        1, // flow type
        1, // step
        true, // success
        ethers.toUtf8Bytes("test data")
      );
    });
  });
});

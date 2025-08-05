import { expect } from "chai";
import { ethers } from "hardhat";
import { MultiChainRPC } from "../typechain-types";

describe("MultiChainRPC", function () {
  let multiChainRPC: MultiChainRPC;
  let owner: any;
  let user: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const MultiChainRPC = await ethers.getContractFactory("MultiChainRPC");
    multiChainRPC = await MultiChainRPC.deploy();
  });

  describe("Chain Configuration", function () {
    it("Should have default chain configurations", async function () {
      const ethereumConfig = await multiChainRPC.getChainConfig(1);
      expect(ethereumConfig.name).to.equal("Ethereum");
      expect(ethereumConfig.chainId).to.equal(1);
      expect(ethereumConfig.isActive).to.be.true;

      const polygonConfig = await multiChainRPC.getChainConfig(2);
      expect(polygonConfig.name).to.equal("Polygon");
      expect(polygonConfig.chainId).to.equal(137);
      expect(polygonConfig.isActive).to.be.true;
    });

    it("Should get all supported chains", async function () {
      const allChains = await multiChainRPC.getAllChains();
      expect(allChains.length).to.equal(5); // ETH, MATIC, BSC, ARB, OP

      // Check that all default chains are present
      const chainNames = allChains.map((config) => config.name);
      expect(chainNames).to.include("Ethereum");
      expect(chainNames).to.include("Polygon");
      expect(chainNames).to.include("BSC");
      expect(chainNames).to.include("Arbitrum");
      expect(chainNames).to.include("Optimism");
    });

    it("Should allow owner to update RPC endpoints", async function () {
      const newRpcUrl = "https://new-ethereum-rpc.com";

      await expect(
        multiChainRPC.connect(owner).updateChainRPC(1, newRpcUrl)
      ).to.emit(multiChainRPC, "ChainConfigUpdated");

      const config = await multiChainRPC.getChainConfig(1);
      expect(config.rpcUrl).to.equal(newRpcUrl);
    });

    it("Should prevent non-owner from updating RPC endpoints", async function () {
      const newRpcUrl = "https://malicious-rpc.com";

      await expect(
        multiChainRPC.connect(user).updateChainRPC(1, newRpcUrl)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should reject updates to non-existent chains", async function () {
      const newRpcUrl = "https://new-rpc.com";

      await expect(
        multiChainRPC.connect(owner).updateChainRPC(99, newRpcUrl)
      ).to.be.revertedWith("Chain not supported");
    });
  });

  describe("Balance Operations", function () {
    it("Should get multi-chain balances", async function () {
      const testAddress = await user.getAddress();
      const chainTypes = [1, 2]; // Ethereum and Polygon

      const balances = await multiChainRPC.getMultiChainBalances(
        testAddress,
        chainTypes
      );
      expect(balances).to.have.length(2);

      expect(balances[0].chainType).to.equal(1);
      expect(balances[0].tokenSymbol).to.equal("ETH");
      expect(balances[1].chainType).to.equal(2);
      expect(balances[1].tokenSymbol).to.equal("MATIC");
    });

    it("Should get native balance for specific chain", async function () {
      const testAddress = await user.getAddress();

      const balance = await multiChainRPC.getNativeBalance(testAddress, 1);
      expect(balance).to.be.a("bigint");
    });

    it("Should batch get balances", async function () {
      const addresses = [await user.getAddress(), await owner.getAddress()];
      const chainTypes = [1, 2];

      const balances = await multiChainRPC.batchGetBalances(
        addresses,
        chainTypes
      );
      expect(balances).to.have.length(2); // 2 addresses
      expect(balances[0]).to.have.length(2); // 2 chains per address
      expect(balances[1]).to.have.length(2);
    });

    it("Should reject unsupported chains", async function () {
      const testAddress = await user.getAddress();
      const invalidChain = [99];

      await expect(
        multiChainRPC.getMultiChainBalances(testAddress, invalidChain)
      ).to.be.revertedWith("Chain not supported");
    });
  });

  describe("RPC Operations", function () {
    it("Should execute RPC calls", async function () {
      const result = await multiChainRPC.executeChainRPC(
        1,
        "eth_getBalance",
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address"],
          [await user.getAddress()]
        )
      );

      expect(result).to.not.be.empty;
    });

    it("Should handle different RPC methods", async function () {
      // Test eth_getTransactionCount
      const nonceResult = await multiChainRPC.executeChainRPC(
        1,
        "eth_getTransactionCount",
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address"],
          [await user.getAddress()]
        )
      );
      expect(nonceResult).to.not.be.empty;

      // Test eth_gasPrice
      const gasPriceResult = await multiChainRPC.executeChainRPC(
        1,
        "eth_gasPrice",
        "0x"
      );
      expect(gasPriceResult).to.not.be.empty;

      // Test generic method
      const genericResult = await multiChainRPC.executeChainRPC(
        1,
        "custom_method",
        "0x"
      );
      expect(genericResult).to.not.be.empty;
    });

    it("Should reject RPC calls to unsupported chains", async function () {
      await expect(
        multiChainRPC.executeChainRPC(99, "eth_getBalance", "0x")
      ).to.be.revertedWith("Chain not supported");
    });
  });

  describe("RPC Endpoint Management", function () {
    it("Should allow owner to add RPC endpoints", async function () {
      await multiChainRPC
        .connect(owner)
        .addRPCEndpoint(1, "https://backup-eth-rpc.com");

      const endpoints = await multiChainRPC.getChainEndpoints(1);
      expect(endpoints.length).to.be.greaterThan(0);
    });

    it("Should allow owner to remove RPC endpoints", async function () {
      await multiChainRPC
        .connect(owner)
        .addRPCEndpoint(1, "https://test-rpc.com");

      const endpointsBefore = await multiChainRPC.getChainEndpoints(1);
      const initialLength = endpointsBefore.length;

      await multiChainRPC
        .connect(owner)
        .removeRPCEndpoint(1, initialLength - 1);

      const endpointsAfter = await multiChainRPC.getChainEndpoints(1);
      expect(endpointsAfter[initialLength - 1].isActive).to.be.false;
    });

    it("Should prevent non-owner from managing endpoints", async function () {
      await expect(
        multiChainRPC
          .connect(user)
          .addRPCEndpoint(1, "https://malicious-rpc.com")
      ).to.be.revertedWith("Not authorized");

      await expect(
        multiChainRPC.connect(user).removeRPCEndpoint(1, 0)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should validate endpoint index when removing", async function () {
      await expect(
        multiChainRPC.connect(owner).removeRPCEndpoint(1, 999)
      ).to.be.revertedWith("Invalid endpoint index");
    });
  });

  describe("Price Feed Management", function () {
    it("Should allow owner to update price feeds", async function () {
      const newPrice = ethers.parseEther("4000"); // $4000

      await expect(
        multiChainRPC.connect(owner).updatePriceFeed(1, newPrice, "test-oracle")
      ).to.emit(multiChainRPC, "PriceFeedUpdated");
    });

    it("Should prevent non-owner from updating price feeds", async function () {
      const newPrice = ethers.parseEther("1000");

      await expect(
        multiChainRPC
          .connect(user)
          .updatePriceFeed(1, newPrice, "malicious-oracle")
      ).to.be.revertedWith("Not authorized");
    });

    it("Should reject price updates for unsupported chains", async function () {
      const newPrice = ethers.parseEther("1000");

      await expect(
        multiChainRPC
          .connect(owner)
          .updatePriceFeed(99, newPrice, "test-oracle")
      ).to.be.revertedWith("Chain not supported");
    });
  });

  describe("Cache Management", function () {
    it("Should allow owner to update balance cache", async function () {
      const testAddress = await user.getAddress();
      const balance = ethers.parseEther("10");

      await expect(
        multiChainRPC.connect(owner).updateBalanceCache(testAddress, 1, balance)
      ).to.emit(multiChainRPC, "BalanceFetched");
    });

    it("Should prevent non-owner from updating cache", async function () {
      const testAddress = await user.getAddress();
      const balance = ethers.parseEther("10");

      await expect(
        multiChainRPC.connect(user).updateBalanceCache(testAddress, 1, balance)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Configuration Management", function () {
    it("Should allow owner to update cache settings", async function () {
      await multiChainRPC.connect(owner).setCacheExpiry(600); // 10 minutes
      await multiChainRPC.connect(owner).setDefaultTimeout(15000); // 15 seconds
      await multiChainRPC.connect(owner).setMaxRetries(5);
    });

    it("Should prevent non-owner from updating settings", async function () {
      await expect(
        multiChainRPC.connect(user).setCacheExpiry(600)
      ).to.be.revertedWith("Not authorized");

      await expect(
        multiChainRPC.connect(user).setDefaultTimeout(15000)
      ).to.be.revertedWith("Not authorized");

      await expect(
        multiChainRPC.connect(user).setMaxRetries(5)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to pause/unpause", async function () {
      await multiChainRPC.connect(owner).pause();

      const testAddress = await user.getAddress();
      await expect(
        multiChainRPC.getMultiChainBalances(testAddress, [1])
      ).to.be.revertedWith("Contract is paused");

      await multiChainRPC.connect(owner).unpause();

      const balances = await multiChainRPC.getMultiChainBalances(testAddress, [
        1,
      ]);
      expect(balances).to.have.length(1);
    });

    it("Should prevent non-owner from pausing", async function () {
      await expect(multiChainRPC.connect(user).pause()).to.be.revertedWith(
        "Not authorized"
      );

      await expect(multiChainRPC.connect(user).unpause()).to.be.revertedWith(
        "Not authorized"
      );
    });
  });

  describe("Event Emissions", function () {
    it("Should emit vault events", async function () {
      await multiChainRPC.emitVaultEvent(
        await user.getAddress(),
        1,
        ethers.toUtf8Bytes("test data")
      );
    });

    it("Should emit user flow events", async function () {
      await multiChainRPC.emitUserFlowEvent(
        await user.getAddress(),
        1, // flow type
        1, // step
        true, // success
        ethers.toUtf8Bytes("test data")
      );
    });
  });
});

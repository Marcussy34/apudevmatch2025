import { HardhatUserConfig } from "hardhat/config";
import "@oasisprotocol/sapphire-hardhat";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";
import "./tasks";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Helper function to normalize private key format
const normalizePrivateKey = (privateKey: string): string => {
  // Remove 0x prefix if present
  let key = privateKey.replace(/^0x/, "");

  // If it's base64 encoded, convert to hex
  if (key.length > 64 && !/^[0-9a-fA-F]+$/.test(key)) {
    try {
      const buffer = Buffer.from(key, "base64");
      // Take only the first 32 bytes (64 hex characters) for the private key
      key = buffer.slice(0, 32).toString("hex");
    } catch (error) {
      console.warn("Failed to decode base64 private key, using as-is");
    }
  }

  return key;
};

const accounts = process.env.PRIVATE_KEY
  ? [normalizePrivateKey(process.env.PRIVATE_KEY)]
  : {
      mnemonic: "test test test test test test test test test test test junk",
      path: "m/44'/60'/0'/0",
      initialIndex: 0,
      count: 20,
      passphrase: "",
    };

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    sapphire: {
      url: "https://sapphire.oasis.io",
      chainId: 0x5afe,
      accounts,
    },
    "sapphire-testnet": {
      url: "https://testnet.sapphire.oasis.io",
      accounts,
      chainId: 0x5aff,
    },
    "sapphire-localnet": {
      // docker run -it -p8544-8548:8544-8548 ghcr.io/oasisprotocol/sapphire-localnet
      url: "http://localhost:8545",
      chainId: 0x5afd,
      accounts,
    },
  },
};

export default config;

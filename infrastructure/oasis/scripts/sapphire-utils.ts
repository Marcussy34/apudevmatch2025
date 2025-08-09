import { ethers } from "hardhat";
import {
  wrapEthersProvider,
  wrapEthersSigner,
} from "@oasisprotocol/sapphire-ethers-v6";

/**
 * Universal Sapphire wrapper utility for all scripts
 * Automatically detects Sapphire networks and applies encryption
 */

// Sapphire network chain IDs
const SAPPHIRE_NETWORKS = {
  MAINNET: 0x5afe,
  TESTNET: 0x5aff,
  LOCALNET: 0x5afd,
};

/**
 * Wraps a signer for Sapphire networks to enable automatic encryption
 * @param signer - The ethers signer to wrap
 * @returns Wrapped signer with encryption for Sapphire networks, or original signer for other networks
 */
export async function getSapphireWrappedSigner(signer: any) {
  const network = await signer.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  const isSapphireNetwork = Object.values(SAPPHIRE_NETWORKS).includes(chainId);

  if (isSapphireNetwork) {
    console.log(`🔐 Using Sapphire encryption for network ${chainId} (${getSapphireNetworkName(chainId)})`);
    return wrapEthersSigner(signer);
  }

  console.log(`📡 Using regular ethers for network ${chainId} (not Sapphire)`);
  return signer;
}

/**
 * Gets a contract instance with automatic Sapphire wrapping
 * @param contractName - Name of the contract
 * @param contractAddress - Address of the deployed contract
 * @param signerIndex - Index of signer to use (default: 0)
 * @returns Contract instance with Sapphire encryption if on Sapphire network
 */
export async function getSapphireContract(
  contractName: string, 
  contractAddress: string, 
  signerIndex: number = 0
) {
  const signers = await ethers.getSigners();
  const signer = signers[signerIndex];
  
  // Wrap signer for Sapphire networks
  const wrappedSigner = await getSapphireWrappedSigner(signer);
  
  // Get contract instance
  const contract = await ethers.getContractAt(contractName, contractAddress);
  
  // Connect with wrapped signer
  return contract.connect(wrappedSigner);
}

/**
 * Gets the first signer wrapped for Sapphire encryption
 * @returns Wrapped signer ready for encrypted transactions
 */
export async function getSapphireDeployer() {
  const [deployer] = await ethers.getSigners();
  return await getSapphireWrappedSigner(deployer);
}

/**
 * Helper to get human-readable network name
 */
function getSapphireNetworkName(chainId: number): string {
  switch (chainId) {
    case SAPPHIRE_NETWORKS.MAINNET:
      return "Sapphire Mainnet";
    case SAPPHIRE_NETWORKS.TESTNET:
      return "Sapphire Testnet";
    case SAPPHIRE_NETWORKS.LOCALNET:
      return "Sapphire Localnet";
    default:
      return "Unknown";
  }
}

/**
 * Logs deployment info with encryption status
 */
export async function logNetworkInfo() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const isSapphire = Object.values(SAPPHIRE_NETWORKS).includes(chainId);
  
  console.log("📋 Network Information:");
  console.log(`   Network: ${network.name} (Chain ID: ${chainId})`);
  console.log(`   Address: ${deployer.address}`);
  console.log(`   Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ROSE`);
  console.log(`   Encryption: ${isSapphire ? '🔐 ENABLED (Sapphire)' : '📡 DISABLED (Not Sapphire)'}`);
  console.log("");
}

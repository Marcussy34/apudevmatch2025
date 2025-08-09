# Security NFT Deployment Guide

## 🚀 Quick Start

### Step 1: Deploy the SUI Contract

1. **Install SUI CLI** (if not already installed):
   ```bash
   # Follow instructions at: https://docs.sui.io/guides/developer/getting-started/sui-install
   ```

2. **Configure for Testnet**:
   ```bash
   sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
   sui client switch --env testnet
   sui client faucet  # Get testnet SUI tokens
   ```

3. **Deploy the Contract**:
   ```bash
   cd SUI-contracts/security_nft
   sui move build
   sui client publish --gas-budget 20000000
   ```

4. **Copy the Package ID** from the deployment output and update your `.env`:
   ```
   VITE_SECURITY_NFT_PACKAGE_ID=0x[YOUR_PACKAGE_ID_HERE]
   ```

### Step 2: Test the Implementation

1. **Start the frontend**:
   ```bash
   cd webapp_frontend
   npm run dev
   ```

2. **Test NFT Minting**:
   - Connect your SUI wallet
   - Navigate to the security dashboard
   - Generate a security visualization
   - Click "Mint Security NFT"
   - Confirm the transaction

## 🎯 What You've Implemented

### ✅ Complete SUI NFT Solution

1. **Smart Contract** (`SUI-contracts/security_nft/sources/SecurityNFT.move`):
   - Proper SUI Move NFT with all standard fields
   - Security-specific metadata (total_checked, total_pwned)
   - Event emission for indexing
   - Transfer functionality

2. **Frontend Integration** (`webapp_frontend/src/components/AIArtwork.tsx`):
   - Dynamic security visualization generation
   - Proper SUI transaction construction
   - Error handling and user feedback
   - Wallet connection validation

3. **Features**:
   - Canvas-based cyberpunk security visualization
   - Real-time data from security scans
   - Proper NFT metadata structure
   - Transaction result tracking
   - Object ID extraction

### 🔧 Technical Implementation

The NFT minting process:

1. **Visualization**: Creates a dynamic canvas-based security visualization
2. **Metadata**: Packages security stats and description
3. **Transaction**: Calls `mint_security_nft` with proper parameters
4. **Result**: Extracts NFT object ID and displays success message

### 📋 Contract Functions

- `mint_security_nft()`: Main minting function
- `transfer_nft()`: Transfer to new owner
- Getter functions: `name()`, `description()`, `image_url()`, etc.

## 🚨 Important Notes

1. **Image Storage**: Currently using data URLs. For production, consider:
   - IPFS for decentralized storage
   - Walrus (already integrated in your project)
   - Other decentralized storage solutions

2. **Package ID**: Must be updated in `.env` after deployment

3. **Gas Budget**: 20M MIST should be sufficient for deployment

4. **Testnet**: Make sure you're on SUI testnet for testing

## 🎉 Success!

Your Security NFT implementation is now complete with:
- ✅ Proper SUI Move smart contract
- ✅ Frontend integration with SUI SDK
- ✅ Dynamic visualization generation
- ✅ Complete transaction handling
- ✅ Error handling and user feedback

The NFTs will represent unique security audit snapshots with embedded metadata about breach statistics!

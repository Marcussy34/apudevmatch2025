#!/bin/bash

# Deploy Security NFT Contract to SUI Testnet
echo "Deploying Security NFT contract to SUI Testnet..."

# Check if sui CLI is available
if ! command -v sui &> /dev/null; then
    echo "Error: sui CLI not found. Please install the SUI CLI first."
    echo "Visit: https://docs.sui.io/guides/developer/getting-started/sui-install"
    exit 1
fi

# Build the contract first
echo "Building the contract..."
sui move build

if [ $? -ne 0 ]; then
    echo "Error: Contract build failed"
    exit 1
fi

echo "Contract built successfully!"

# Deploy to testnet
echo "Deploying to testnet..."
sui client publish --gas-budget 20000000

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Security NFT contract deployed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Copy the Package ID from the deployment output above"
    echo "2. Update the VITE_SECURITY_NFT_PACKAGE_ID in webapp_frontend/.env"
    echo "3. Test the NFT minting functionality in the frontend"
    echo ""
else
    echo "❌ Deployment failed"
    exit 1
fi

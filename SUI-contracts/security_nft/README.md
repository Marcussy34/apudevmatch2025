# Security NFT Contract

This SUI Move contract implements a Security NFT that represents security audit snapshots from the Grand Warden security platform.

## Features

- **Security Data Storage**: Stores total checked and total pwned account counts
- **Metadata Support**: Includes name, description, and image URL
- **Event Emission**: Emits events when NFTs are minted for indexing
- **Transfer Support**: Standard SUI NFT transfer functionality

## Contract Structure

### SecurityNFT Struct
```move
struct SecurityNFT has key, store {
    id: UID,
    name: String,
    description: String,
    image_url: Url,
    total_checked: u64,
    total_pwned: u64,
    created_at: u64,
    creator: address,
}
```

### Main Functions

- `mint_security_nft()`: Mints a new Security NFT with audit data
- `transfer_nft()`: Transfers NFT to a new owner
- Getter functions for all NFT properties

## Deployment

### Prerequisites

1. Install SUI CLI: https://docs.sui.io/guides/developer/getting-started/sui-install
2. Configure SUI CLI for testnet:
   ```bash
   sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
   sui client switch --env testnet
   ```
3. Get testnet SUI tokens from the faucet:
   ```bash
   sui client faucet
   ```

### Deploy Steps

1. **Build the contract:**
   ```bash
   cd SUI-contracts/security_nft
   sui move build
   ```

2. **Deploy to testnet:**
   ```bash
   sui client publish --gas-budget 20000000
   ```

3. **Update frontend configuration:**
   - Copy the Package ID from the deployment output
   - Update `VITE_SECURITY_NFT_PACKAGE_ID` in `webapp_frontend/.env`

### Example Deployment Output

Look for output like this:
```
Successfully verified dependencies
Transaction Digest: 2x3Abc...
╭─────────────────────────────────────────────────────────────────────────────╮
│ Package ID: 0x1234567890abcdef1234567890abcdef12345678                        │
╰─────────────────────────────────────────────────────────────────────────────╯
```

Copy the Package ID and add it to your `.env` file:
```
VITE_SECURITY_NFT_PACKAGE_ID=0x1234567890abcdef1234567890abcdef12345678
```

## Testing

After deployment, you can test the NFT minting functionality:

1. Connect your wallet in the frontend
2. Generate a security visualization
3. Click "Mint Security NFT"
4. Confirm the transaction in your wallet

## Contract Functions

### Entry Functions

- `mint_security_nft(name, description, image_url, total_checked, total_pwned, ctx)`
- `transfer_nft(nft, recipient, ctx)`

### View Functions

- `name(nft)` - Returns NFT name
- `description(nft)` - Returns NFT description  
- `image_url(nft)` - Returns image URL
- `total_checked(nft)` - Returns total checked count
- `total_pwned(nft)` - Returns total pwned count
- `created_at(nft)` - Returns creation timestamp
- `creator(nft)` - Returns creator address

## Integration

The frontend integration is handled in `webapp_frontend/src/components/AIArtwork.tsx`. The component:

1. Generates a dynamic security visualization
2. Allows users to mint it as an NFT
3. Calls the `mint_security_nft` function with proper parameters
4. Handles transaction results and displays success/error states

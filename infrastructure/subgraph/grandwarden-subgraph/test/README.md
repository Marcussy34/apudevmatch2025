# Grand Warden Real-Time Indexing Test

This test suite verifies that your subgraph captures contract events in real-time once fully synced.

## 🎯 What This Test Does

1. **Sync Check**: Verifies subgraph is caught up with the network
2. **Baseline Recording**: Records current state before transaction
3. **Contract Interaction**: Registers a new device via DeviceRegistry
4. **Real-Time Monitoring**: Watches for the event to appear in subgraph
5. **Verification**: Confirms data integrity and timing

## 🚀 Quick Start

```bash
# Navigate to test directory
cd infrastructure/subgraph/grandwarden-subgraph/test

# Install dependencies
npm install

# Set your private key
export PRIVATE_KEY="your_private_key_here"

# Run the comprehensive test
npm run test:realtime
```

## 📊 Test Output Example

```
🚀 COMPREHENSIVE REAL-TIME INDEXING TEST
==========================================
👤 Using wallet: 0xf7BCca8B40Be368291B49afF03FF2C9700F118A6
🌐 Network: Oasis Sapphire Testnet

📋 STEP 1: Checking subgraph status...
   Current block: 12901500
   Network block: 12901502
   Gap: 2 blocks
   Synced: YES

📋 STEP 4: Creating contract transaction...
📱 Registering device: RealTime Test Device 1754470123456
✅ Transaction confirmed in block: 12901503

📋 STEP 5: Monitoring for real-time capture...
🔍 Monitoring for device 0x1234... at block 12901503...
⏳ Waiting... 1 blocks behind (12901502/12901503)
📊 Subgraph reached block 12901503 (target: 12901503)
✅ Device found in subgraph!

🎉 SUCCESS! Real-time indexing confirmed!
⚡ Capture time: 8.3 seconds
```

## ⚙️ Configuration

Edit the `CONFIG` object in `realtime-indexing-test.ts`:

```typescript
const CONFIG = {
  SUBGRAPH_URL: "http://localhost:8000/subgraphs/name/grandwarden-vault",
  SAPPHIRE_RPC: "https://testnet.sapphire.oasis.io",
  DEVICE_REGISTRY: "0x9ec3B09A3cDc7Dd2ba8fB8F6e9Bd6C04DDfBCd2d",
  PRIVATE_KEY: process.env.PRIVATE_KEY || "YOUR_PRIVATE_KEY_HERE",
  REAL_TIME_THRESHOLD: 5, // blocks
};
```

## 🎯 Success Criteria

✅ **PASS**: Event appears in subgraph within 60 seconds  
❌ **FAIL**: Event not captured or takes longer than 2 minutes

## 🔧 Troubleshooting

### "Subgraph not synced"

- Wait for historical sync to complete
- Check Docker containers are running
- Verify network connectivity

### "Transaction failed"

- Check wallet balance (need ROSE for gas)
- Verify private key is correct
- Check contract address

### "Device not found in subgraph"

- Verify event handlers are working
- Check subgraph deployment
- Review Graph Node logs

## 📝 What This Proves

This test demonstrates that:

1. Your subgraph **actively monitors** the blockchain
2. Contract events are **captured immediately** when synced
3. Data **appears in GraphQL** within seconds of confirmation
4. The **entire pipeline** works end-to-end

**Once this test passes, you have confirmed real-time blockchain indexing! 🎉**

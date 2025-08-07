# Sui Integration Guide for Grand Warden ROFL

## Overview

Your ROFL worker is now clean and ready for Sui integration. When your friend completes the Sui contracts, follow these steps to integrate them.

## Current Status

✅ **Sapphire Integration**: Fully working - making real contract calls to AtomicVaultManager  
✅ **ROFL Structure**: Clean modular architecture ready for Sui  
✅ **Configuration**: Environment variables set up for Sui  
🚧 **Sui Integration**: Ready for your friend's contracts

## Integration Steps

### 1. Update Configuration

When Sui contracts are deployed, update `.env`:

```bash
# Replace 0x0 with actual deployed package ID
SUI_CONTRACT_PACKAGE=0x1234567890abcdef...
```

### 2. Update Sui Monitor

The Sui monitor (`src/monitoring/sui_monitor.rs`) is ready. You'll need to:

1. **Update event types** if your friend's contracts emit different events
2. **Implement real event parsing** in `parse_sui_events()` method
3. **Test the RPC connection** to Sui testnet

### 3. Event Translation

The main.rs already handles event translation from Sui to Sapphire format in `translate_sui_event()`. Update this function if needed based on your friend's event structure.

### 4. Testing Integration

```bash
# Build and test with Sui integration
docker build -t grand-warden-rofl-production:latest .
docker run --rm --env-file .env grand-warden-rofl-production:latest
```

## Current Working Features

### ✅ Sapphire Bridge (Proven Working)

- Real contract calls to AtomicVaultManager
- Proper gas fee handling (150 ROSE balance)
- Event emission with confirmation
- ~26,905 gas per successful transaction

### ✅ ROFL Architecture

- Modular structure matching BUILDPLAN.md
- Monitoring, bridging, processing, security modules
- Configuration management
- Error handling and logging

### 🚧 Ready for Sui

- Mock event generation (currently active)
- Event translation framework
- RPC client setup
- Configuration ready

## Example Sui Event Structure

Your friend's contracts should emit events that match this structure:

```move
// Example Sui Move events
public struct VaultCreated has copy, drop {
    user: address,
    vault_id: ID,
    timestamp: u64,
}

public struct DeviceRegistered has copy, drop {
    user: address,
    device_id: String,
    device_name: String,
    timestamp: u64,
}
```

## Quick Commands

```bash
# Test current working version (Sapphire only)
docker run --rm --env-file .env grand-warden-rofl-production:latest

# Check Sui RPC connection (when ready)
curl -X POST https://fullnode.testnet.sui.io:443 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "sui_getLatestCheckpointSequenceNumber"}'

# Monitor logs
docker logs -f $(docker ps -q --filter ancestor=grand-warden-rofl-production:latest)
```

## Next Steps

1. **Wait for Sui contracts** from your friend
2. **Update SUI_CONTRACT_PACKAGE** in .env
3. **Test Sui event querying**
4. **Verify end-to-end flow**: Sui event → ROFL → Sapphire → The Graph

Your ROFL worker is production-ready for the Sapphire side and architected for seamless Sui integration! 🚀

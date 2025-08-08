# Device Registry Contract Testing Guide

## Contract Address
Once deployed, your contract will be at: `0x[PACKAGE_ID]`

## Testing Commands

### 1. Create Device Registry
```bash
sui client call \
  --package 0x[PACKAGE_ID] \
  --module device_registry \
  --function create_device_registry \
  --args "0x64306c52dd66da85730bd0307cc4e81aec6c03aa97403833fde6489c4be81fc4" \
  --gas-budget 1000000
```

### 2. Register a Device
```bash
sui client call \
  --package 0x[PACKAGE_ID] \
  --module device_registry \
  --function register_device \
  --args "My iPhone" "device_001" "0x64306c52dd66da85730bd0307cc4e81aec6c03aa97403833fde6489c4be81fc4" \
  --gas-budget 1000000
```

### 3. Add Device to Registry
```bash
sui client call \
  --package 0x[PACKAGE_ID] \
  --module device_registry \
  --function add_device_to_registry \
  --args 0x[REGISTRY_ID] 0x[DEVICE_INFO_ID] \
  --gas-budget 1000000
```

### 4. Revoke a Device
```bash
sui client call \
  --package 0x[PACKAGE_ID] \
  --module device_registry \
  --function revoke_device \
  --args 0x[REGISTRY_ID] "device_001" "0x64306c52dd66da85730bd0307cc4e81aec6c03aa97403833fde6489c4be81fc4" \
  --gas-budget 1000000
```

### 5. Suspend a Device
```bash
sui client call \
  --package 0x[PACKAGE_ID] \
  --module device_registry \
  --function suspend_device \
  --args 0x[REGISTRY_ID] "device_001" "0x64306c52dd66da85730bd0307cc4e81aec6c03aa97403833fde6489c4be81fc4" \
  --gas-budget 1000000
```

### 6. Reactivate a Device
```bash
sui client call \
  --package 0x[PACKAGE_ID] \
  --module device_registry \
  --function reactivate_device \
  --args 0x[REGISTRY_ID] "device_001" "0x64306c52dd66da85730bd0307cc4e81aec6c03aa97403833fde6489c4be81fc4" \
  --gas-budget 1000000
```

### 7. Record Device Access
```bash
sui client call \
  --package 0x[PACKAGE_ID] \
  --module device_registry \
  --function record_device_access \
  --args 0x[REGISTRY_ID] "device_001" \
  --gas-budget 1000000
```

## View Functions (No Gas Required)

### Check Device Exists
```bash
sui client call \
  --package 0x[PACKAGE_ID] \
  --module device_registry \
  --function device_exists \
  --args 0x[REGISTRY_ID] "device_001"
```

### Get Total Devices
```bash
sui client call \
  --package 0x[PACKAGE_ID] \
  --module device_registry \
  --function get_total_devices \
  --args 0x[REGISTRY_ID]
```

## Expected Events for ROFL

The contract will emit these events that ROFL can listen to:

1. **DeviceRegistered** - When a device is registered
2. **DeviceRevoked** - When a device is revoked  
3. **DeviceSuspended** - When a device is suspended
4. **DeviceReactivated** - When a device is reactivated
5. **DeviceAccessed** - When device access is recorded

## Testing with Your zkLogin Address

Replace `0x64306c52dd66da85730bd0307cc4e81aec6c03aa97403833fde6489c4be81fc4` with your actual zkLogin address in all commands.

## Gas Requirements

- **Deployment**: ~5-10 SUI
- **Device Registration**: ~0.1 SUI
- **Device Management**: ~0.05 SUI
- **View Functions**: No gas required

## Next Steps

1. Get more test SUI from https://faucet.sui.io/
2. Deploy the contract
3. Test the functions with your zkLogin address
4. Verify events are emitted correctly
5. Set up ROFL to listen to these events


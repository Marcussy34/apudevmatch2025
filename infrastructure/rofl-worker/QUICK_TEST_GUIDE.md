# 🚀 Quick Testing Guide - Grand Warden ROFL

## ✅ **Cleanup Complete**

All unnecessary files have been removed. Your clean ROFL structure:

```
infrastructure/rofl-worker/
├── rofl.yaml                    # Official ROFL manifest
├── compose.yaml                 # Docker Compose for local testing
├── Dockerfile                   # Container definition
├── .env.development             # Development environment
├── src/                         # All Rust source code (preserved)
├── ROFL_SETUP_GUIDE.md         # Complete setup instructions
├── CONVERSION_COMPLETE.md       # Conversion summary
└── setup-windows.ps1            # Windows setup script
```

## 🧪 **Immediate Testing Steps**

### **Step 1: Test Container Build**

```powershell
# Build the container
docker build -t grand-warden-rofl:latest .
```

### **Step 2: Test Container Run**

```powershell
# Start the ROFL bridge
docker-compose up --build
```

**Expected Output:**

```
🔄 Starting Grand Warden ROFL Critical Data Bridge
📋 ROFL configuration loaded successfully
🌐 Sui RPC: https://fullnode.testnet.sui.io:443
⚡ Sapphire RPC: https://testnet.sapphire.oasis.dev
✅ ROFL Critical Data Bridge is now operational
🔍 Monitoring Sui network for Grand Warden events
⚡ Ready to emit synthetic Sapphire events
🏥 Health check server running on :8080
```

### **Step 3: Verify Health & Metrics**

Open new PowerShell windows and test:

```powershell
# Test health endpoint
curl http://localhost:8080/health

# Expected: {"status":"healthy","service":"grand-warden-rofl-bridge"}
```

```powershell
# Test metrics endpoint
curl http://localhost:9090/metrics

# Expected: Prometheus metrics output
```

### **Step 4: Watch Event Processing**

In the docker-compose logs, you should see:

```
📝 Generated mock Sui event: VaultCreated
⚡ Processing Sui event: VaultCreated
🔐 Emitting VaultCreated synthetic event
✅ Successfully emitted synthetic event
   TX Hash: 0x...
```

## 🎯 **Success Indicators**

✅ **Container builds without errors**
✅ **Health endpoint returns 200 OK**
✅ **Metrics endpoint shows data**
✅ **Mock events generate every 5 seconds**
✅ **Sapphire transactions succeed**

## 🔧 **If You Encounter Issues**

### **Build Errors**

```powershell
# Check Docker is running
docker --version

# Clean build
docker system prune -f
docker build --no-cache -t grand-warden-rofl:latest .
```

### **Network Errors**

```powershell
# Test Sapphire connectivity
curl -X POST https://testnet.sapphire.oasis.dev -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Expected: {"jsonrpc":"2.0","id":1,"result":"0x5aff"}
```

### **Port Conflicts**

If ports 8080 or 9090 are in use:

```yaml
# Edit compose.yaml ports section:
ports:
  - "9091:9090" # Change to available port
  - "8081:8080" # Change to available port
```

## 🚀 **Next Steps After Testing**

1. **✅ Verify Graph Integration**: Check if events appear in your subgraph
2. **✅ Test Frontend Connection**: Ensure React components can consume the data
3. **✅ Install Oasis CLI**: For production ROFL deployment
4. **✅ Deploy to Testnet**: `oasis rofl deploy --network testnet`

## 🎊 **Ready to Test!**

Your ROFL bridge is clean, complete, and ready for immediate testing. Run the steps above to verify everything works perfectly!

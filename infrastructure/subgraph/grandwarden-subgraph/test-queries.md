# Grand Warden Subgraph Test Queries

Your subgraph is successfully deployed and indexing! Here are some test queries you can use:

## GraphQL Endpoint

```
http://localhost:8000/subgraphs/name/grandwarden-vault
```

## Test Queries

### 1. Check Subgraph Sync Status

```graphql
{
  _meta {
    block {
      number
      hash
    }
    deployment
    hasIndexingErrors
  }
}
```

### 2. Get All Users

```graphql
{
  users(first: 10) {
    id
    totalVaults
    totalWallets
    totalDevices
    lastActivity
    createdAt
  }
}
```

### 3. Get Recent Vault Creations

```graphql
{
  vaults(first: 10, orderBy: createdAt, orderDirection: desc) {
    id
    owner {
      id
    }
    walrusCID
    suiTxHash
    isActive
    createdAt
    lastUpdated
  }
}
```

### 4. Get Recent Transactions

```graphql
{
  transactions(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    user {
      id
    }
    wallet {
      id
      name
    }
    txHash
    chainType
    timestamp
  }
}
```

### 5. Get Device Registrations

```graphql
{
  devices(first: 10) {
    id
    owner {
      id
    }
    deviceName
    isAuthorized
    isRevoked
    registeredAt
  }
}
```

### 6. Get Security Alerts

```graphql
{
  breachAlerts(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    user {
      id
    }
    severity
    message
    timestamp
  }
}
```

### 7. Daily Statistics

```graphql
{
  dailyStats(first: 7, orderBy: date, orderDirection: desc) {
    id
    date
    newUsers
    newVaults
    newWallets
    totalTransactions
  }
}
```

### 8. Real-time Subscription Example (WebSocket)

```graphql
subscription {
  breachAlerts(first: 1, orderBy: timestamp, orderDirection: desc) {
    id
    user {
      id
    }
    severity
    message
    timestamp
  }
}
```

## PowerShell Test Command

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/subgraphs/name/grandwarden-vault" -Method Post -Headers @{"Content-Type"="application/json"} -Body '{"query":"{_meta {block {number}}}"}'
```

## curl Test Command (if using WSL or Git Bash)

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  --data '{"query":"{_meta {block {number}}}"}' \
  http://localhost:8000/subgraphs/name/grandwarden-vault
```

## Contract Addresses Being Indexed

- **GrandWardenVault**: `0xB6B183a041D077d5924b340EBF41EE4546fE0bcE` (Block: 12891651)
- **WalletVault**: `0x3B7dd63D236bDB0Fd85d556d2AC70e2746cF5F82` (Block: 12891655)
- **DeviceRegistry**: `0x9ec3B09A3cDc7Dd2ba8fB8F6e9Bd6C04DDfBCd2d` (Block: 12891660)
- **RecoveryManager**: `0x58fF6e3d3D76053F2B13327A6399ECD25E363818` (Block: 12891663)
- **MultiChainRPC**: `0x2bcaA2dDbAE6609Cbd63D3a4B3dd0af881759472` (Block: 12891666)
- **AtomicVaultManager**: `0x811182419a4e4F419ec100ac0Cd63fc1Fef2810C` (Block: 12891668)

All contracts are deployed on **Oasis Sapphire Testnet** (Chain ID: 23295)

## What's Being Indexed

✅ **Password Vault Events**: Vault creation, updates, credential additions, breach alerts
✅ **Wallet Events**: Wallet imports, transaction signing, balance updates
✅ **Device Management**: Device registration, authorization, revocation
✅ **Security Events**: Breach alerts, unauthorized access attempts
✅ **Recovery Events**: Recovery session initiation, guardian approvals
✅ **Cross-chain Operations**: Multi-chain balance updates, operations
✅ **Atomic Operations**: Vault atomic updates with Walrus coordination

## Next Steps for ROFL Integration

When your ROFL worker is implemented, it will:

1. Listen to SUI blockchain events
2. Mirror those events to your Sapphire contracts
3. Emit synthetic events that this subgraph will automatically index
4. Provide unified GraphQL queries across both SUI and Sapphire

Your infrastructure is ready for Phase 2! 🚀

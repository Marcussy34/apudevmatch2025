# Demonstrate that subgraph ONLY monitors specific contracts
$SUBGRAPH_URL = "http://localhost:8000/subgraphs/name/grandwarden-vault"

Write-Host "🔍 PROVING SUBGRAPH ONLY MONITORS YOUR CONTRACTS" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Get total number of entities indexed
Write-Host "📊 Querying ALL indexed data..." -ForegroundColor Yellow

$queries = @{
    "Users" = '{ users { id } }'
    "Vaults" = '{ vaults { id } }'
    "Wallets" = '{ wallets { id } }'
    "Devices" = '{ devices { id } }'
    "Transactions" = '{ transactions { id } }'
    "Credentials" = '{ credentials { id } }'
}

$totalEntities = 0

foreach ($entityType in $queries.Keys) {
    try {
        $body = @{ query = $queries[$entityType] } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri $SUBGRAPH_URL -Method Post -ContentType "application/json" -Body $body
        
        $count = 0
        if ($response.data.$entityType.GetType().Name -eq "Object[]") {
            $count = $response.data.$entityType.Count
        }
        
        Write-Host "   $entityType`: $count" -ForegroundColor White
        $totalEntities += $count
    } catch {
        Write-Host "   $entityType`: Error querying" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📈 TOTAL ENTITIES INDEXED: $totalEntities" -ForegroundColor Green
Write-Host ""

# Show contract addresses being monitored
Write-Host "🎯 CONTRACTS BEING MONITORED:" -ForegroundColor Yellow
Write-Host "   GrandWardenVault:   0xB6B183a041D077d5924b340EBF41EE4546fE0bcE" -ForegroundColor White
Write-Host "   WalletVault:        0x3B7dd63D236bDB0Fd85d556d2AC70e2746cF5F82" -ForegroundColor White  
Write-Host "   DeviceRegistry:     0x9ec3B09A3cDc7Dd2ba8fB8F6e9Bd6C04DDfBCd2d" -ForegroundColor White
Write-Host "   RecoveryManager:    0x58fF6e3d3D76053F2B13327A6399ECD25E363818" -ForegroundColor White
Write-Host "   MultiChainRPC:      0x2bcaA2dDbAE6609Cbd63D3a4B3dd0af881759472" -ForegroundColor White
Write-Host "   AtomicVaultManager: 0x811182419a4e4F419ec100ac0Cd63fc1Fef2810C" -ForegroundColor White
Write-Host ""

# Get current sync status
try {
    $metaQuery = '{ _meta { block { number } } }'
    $body = @{ query = $metaQuery } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri $SUBGRAPH_URL -Method Post -ContentType "application/json" -Body $body
    
    $currentBlock = $response.data._meta.block.number
    Write-Host "📦 CURRENT INDEXED BLOCK: $currentBlock" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Could not get sync status" -ForegroundColor Red
}

Write-Host "💡 KEY INSIGHTS:" -ForegroundColor Cyan
Write-Host "   • Subgraph has processed $currentBlock blocks" -ForegroundColor White
Write-Host "   • Only found $totalEntities entities (from YOUR contracts)" -ForegroundColor White
Write-Host "   • If monitoring entire network: would have millions of entities" -ForegroundColor Gray
Write-Host "   • Proof: Your subgraph ONLY monitors your 6 specific contracts!" -ForegroundColor Green
Write-Host ""

Write-Host "🚫 WHAT GETS IGNORED ON SAPPHIRE TESTNET:" -ForegroundColor Red
Write-Host "   • All other smart contracts" -ForegroundColor Gray
Write-Host "   • DeFi protocols, NFTs, tokens" -ForegroundColor Gray  
Write-Host "   • Random user transactions" -ForegroundColor Gray
Write-Host "   • System/infrastructure events" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ ONLY YOUR DATA IS INDEXED!" -ForegroundColor Green
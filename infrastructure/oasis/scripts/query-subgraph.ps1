# Query Subgraph for Demo Results
param(
    [string]$UserAddress = ""
)

$SUBGRAPH_URL = "http://localhost:8000/subgraphs/name/grandwarden-vault"

Write-Host "🔍 QUERYING SUBGRAPH FOR DEMO RESULTS" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Function to run GraphQL query
function Invoke-SubgraphQuery {
    param($Query, $Description)
    
    Write-Host "📊 $Description" -ForegroundColor Yellow
    Write-Host "Query: $Query" -ForegroundColor Gray
    Write-Host ""
    
    try {
        $body = @{
            query = $Query
        } | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri $SUBGRAPH_URL -Method Post -ContentType "application/json" -Body $body
        
        if ($response.data) {
            Write-Host "✅ Results:" -ForegroundColor Green
            Write-Host ($response.data | ConvertTo-Json -Depth 10) -ForegroundColor White
        } elseif ($response.errors) {
            Write-Host "❌ Error:" -ForegroundColor Red
            Write-Host ($response.errors | ConvertTo-Json -Depth 10) -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Connection Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
    Write-Host ""
}

# 1. Check subgraph status
Invoke-SubgraphQuery -Query '{ _meta { hasIndexingErrors block { number } deployment } }' -Description "Subgraph Status"

# 2. Query recent users
$userQuery = if ($UserAddress) {
    "{ users(where: {id: `"$UserAddress`"}) { id totalVaults totalWallets totalDevices lastActivity createdAt } }"
} else {
    "{ users(first: 5, orderBy: lastActivity, orderDirection: desc) { id totalVaults totalWallets totalDevices lastActivity createdAt } }"
}
Invoke-SubgraphQuery -Query $userQuery -Description "Recent Users"

# 3. Query recent vaults
Invoke-SubgraphQuery -Query '{ vaults(first: 5, orderBy: createdAt, orderDirection: desc) { id owner { id } isActive createdAt lastUpdated } }' -Description "Recent Vaults"

# 4. Query recent credentials
Invoke-SubgraphQuery -Query '{ credentials(first: 5, orderBy: createdAt, orderDirection: desc) { id user { id } vault domain createdAt } }' -Description "Recent Credentials"

# 5. Query recent wallets
Invoke-SubgraphQuery -Query '{ wallets(first: 5, orderBy: createdAt, orderDirection: desc) { id owner { id } name isActive createdAt } }' -Description "Recent Wallets"

# 6. Query recent devices
Invoke-SubgraphQuery -Query '{ devices(first: 5, orderBy: registeredAt, orderDirection: desc) { id owner { id } name deviceAddress isActive registeredAt } }' -Description "Recent Devices"

# 7. Query daily stats
Invoke-SubgraphQuery -Query '{ dailyStats(first: 3, orderBy: date, orderDirection: desc) { id date newUsers newVaults newWallets newDevices totalTransactions } }' -Description "Daily Statistics"

Write-Host "🎯 SUBGRAPH QUERY COMPLETE!" -ForegroundColor Cyan
Write-Host ""
Write-Host "To query for a specific user, run:" -ForegroundColor Yellow
Write-Host "   .\query-subgraph.ps1 -UserAddress 0x..." -ForegroundColor Gray
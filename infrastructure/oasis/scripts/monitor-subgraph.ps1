# Real-time Subgraph Monitor for Grand Warden
param(
    [int]$IntervalSeconds = 5,
    [string]$SubgraphUrl = "http://localhost:8000/subgraphs/name/grandwarden-vault"
)

Write-Host "🔍 GRAND WARDEN SUBGRAPH MONITOR" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Subgraph URL: $SubgraphUrl" -ForegroundColor Gray
Write-Host "Update Interval: ${IntervalSeconds}s" -ForegroundColor Gray
Write-Host ""

$startTime = Get-Date
$lastBlock = 0

# Function to query subgraph
function Query-Subgraph {
    param($query)
    try {
        $body = @{ query = $query } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri $SubgraphUrl -Method Post -ContentType "application/json" -Body $body
        return $response
    } catch {
        Write-Host "❌ Query failed: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Function to display stats
function Show-Stats {
    # Get meta information
    $metaQuery = '{ _meta { hasIndexingErrors block { number hash } } }'
    $metaResult = Query-Subgraph $metaQuery
    
    if ($metaResult -and $metaResult.data._meta) {
        $meta = $metaResult.data._meta
        $currentBlock = $meta.block.number
        $hasErrors = $meta.hasIndexingErrors
        
        # Get entity counts
        $statsQuery = '{
            users { id }
            vaults { id }
            wallets { id }
            devices { id }
            credentials { id }
        }'
        $statsResult = Query-Subgraph $statsQuery
        
        $userCount = if ($statsResult.data.users) { $statsResult.data.users.Count } else { 0 }
        $vaultCount = if ($statsResult.data.vaults) { $statsResult.data.vaults.Count } else { 0 }
        $walletCount = if ($statsResult.data.wallets) { $statsResult.data.wallets.Count } else { 0 }
        $deviceCount = if ($statsResult.data.devices) { $statsResult.data.devices.Count } else { 0 }
        $credentialCount = if ($statsResult.data.credentials) { $statsResult.data.credentials.Count } else { 0 }
        
        # Calculate progress
        $elapsed = (Get-Date) - $startTime
        $blockProgress = $currentBlock - $script:lastBlock
        $script:lastBlock = $currentBlock
        
        # Display status
        Clear-Host
        Write-Host "🔍 GRAND WARDEN SUBGRAPH MONITOR" -ForegroundColor Cyan
        Write-Host "=================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⏰ Running Time: $($elapsed.ToString('mm\:ss'))" -ForegroundColor Gray
        Write-Host "📊 Status:" -ForegroundColor White
        Write-Host "   Current Block: $currentBlock" -ForegroundColor $(if ($blockProgress -gt 0) { "Green" } else { "Yellow" })
        Write-Host "   Block Progress: +$blockProgress (this interval)" -ForegroundColor $(if ($blockProgress -gt 0) { "Green" } else { "Gray" })
        Write-Host "   Has Errors: $hasErrors" -ForegroundColor $(if ($hasErrors) { "Red" } else { "Green" })
        Write-Host "   Block Hash: $($meta.block.hash)" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "📈 Indexed Entities:" -ForegroundColor White
        Write-Host "   👤 Users: $userCount" -ForegroundColor Cyan
        Write-Host "   🔐 Vaults: $vaultCount" -ForegroundColor Blue
        Write-Host "   💼 Wallets: $walletCount" -ForegroundColor Magenta
        Write-Host "   📱 Devices: $deviceCount" -ForegroundColor Yellow
        Write-Host "   🔑 Credentials: $credentialCount" -ForegroundColor Green
        Write-Host ""
        
        # Show recent activity if any
        if ($userCount -gt 0) {
            Write-Host "🔥 Recent Activity:" -ForegroundColor Yellow
            
            # Get latest user
            $latestUserQuery = '{ users(orderBy: createdAt, orderDirection: desc, first: 1) { id createdAt lastActivity } }'
            $latestUser = Query-Subgraph $latestUserQuery
            if ($latestUser.data.users -and $latestUser.data.users.Count -gt 0) {
                $user = $latestUser.data.users[0]
                Write-Host "   Latest User: $($user.id)" -ForegroundColor White
                Write-Host "   Created: $(Get-Date -Date ([DateTime]::UnixEpoch.AddSeconds($user.createdAt)))" -ForegroundColor Gray
            }
            
            # Get latest vault
            if ($vaultCount -gt 0) {
                $latestVaultQuery = '{ vaults(orderBy: createdAt, orderDirection: desc, first: 1) { id owner { id } createdAt } }'
                $latestVault = Query-Subgraph $latestVaultQuery
                if ($latestVault.data.vaults -and $latestVault.data.vaults.Count -gt 0) {
                    $vault = $latestVault.data.vaults[0]
                    Write-Host "   Latest Vault: $($vault.id)" -ForegroundColor White
                    Write-Host "   Owner: $($vault.owner.id)" -ForegroundColor Gray
                }
            }
        } else {
            Write-Host "💤 No indexed activity yet" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "📡 Contract Addresses Being Monitored:" -ForegroundColor Yellow
        Write-Host "   GrandWardenVault:   0xB6B183a041D077d5924b340EBF41EE4546fE0bcE" -ForegroundColor Gray
        Write-Host "   WalletVault:        0x3B7dd63D236bDB0Fd85d556d2AC70e2746cF5F82" -ForegroundColor Gray
        Write-Host "   DeviceRegistry:     0x9ec3B09A3cDc7Dd2ba8fB8F6e9Bd6C04DDfBCd2d" -ForegroundColor Gray
        Write-Host "   RecoveryManager:    0x58fF6e3d3D76053F2B13327A6399ECD25E363818" -ForegroundColor Gray

        Write-Host "   AtomicVaultManager: 0x811182419a4e4F419ec100ac0Cd63fc1Fef2810C" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Press Ctrl+C to stop monitoring..." -ForegroundColor Gray
        
    } else {
        Write-Host "❌ Cannot connect to subgraph" -ForegroundColor Red
    }
}

# Main monitoring loop
try {
    while ($true) {
        Show-Stats
        Start-Sleep -Seconds $IntervalSeconds
    }
} catch {
    Write-Host ""
    Write-Host "🛑 Monitoring stopped" -ForegroundColor Yellow
}
# Monitor Subgraph Sync Progress
param(
    [int]$TargetBlock = 12899752,
    [int]$IntervalSeconds = 5
)

$SUBGRAPH_URL = "http://localhost:8000/subgraphs/name/grandwarden-vault"

Write-Host "🔍 MONITORING SUBGRAPH SYNC PROGRESS" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Target Block (with our event): $TargetBlock" -ForegroundColor Yellow
Write-Host "Checking every $IntervalSeconds seconds..." -ForegroundColor Gray
Write-Host ""

$startTime = Get-Date

while ($true) {
    try {
        $response = Invoke-RestMethod -Uri $SUBGRAPH_URL -Method Post -ContentType "application/json" -Body '{"query":"{ _meta { hasIndexingErrors block { number } } }"}'
        
        $currentBlock = $response.data._meta.block.number
        $hasErrors = $response.data._meta.hasIndexingErrors
        $blocksRemaining = $TargetBlock - $currentBlock
        $progress = [math]::Max(0, [math]::Min(100, (($currentBlock - 12891650) / ($TargetBlock - 12891650)) * 100))
        
        $elapsed = (Get-Date) - $startTime
        
        Clear-Host
        Write-Host "🔍 SUBGRAPH SYNC MONITOR" -ForegroundColor Cyan
        Write-Host "========================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📊 Current Status:" -ForegroundColor White
        Write-Host "   Current Block: $currentBlock" -ForegroundColor Green
        Write-Host "   Target Block:  $TargetBlock" -ForegroundColor Yellow
        Write-Host "   Blocks Left:   $blocksRemaining" -ForegroundColor $(if ($blocksRemaining -le 0) { "Green" } else { "Red" })
        Write-Host "   Progress:      $([math]::Round($progress, 1))%" -ForegroundColor $(if ($progress -eq 100) { "Green" } else { "Yellow" })
        Write-Host "   Has Errors:    $hasErrors" -ForegroundColor $(if ($hasErrors) { "Red" } else { "Green" })
        Write-Host "   Elapsed Time:  $($elapsed.ToString('mm\:ss'))" -ForegroundColor Gray
        Write-Host ""
        
        if ($blocksRemaining -le 0) {
            Write-Host "🎉 SYNC COMPLETE! The subgraph has reached our target block!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🔍 Now querying for our vault data..." -ForegroundColor Cyan
            
            # Query for our specific vault
            $vaultQuery = '{"query":"{ vaults(where: {id: \"0xbd25b7f7f21b06d72777665e2beade469eacdab8c372fb6885d87f8b6407b7cb\"}) { id owner { id } isActive createdAt lastUpdated } }"}'
            $vaultResponse = Invoke-RestMethod -Uri $SUBGRAPH_URL -Method Post -ContentType "application/json" -Body $vaultQuery
            
            if ($vaultResponse.data.vaults.Count -gt 0) {
                Write-Host "✅ VAULT FOUND IN SUBGRAPH!" -ForegroundColor Green
                Write-Host ($vaultResponse.data.vaults | ConvertTo-Json -Depth 10) -ForegroundColor White
            } else {
                Write-Host "⚠️ Vault not found yet, may need a few more seconds..." -ForegroundColor Yellow
            }
            
            # Query for our user
            $userQuery = '{"query":"{ users(where: {id: \"0xf7bcca8b40be368291b49aff03ff2c9700f118a6\"}) { id totalVaults lastActivity createdAt } }"}'
            $userResponse = Invoke-RestMethod -Uri $SUBGRAPH_URL -Method Post -ContentType "application/json" -Body $userQuery
            
            if ($userResponse.data.users.Count -gt 0) {
                Write-Host ""
                Write-Host "✅ USER FOUND IN SUBGRAPH!" -ForegroundColor Green
                Write-Host ($userResponse.data.users | ConvertTo-Json -Depth 10) -ForegroundColor White
            }
            
            break
        }
        
        # Progress bar
        $progressBar = "["
        $filled = [math]::Floor($progress / 5)
        for ($i = 0; $i -lt 20; $i++) {
            if ($i -lt $filled) {
                $progressBar += "█"
            } else {
                $progressBar += "░"
            }
        }
        $progressBar += "]"
        
        Write-Host "   $progressBar $([math]::Round($progress, 1))%" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Press Ctrl+C to stop monitoring..." -ForegroundColor Gray
        
        Start-Sleep -Seconds $IntervalSeconds
        
    } catch {
        Write-Host "❌ Error querying subgraph: $($_.Exception.Message)" -ForegroundColor Red
        Start-Sleep -Seconds $IntervalSeconds
    }
}
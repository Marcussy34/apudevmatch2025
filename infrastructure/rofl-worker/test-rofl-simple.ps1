# Simple ROFL test script
Write-Host "Testing Grand Warden ROFL Setup" -ForegroundColor Green

# Check if Docker is available
try {
    $dockerVersion = docker --version
    Write-Host "Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker not available" -ForegroundColor Red
    exit 1
}

# Check ROFL files exist
$files = @("rofl.yaml", "compose.yaml", "Dockerfile", "src/main.rs")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Found: $file" -ForegroundColor Green
    } else {
        Write-Host "Missing: $file" -ForegroundColor Red
    }
}

Write-Host "ROFL structure verification complete" -ForegroundColor Yellow
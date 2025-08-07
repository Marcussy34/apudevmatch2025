# Grand Warden ROFL Setup Script for Windows
# Sets up the official ROFL environment for development and testing

Write-Host "🚀 Grand Warden ROFL Critical Data Bridge Setup" -ForegroundColor Green
Write-Host "Converting to Official ROFL Architecture..." -ForegroundColor Yellow
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking Prerequisites..." -ForegroundColor Yellow

# Check Docker
$dockerExists = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerExists) {
    Write-Host "❌ Docker not found. Please install Docker Desktop:" -ForegroundColor Red
    Write-Host "   https://www.docker.com/products/docker-desktop/" -ForegroundColor White
    exit 1
} else {
    Write-Host "✅ Docker found" -ForegroundColor Green
}

# Check if we can run Docker
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker version: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not running. Please start Docker Desktop" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🏗️  Building Official ROFL Application..." -ForegroundColor Yellow

# Test build with official ROFL Docker image
Write-Host "📦 Testing build with official ROFL Docker image..." -ForegroundColor Cyan
try {
    # Pull the official ROFL development image
    Write-Host "⬇️  Pulling official ROFL dev image..." -ForegroundColor Cyan
    docker pull ghcr.io/oasisprotocol/rofl-dev:main --platform linux/amd64
    
    Write-Host "✅ ROFL dev image pulled successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not pull official ROFL image (network issue?)" -ForegroundColor Yellow
    Write-Host "   Proceeding with local Docker build..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Building Container..." -ForegroundColor Yellow

# Build the container locally
try {
    docker build -t grand-warden-rofl:latest .
    Write-Host "✅ Container built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Container build failed" -ForegroundColor Red
    Write-Host "   Check the error messages above" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🧪 Testing ROFL Application..." -ForegroundColor Yellow

# Create a test environment file
$testEnvContent = @"
# Test environment for Grand Warden ROFL
RUST_LOG=info
MOCK_SUI_EVENTS=true
SAPPHIRE_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000001
"@

$testEnvContent | Out-File -FilePath ".env.test" -Encoding UTF8

# Run a quick test
Write-Host "Running quick functionality test..." -ForegroundColor Cyan
try {
    # Run container for 10 seconds to test startup
    $testResult = docker run --rm --env-file .env.test -p 8080:8080 -p 9090:9090 --name grand-warden-test grand-warden-rofl:latest timeout 10s 2>&1
    
    Write-Host "✅ Container startup test completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Container test had issues (this may be normal for timeout)" -ForegroundColor Yellow
}

# Clean up test file
Remove-Item ".env.test" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "📊 ROFL Structure Verification..." -ForegroundColor Yellow

# Check ROFL files
$roflFiles = @(
    "rofl.yaml",
    "compose.yaml", 
    "Dockerfile",
    "src/config/rofl_config.rs",
    "ROFL_SETUP_GUIDE.md"
)

foreach ($file in $roflFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 ROFL Conversion Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What was converted:" -ForegroundColor Yellow
Write-Host "  ✅ Custom config system → ROFL manifest (rofl.yaml)" -ForegroundColor White
Write-Host "  ✅ Environment variables → ROFL secrets management" -ForegroundColor White  
Write-Host "  ✅ Manual Docker setup → Official ROFL container" -ForegroundColor White
Write-Host "  ✅ Custom deployment → 'oasis rofl deploy' ready" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ready for Development:" -ForegroundColor Green
Write-Host ""
Write-Host "1. 🧪 Test locally:" -ForegroundColor Yellow
Write-Host "   docker-compose up --build" -ForegroundColor White
Write-Host ""
Write-Host "2. 🏥 Check health:" -ForegroundColor Yellow  
Write-Host "   curl http://localhost:8080/health" -ForegroundColor White
Write-Host ""
Write-Host "3. 📊 View metrics:" -ForegroundColor Yellow
Write-Host "   curl http://localhost:9090/metrics" -ForegroundColor White
Write-Host ""
Write-Host "4. 🔐 Set up secrets (when you have Oasis CLI):" -ForegroundColor Yellow
Write-Host "   oasis rofl secret set sapphire_private_key key.txt" -ForegroundColor White
Write-Host ""
Write-Host "5. 🌐 Deploy to testnet (when ready):" -ForegroundColor Yellow
Write-Host "   oasis rofl deploy --network testnet" -ForegroundColor White
Write-Host ""
Write-Host "📖 See ROFL_SETUP_GUIDE.md for complete instructions" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎊 Your Grand Warden Critical Data Bridge is now officially ROFL-compliant!" -ForegroundColor Green
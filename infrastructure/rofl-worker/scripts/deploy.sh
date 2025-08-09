#!/bin/bash

# Grand Warden ROFL Worker Deployment Script
# Phase 4: Complete ROFL Sui Mirror Implementation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "Cargo.simple.toml" ]; then
    print_error "Must be run from infrastructure/rofl-worker directory"
    exit 1
fi

print_status "🚀 Starting Grand Warden ROFL Worker Deployment"
print_status "📋 Phase 4: Complete ROFL Sui Mirror Implementation"

# Check for required tools
print_status "🔧 Checking prerequisites..."

if ! command -v cargo &> /dev/null; then
    print_error "Rust/Cargo not found. Please install Rust: https://rustup.rs/"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    print_warning "Docker not found. ROFL builds may require Docker for TEE compatibility."
fi

print_success "Prerequisites check completed"

# Load environment variables if .env exists
if [ -f ".env" ]; then
    print_status "📄 Loading environment configuration from .env"
    set -a
    source .env
    set +a
else
    print_warning "No .env file found. Using defaults and environment variables."
    print_status "💡 Copy .env.example to .env for custom configuration"
fi

# Validate required environment variables
print_status "🔍 Validating configuration..."

if [ -z "$SAPPHIRE_PRIVATE_KEY" ]; then
    print_error "SAPPHIRE_PRIVATE_KEY is required"
    print_status "Generate a private key or copy from existing wallet"
    exit 1
fi

if [[ "$SAPPHIRE_PRIVATE_KEY" == "0x0000000000000000000000000000000000000000000000000000000000000000" ]]; then
    print_error "Please set a real SAPPHIRE_PRIVATE_KEY in .env (not the placeholder)"
    exit 1
fi

print_success "Configuration validation passed"

# Build the ROFL worker
print_status "🔨 Building ROFL worker..."

# Check if we should use release mode
if [ "$1" = "--release" ] || [ "$ROFL_RELEASE" = "true" ]; then
    print_status "🚀 Building in release mode for production"
    BUILD_MODE="--release"
    TARGET_DIR="target/release"
else
    print_status "🛠️ Building in debug mode for development"
    BUILD_MODE=""
    TARGET_DIR="target/debug"
fi

# Use Cargo.simple.toml as the manifest
cargo build $BUILD_MODE --manifest-path Cargo.simple.toml

if [ $? -eq 0 ]; then
    print_success "ROFL worker built successfully"
else
    print_error "Build failed"
    exit 1
fi

# Create storage directory if it doesn't exist
STORAGE_PATH="${STORAGE_PATH:-./rofl-storage}"
if [ ! -d "$STORAGE_PATH" ]; then
    print_status "📁 Creating storage directory: $STORAGE_PATH"
    mkdir -p "$STORAGE_PATH"
fi

# Check wallet balance if RPC is available
print_status "💰 Checking wallet configuration..."

if [ -n "$SAPPHIRE_RPC_URL" ]; then
    print_status "🔗 Sapphire RPC: $SAPPHIRE_RPC_URL"
    print_warning "💡 Ensure your wallet has sufficient ROSE for gas fees (minimum 0.1 ROSE recommended)"
else
    print_warning "SAPPHIRE_RPC_URL not set, using default testnet"
fi

# Display configuration summary
print_status "📋 Deployment Configuration Summary:"
echo "   🔗 Sapphire RPC: ${SAPPHIRE_RPC_URL:-https://testnet.sapphire.oasis.dev}"
echo "   🔗 Sui RPC: ${SUI_RPC_URL:-https://fullnode.testnet.sui.io:443}"
echo "   📄 Atomic Vault Manager: ${CONTRACT_ATOMIC_VAULT_MANAGER:-0x811182419a4e4F419ec100ac0Cd63fc1Fef2810C}"
echo "   📄 Device Registry: ${CONTRACT_DEVICE_REGISTRY:-0x5FbDB2315678afecb367f032d93F642f64180aa3}"
echo "   🆔 ROFL App ID: ${ROFL_APP_ID:-rofl1qqn9xndja7e2pnxhttktmecvwzz0yqwxsquqyxdf}"
echo "   💾 Storage Path: $STORAGE_PATH"
echo "   📊 Metrics Port: ${METRICS_PORT:-3000}"
echo "   🔧 Build Mode: $([ -n "$BUILD_MODE" ] && echo "Release" || echo "Debug")"

# Option to run immediately
if [ "$2" = "--run" ] || [ "$ROFL_AUTO_RUN" = "true" ]; then
    print_status "🚀 Starting ROFL worker..."
    
    # Set up signal handling for graceful shutdown
    trap 'print_status "📱 Received shutdown signal, stopping ROFL worker..."; kill $WORKER_PID 2>/dev/null; exit 0' INT TERM
    
    # Run the worker
    $TARGET_DIR/grand-warden-rofl &
    WORKER_PID=$!
    
    print_success "🌉 ROFL worker started (PID: $WORKER_PID)"
    print_status "📊 Metrics available at: http://localhost:${METRICS_PORT:-3000}/metrics"
    print_status "🏥 Health check at: http://localhost:${METRICS_PORT:-3000}/health"
    print_status "Press Ctrl+C to stop"
    
    # Wait for worker to finish
    wait $WORKER_PID
else
    print_success "🎉 ROFL worker deployment completed!"
    print_status ""
    print_status "📖 Next steps:"
    print_status "   1. Review configuration in .env"
    print_status "   2. Run: $TARGET_DIR/grand-warden-rofl"
    print_status "   3. Monitor: http://localhost:${METRICS_PORT:-3000}/metrics"
    print_status ""
    print_status "🚀 Quick start: ./scripts/deploy.sh --release --run"
fi

# Show additional resources
print_status ""
print_status "📚 Documentation:"
print_status "   📖 README: ./README.md"
print_status "   🔧 Configuration: ./.env.example"
print_status "   📊 Metrics: http://localhost:${METRICS_PORT:-3000}/metrics"
print_status "   🏥 Health: http://localhost:${METRICS_PORT:-3000}/health"

print_success "✅ Grand Warden ROFL Worker Phase 4 deployment ready!"

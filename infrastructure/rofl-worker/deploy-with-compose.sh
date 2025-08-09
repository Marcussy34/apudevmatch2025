#!/bin/bash

# Grand Warden ROFL Worker - Docker Compose Deployment Script
# This script helps deploy the application using docker-compose

set -e

echo "🐳 Grand Warden ROFL Worker - Docker Compose Deployment"
echo "======================================================="

# Check if compose.yaml exists
if [ ! -f "compose.yaml" ]; then
    echo "❌ Error: compose.yaml not found in current directory"
    exit 1
fi

echo "✅ Found compose.yaml"

# Check if .env file exists (for secrets)
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "Make sure to set your environment variables for:"
    echo "  - MY_SECRET_1"
    echo "  - MY_SECRET_2"
    echo ""
fi

# Show current compose.yaml configuration
echo "📋 Current compose.yaml configuration:"
echo "--------------------------------------"
cat compose.yaml
echo ""

# Check if the image name needs to be updated
if grep -q "org_name/image_name" compose.yaml; then
    echo "⚠️  NOTICE: The compose.yaml still contains placeholder image name"
    echo "You may want to update 'org_name/image_name' to your actual DockerHub image"
    echo "Example: 'yourusername/grand-warden-rofl:latest'"
    echo ""
fi

# Deployment options
echo "🚀 Deployment Options:"
echo "1. Build and run locally (uses local Dockerfile)"
echo "2. Pull from DockerHub and run (requires updated image name in compose.yaml)"
echo ""

read -p "Choose option (1 or 2): " choice

case $choice in
    1)
        echo "🔨 Building and starting with Docker Compose..."
        docker-compose -f compose.yaml up --build -d
        ;;
    2)
        echo "📥 Pulling and starting with Docker Compose..."
        docker-compose -f compose.yaml pull
        docker-compose -f compose.yaml up -d
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! Application deployed"
    echo ""
    echo "📊 Check status:"
    echo "    docker-compose -f compose.yaml ps"
    echo ""
    echo "📜 View logs:"
    echo "    docker-compose -f compose.yaml logs -f"
    echo ""
    echo "🛑 Stop application:"
    echo "    docker-compose -f compose.yaml down"
else
    echo "❌ Deployment failed"
    exit 1
fi



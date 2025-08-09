#!/bin/bash

# Grand Warden ROFL Worker - DockerHub Deployment Script
# This script will tag and push the locally built image to DockerHub

set -e

echo "🔧 Grand Warden ROFL Worker - DockerHub Deployment"
echo "=================================================="

# Check if user provided DockerHub username
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your DockerHub username"
    echo "Usage: $0 <dockerhub-username> [repository-name] [tag]"
    echo "Example: $0 myusername grand-warden-rofl latest"
    exit 1
fi

DOCKERHUB_USERNAME="$1"
REPO_NAME="${2:-grand-warden-rofl}"
TAG="${3:-latest}"
LOCAL_IMAGE="grand-warden-rofl:latest"
DOCKERHUB_IMAGE="$DOCKERHUB_USERNAME/$REPO_NAME:$TAG"

echo "📦 Configuration:"
echo "  Local image: $LOCAL_IMAGE"
echo "  DockerHub image: $DOCKERHUB_IMAGE"
echo ""

# Check if local image exists
if ! docker image inspect "$LOCAL_IMAGE" >/dev/null 2>&1; then
    echo "❌ Error: Local image '$LOCAL_IMAGE' not found!"
    echo "Please run 'docker build -t grand-warden-rofl:latest .' first"
    exit 1
fi

echo "✅ Local image found"

# Check Docker login status
if ! docker info | grep -q "Username"; then
    echo "🔐 You need to login to DockerHub first:"
    echo "Please run: docker login"
    echo ""
    read -p "Press Enter after you've logged in to continue..."
fi

# Tag the image for DockerHub
echo "🏷️  Tagging image for DockerHub..."
docker tag "$LOCAL_IMAGE" "$DOCKERHUB_IMAGE"
echo "✅ Image tagged as: $DOCKERHUB_IMAGE"

# Push to DockerHub
echo "🚀 Pushing to DockerHub..."
docker push "$DOCKERHUB_IMAGE"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! Image pushed to DockerHub"
    echo "📍 DockerHub URL: https://hub.docker.com/r/$DOCKERHUB_USERNAME/$REPO_NAME"
    echo ""
    echo "📝 To use this image in your compose.yaml, update the image line to:"
    echo "    image: \"$DOCKERHUB_IMAGE\""
    echo ""
    echo "🔄 To pull and run this image:"
    echo "    docker pull $DOCKERHUB_IMAGE"
    echo "    docker run $DOCKERHUB_IMAGE"
else
    echo "❌ Failed to push image to DockerHub"
    exit 1
fi



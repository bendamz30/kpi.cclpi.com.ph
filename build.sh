#!/bin/bash

# Sales Dashboard Frontend Build Script
# This script handles the build process for the Next.js frontend

echo "========================================="
echo "Sales Dashboard Frontend Build"
echo "========================================="

# Check if .env.production file exists
if [ ! -f .env.production ]; then
    echo "Warning: .env.production file not found!"
    echo "Using default environment variables..."
fi

# Install dependencies
echo "Installing npm dependencies..."
npm ci --production=false

# Run build
echo "Building Next.js application..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "Build completed successfully!"
    echo "========================================="
    echo ""
    echo "To start the production server, run:"
    echo "  npm start"
    echo ""
    echo "Or for PM2:"
    echo "  pm2 start npm --name 'sales-dashboard' -- start"
else
    echo ""
    echo "========================================="
    echo "Build failed!"
    echo "========================================="
    exit 1
fi


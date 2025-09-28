#!/bin/bash

set -e

echo "🏗️  Building all packages..."

# Clean previous builds
pnpm clean

# Build packages in dependency order
echo "📦 Building core package..."
pnpm nx build core

echo "📦 Building React package..."
pnpm nx build react

echo "📦 Building CLI package..."
pnpm nx build cli

echo "✅ All packages built successfully!"

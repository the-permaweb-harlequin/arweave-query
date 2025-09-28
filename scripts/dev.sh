#!/bin/bash

set -e

echo "🚀 Starting development mode..."

# Start all packages in watch mode
pnpm nx run-many --target=dev --parallel

echo "👀 Watching for changes..."

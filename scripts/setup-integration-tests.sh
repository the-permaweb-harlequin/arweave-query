#!/bin/bash

# Setup script for integration tests
# This script prepares the environment for running integration tests

set -e

echo "🚀 Setting up integration test environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -n "Checking Docker... "
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Error: Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC}"

# Check if Docker can pull images
echo -n "Checking Docker permissions... "
if ! docker pull hello-world > /dev/null 2>&1; then
    echo -e "${RED}✗${NC}"
    echo -e "${YELLOW}Warning: Cannot pull Docker images. You may need to run with sudo or add your user to the docker group.${NC}"
else
    echo -e "${GREEN}✓${NC}"
    docker rmi hello-world > /dev/null 2>&1 || true
fi

# Check if Node.js is installed
echo -n "Checking Node.js... "
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js 18+ and try again.${NC}"
    exit 1
fi
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Error: Node.js version 18+ is required (you have v$NODE_VERSION).${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} (v$(node --version))"

# Check if pnpm is installed
echo -n "Checking pnpm... "
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}✗${NC}"
    echo -e "${YELLOW}pnpm is not installed. Installing...${NC}"
    npm install -g pnpm
fi
echo -e "${GREEN}✓${NC} (v$(pnpm --version))"

# Check if parquet fixtures exist
echo -n "Checking parquet fixtures... "
if [ ! -f "fixtures/parquet/blocks.parquet" ] || \
   [ ! -f "fixtures/parquet/transactions.parquet" ] || \
   [ ! -f "fixtures/parquet/tags.parquet" ]; then
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Error: Parquet fixtures not found in fixtures/parquet/${NC}"
    echo -e "${YELLOW}Please ensure the following files exist:${NC}"
    echo "  - fixtures/parquet/blocks.parquet"
    echo "  - fixtures/parquet/transactions.parquet"
    echo "  - fixtures/parquet/tags.parquet"
    exit 1
fi
echo -e "${GREEN}✓${NC}"

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Build the package
echo "Building package..."
cd packages/core
pnpm build
cd ../..

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "You can now run integration tests:"
echo "  - All tests:     ${GREEN}cd packages/core && pnpm test:integration${NC}"
echo "  - Node only:     ${GREEN}cd packages/core && pnpm test:integration:node${NC}"
echo "  - Browser only:  ${GREEN}cd packages/core && pnpm test:integration:browser${NC}"
echo ""
echo "Note: First run will be slower as it downloads the AR-IO node Docker image."


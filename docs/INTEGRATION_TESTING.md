# Integration Testing Guide

This guide explains how to run integration tests for the arweave-query package.

## Overview

Integration tests verify that the package works correctly with a real AR-IO node infrastructure. The tests use:

- **Testcontainers**: Automatically manages Docker containers for testing
- **AR-IO Node**: Runs in a Docker container with parquet datasets
- **Vitest**: Test framework with support for both Node.js and browser environments
- **Playwright**: For browser automation in headless Chrome

## Prerequisites

1. **Docker**: Must be installed and running

   ```bash
   docker --version
   ```

2. **Build the package**: Integration tests use the built package

   ```bash
   cd packages/core
   pnpm build
   ```

3. **Install dependencies**: Make sure all dependencies are installed
   ```bash
   pnpm install
   ```

## Running Tests

### Quick Start

Run all integration tests:

```bash
cd packages/core
pnpm test:integration
```

### Node.js Integration Tests

Run tests in Node.js environment only:

```bash
cd packages/core
pnpm test:integration:node
```

These tests verify:

- DuckDB Node.js bindings work correctly
- Parquet file reading and querying
- Transaction and block queries
- Filtering and pagination

### Browser Integration Tests

Run tests in headless Chrome only:

```bash
cd packages/core
pnpm test:integration:browser
```

These tests verify:

- DuckDB WASM initialization in browser
- Parquet file reading in browser environment
- Same query functionality as Node.js tests
- Browser-specific edge cases

## Test Structure

```
packages/core/tests/integration/
├── README.md                      # Detailed integration test docs
├── testcontainers-helper.ts      # AR-IO node container management
├── node/
│   ├── setup.ts                  # Node test setup (starts container)
│   └── parquet-query.test.ts     # Node integration tests
└── browser/
    ├── setup.ts                  # Browser test setup (starts container)
    └── parquet-query.test.ts     # Browser integration tests
```

## How It Works

### 1. Container Lifecycle

```
┌─────────────────────┐
│  Test Suite Starts  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│ Pull AR-IO Node Image       │
│ (first run only)            │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Start Container             │
│ - Mount parquet fixtures    │
│ - Configure environment     │
│ - Expose port 4000          │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Wait for Health Check       │
│ - Check /ar-io/info         │
│ - Verify datasets endpoint  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Run All Tests               │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Stop & Remove Container     │
└─────────────────────────────┘
```

### 2. Test Fixtures

Parquet fixtures are located at `fixtures/parquet/`:

- `blocks.parquet` - Block data
- `transactions.parquet` - Transaction data
- `tags.parquet` - Tag data

These are mounted to `/app/data/datasets` in the container.

### 3. Package Usage

Tests import from the **built package** (not source):

```typescript
import { createNodeParquetProvider } from '@arweave-query/core/node';
```

This ensures tests verify the actual package that users will consume.

## Configuration Files

### `vitest.config.integration.ts`

Node.js integration test configuration:

- Runs in Node environment
- Single-threaded to avoid port conflicts
- 2-minute timeout for container startup
- Uses built package via path aliases

### `vitest.config.browser.ts`

Browser integration test configuration:

- Runs in headless Chromium via Playwright
- Same timeout and threading settings
- Browser-specific test environment
- Uses built package via path aliases

## Environment Variables

You can customize the AR-IO node configuration:

```bash
# Example: Use a different AR-IO image
export ARIO_IMAGE=ghcr.io/ar-io/ar-io-core:develop

# Run tests
pnpm test:integration
```

## Troubleshooting

### Container Fails to Start

If the AR-IO container fails to start:

1. Check Docker is running:

   ```bash
   docker ps
   ```

2. Check Docker logs:

   ```bash
   docker logs ar-io-node
   ```

3. Verify fixtures exist:
   ```bash
   ls -la fixtures/parquet/
   ```

### Tests Timeout

If tests timeout:

1. Increase timeout in test configs (default: 120s)
2. Check network connectivity
3. Ensure Docker has sufficient resources

### Port Conflicts

Testcontainers automatically maps to available ports. If you see port conflicts:

1. Stop conflicting services
2. Or let Testcontainers handle port mapping (it finds free ports)

### Build Errors

If you get import errors:

1. Rebuild the package:

   ```bash
   pnpm build
   ```

2. Check the `dist/` directory exists:
   ```bash
   ls -la packages/core/dist/
   ```

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  integration:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build package
        run: pnpm build

      - name: Run integration tests
        run: |
          cd packages/core
          pnpm test:integration
```

## Writing New Integration Tests

To add new integration tests:

1. Create test file in appropriate directory:
   - `tests/integration/node/` for Node tests
   - `tests/integration/browser/` for Browser tests

2. Access the AR-IO node:

   ```typescript
   const arIONode = (global as any).__ARIO_NODE__;
   ```

3. Create provider:

   ```typescript
   const provider = createNodeParquetProvider({
     parquetUrls: {
       blocks: `${arIONode.datasetsUrl}/blocks.parquet`,
       transactions: `${arIONode.datasetsUrl}/transactions.parquet`,
       tags: `${arIONode.datasetsUrl}/tags.parquet`,
     },
     duckdbConfig: {
       readOnly: true,
       memory: ':memory:',
     },
   });
   ```

4. Write tests using Vitest:
   ```typescript
   it('should do something', async () => {
     const result = await provider.getTransactions({ first: 10 });
     expect(result.data).toBeDefined();
   });
   ```

## Performance Considerations

- **First Run**: Slower due to Docker image pull (~1-2 minutes)
- **Subsequent Runs**: Faster using cached image (~30-60 seconds)
- **Container Startup**: ~30 seconds for AR-IO node to be ready
- **Test Execution**: Usually < 10 seconds

## Further Reading

- [Testcontainers Documentation](https://testcontainers.com/)
- [Vitest Documentation](https://vitest.dev/)
- [AR-IO Node Documentation](https://github.com/ar-io/ar-io-node)
- [Playwright Documentation](https://playwright.dev/)

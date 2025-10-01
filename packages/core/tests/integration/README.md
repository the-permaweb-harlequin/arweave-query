# Integration Tests

This directory contains integration tests for the arweave-query package using real AR-IO node infrastructure via Testcontainers.

## Structure

- `node/` - Node.js environment integration tests
- `browser/` - Browser environment integration tests (using Playwright in headless Chrome)
- `testcontainers-helper.ts` - Shared utilities for managing AR-IO node test containers

## Running Tests

### Prerequisites

1. Build the package first:
   ```bash
   pnpm build
   ```

2. Docker must be running (required for Testcontainers)

### Node Integration Tests

```bash
pnpm test:integration:node
```

This runs the integration tests in a Node.js environment using the built package from `dist/`.

### Browser Integration Tests

```bash
pnpm test:integration:browser
```

This runs the integration tests in a headless Chrome browser using Playwright.

### All Integration Tests

```bash
pnpm test:integration
```

Runs both Node and Browser integration tests.

## How It Works

1. **Testcontainers**: Automatically spins up an AR-IO node Docker container before tests
2. **Parquet Fixtures**: Mounts the `fixtures/parquet/` directory containing test data
3. **Built Package**: Tests import from the built package in `dist/` to simulate real usage
4. **Cleanup**: Automatically stops and removes containers after tests complete

## Test Container Configuration

The AR-IO node container is configured with:
- Port: 4000 (mapped to a random available port)
- GraphQL endpoint: `/graphql`
- Datasets endpoint: `/ar-io/datasets`
- Mounted fixtures: `fixtures/parquet/` → `/app/data/datasets`

## Writing Tests

Tests can access the running AR-IO node via the global object:

```typescript
const arIONode = (global as any).__ARIO_NODE__;
const { graphqlUrl, datasetsUrl, apiUrl } = arIONode;
```

Import from the built package:

```typescript
import { createNodeParquetProvider } from "@arweave-query/core/node";
// or for browser
import { createWebParquetProvider } from "@arweave-query/core/web";

// Create a provider
const provider = createNodeParquetProvider({
  parquetUrls: {
    blocks: `${arIONode.datasetsUrl}/blocks.parquet`,
    transactions: `${arIONode.datasetsUrl}/transactions.parquet`,
    tags: `${arIONode.datasetsUrl}/tags.parquet`,
  },
  duckdbConfig: {
    readOnly: true,
    memory: ":memory:",
  },
});

// Query data
const result = await provider.getTransactions({ first: 10 });
```

## Timeouts

Integration tests have extended timeouts to account for:
- Container startup time (~30-60 seconds)
- Image pulling (first run)
- AR-IO node initialization

Default timeout is set to 120 seconds (2 minutes).


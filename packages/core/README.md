# @arweave-query/core

> Core client and provider interfaces for querying Arweave data

[![npm version](https://img.shields.io/npm/v/@arweave-query/core.svg)](https://www.npmjs.com/package/@arweave-query/core)
[![npm downloads](https://img.shields.io/npm/dm/@arweave-query/core.svg)](https://www.npmjs.com/package/@arweave-query/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful, flexible library for querying Arweave blockchain data using multiple data providers. Supports both Node.js and browser environments with optimized provider implementations for each platform.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Providers](#providers)
  - [GraphQL Provider](#graphql-provider)
  - [Parquet Provider](#parquet-provider)
- [API Reference](#api-reference)
  - [ArweaveQueryClient](#arweavequeryclient)
  - [Query Filters](#query-filters)
- [Usage Examples](#usage-examples)
  - [Node.js](#nodejs)
  - [Browser](#browser)
  - [Advanced Filtering](#advanced-filtering)
  - [Pagination](#pagination)
- [Environment-Specific Imports](#environment-specific-imports)
- [Contributing](#contributing)
- [License](#license)

## Features

- 🚀 **Multiple Data Providers**: Choose between GraphQL or Parquet-based querying
- 🌐 **Universal**: Works in Node.js and browser environments
- ⚡ **High Performance**: DuckDB-powered Parquet querying for blazing-fast results
- 🔄 **Pagination Support**: Built-in cursor-based pagination
- 🎯 **Type-Safe**: Full TypeScript support with generated types
- 🔍 **Flexible Filtering**: Filter by owner, recipient, tags, block height, and more
- 💾 **Caching**: Built-in LevelDB caching support
- 🔐 **Provenance**: Published with npm provenance for supply chain security

## Installation

```bash
# npm
npm install @arweave-query/core

# pnpm
pnpm add @arweave-query/core

# yarn
yarn add @arweave-query/core
```

## Quick Start

```typescript
import { ArweaveQueryClient, GraphQLProvider } from "@arweave-query/core";

// Create a client with a provider
const client = new ArweaveQueryClient({
  transactionProvider: new GraphQLProvider("https://arweave.net/graphql"),
});

// Query transactions
const result = await client.getTransactions({
  first: 10,
  owners: ["your-arweave-address"],
});

console.log(result.data); // Array of transactions
```

## Providers

### GraphQL Provider

Uses Arweave gateway GraphQL endpoints for querying. Best for general-purpose queries and wide compatibility.

```typescript
import { GraphQLProvider } from "@arweave-query/core";

const provider = new GraphQLProvider("https://arweave.net/graphql");

// Query transactions
const transactions = await provider.getTransactions({
  first: 10,
  tags: [{ name: "Content-Type", values: ["application/json"] }],
});

// Get a specific transaction
const tx = await provider.getTransaction("transaction-id");

// Query blocks
const blocks = await provider.getBlocks({ first: 5 });
```

### Parquet Provider

Leverages DuckDB for querying Parquet datasets hosted on gateways. Significantly faster for large-scale queries.

#### Node.js

```typescript
import { createNodeParquetProvider } from "@arweave-query/core/node";

const provider = createNodeParquetProvider({
  parquetUrls: {
    blocks: "https://gateway.ar.io/local/datasets/blocks.parquet",
    transactions: "https://gateway.ar.io/local/datasets/transactions.parquet",
    tags: "https://gateway.ar.io/local/datasets/tags.parquet",
  },
  duckdbConfig: {
    memory: ":memory:",
    readOnly: true,
  },
});

const result = await provider.getTransactions({ first: 100 });
```

#### Browser

```typescript
import { createWebParquetProvider } from "@arweave-query/core/web";

const provider = createWebParquetProvider({
  parquetUrls: {
    blocks: "https://gateway.ar.io/local/datasets/blocks.parquet",
    transactions: "https://gateway.ar.io/local/datasets/transactions.parquet",
    tags: "https://gateway.ar.io/local/datasets/tags.parquet",
  },
  duckdbConfig: {
    wasmUrl: "/duckdb.wasm",
    workerUrl: "/worker.js",
  },
});

const result = await provider.getTransactions({ first: 100 });
```

## API Reference

### ArweaveQueryClient

The main client for querying Arweave data.

#### Constructor

```typescript
new ArweaveQueryClient(config: {
  transactionProvider: QueryProvider;
  cache?: CacheProvider;
})
```

#### Methods

##### `getTransactions(filter: TransactionsQueryFilter): Promise<QueryResult<Transaction>>`

Query transactions with optional filtering and pagination.

```typescript
const result = await client.getTransactions({
  first: 10,
  owners: ["address1", "address2"],
  recipients: ["address3"],
  tags: [{ name: "App-Name", values: ["my-app"] }],
  block: { min: 1000000, max: 1100000 },
  after: "cursor-for-pagination",
});
```

##### `getTransaction(id: string): Promise<Transaction>`

Get a specific transaction by ID.

```typescript
const tx = await client.getTransaction("transaction-id");
```

##### `getBlocks(filter: BlocksQueryFilter): Promise<QueryResult<Block>>`

Query blocks with optional filtering.

```typescript
const blocks = await client.getBlocks({
  first: 10,
  ids: ["block-id-1", "block-id-2"],
});
```

### Query Filters

#### TransactionsQueryFilter

```typescript
interface TransactionsQueryFilter {
  first?: number; // Number of results (default: 10, max varies by provider)
  after?: string; // Cursor for pagination
  ids?: string[]; // Filter by transaction IDs
  owners?: string[]; // Filter by owner addresses
  recipients?: string[]; // Filter by recipient addresses
  tags?: TagFilter[]; // Filter by tags
  block?: {
    // Filter by block height range
    min?: number;
    max?: number;
  };
}
```

#### TagFilter

```typescript
interface TagFilter {
  name: string; // Tag name
  values: string[]; // Possible tag values (OR condition)
}
```

#### BlocksQueryFilter

```typescript
interface BlocksQueryFilter {
  first?: number; // Number of results
  after?: string; // Cursor for pagination
  ids?: string[]; // Filter by block IDs
  height?: {
    // Filter by height range
    min?: number;
    max?: number;
  };
}
```

### QueryResult

```typescript
interface QueryResult<T> {
  data: T[]; // Array of results
  hasNextPage: boolean; // Whether more results are available
  cursor?: string; // Cursor for next page
  next?: () => Promise<QueryResult<T>>; // Helper function to fetch next page
}
```

## Usage Examples

### Node.js

```typescript
import { ArweaveQueryClient, GraphQLProvider } from "@arweave-query/core";
import { createNodeParquetProvider } from "@arweave-query/core/node";

// Option 1: GraphQL Provider
const graphqlClient = new ArweaveQueryClient({
  transactionProvider: new GraphQLProvider("https://arweave.net/graphql"),
});

// Option 2: Parquet Provider (faster for large queries)
const parquetProvider = createNodeParquetProvider({
  parquetUrls: {
    blocks: "https://gateway.ar.io/local/datasets/blocks.parquet",
    transactions: "https://gateway.ar.io/local/datasets/transactions.parquet",
    tags: "https://gateway.ar.io/local/datasets/tags.parquet",
  },
});

const parquetClient = new ArweaveQueryClient({
  transactionProvider: parquetProvider,
});

// Query transactions
const result = await parquetClient.getTransactions({
  first: 100,
  block: { min: 1000000, max: 1100000 },
});

console.log(`Found ${result.data.length} transactions`);
```

### Browser

```typescript
import { ArweaveQueryClient, GraphQLProvider } from "@arweave-query/core/web";
import { createWebParquetProvider } from "@arweave-query/core/web";

// GraphQL works the same in browser
const client = new ArweaveQueryClient({
  transactionProvider: new GraphQLProvider("https://arweave.net/graphql"),
});

// Parquet provider uses DuckDB-WASM
const parquetProvider = createWebParquetProvider({
  parquetUrls: {
    blocks: "https://gateway.ar.io/local/datasets/blocks.parquet",
    transactions: "https://gateway.ar.io/local/datasets/transactions.parquet",
    tags: "https://gateway.ar.io/local/datasets/tags.parquet",
  },
  duckdbConfig: {
    wasmUrl: "/duckdb.wasm", // Serve from your public directory
    workerUrl: "/worker.js",
  },
});

const parquetClient = new ArweaveQueryClient({
  transactionProvider: parquetProvider,
});

// Query transactions
const result = await parquetClient.getTransactions({
  first: 50,
  tags: [{ name: "Content-Type", values: ["image/png", "image/jpeg"] }],
});
```

### Advanced Filtering

```typescript
// Find all transactions from specific owners with specific tags
const result = await client.getTransactions({
  first: 100,
  owners: ["address1", "address2"],
  tags: [
    { name: "App-Name", values: ["my-app"] },
    { name: "Content-Type", values: ["application/json"] },
  ],
  block: {
    min: 1000000, // From block 1000000
    max: 1100000, // To block 1100000
  },
});

// Find transactions to specific recipients
const payments = await client.getTransactions({
  first: 50,
  recipients: ["recipient-address"],
  tags: [{ name: "Action", values: ["Payment"] }],
});
```

### Pagination

```typescript
// Fetch first page
const firstPage = await client.getTransactions({
  first: 10,
  owners: ["owner-address"],
});

console.log(`Page 1: ${firstPage.data.length} transactions`);

// Check if more pages exist
if (firstPage.hasNextPage) {
  // Option 1: Use the helper function
  const secondPage = await firstPage.next();
  console.log(`Page 2: ${secondPage.data.length} transactions`);

  // Option 2: Use cursor manually
  const thirdPage = await client.getTransactions({
    first: 10,
    owners: ["owner-address"],
    after: secondPage.cursor,
  });
  console.log(`Page 3: ${thirdPage.data.length} transactions`);
}

// Fetch all pages
async function fetchAll() {
  const allTransactions = [];
  let result = await client.getTransactions({ first: 100 });

  while (true) {
    allTransactions.push(...result.data);
    if (!result.hasNextPage) break;
    result = await result.next();
  }

  return allTransactions;
}
```

## Environment-Specific Imports

The package provides environment-specific entry points for optimal performance:

```typescript
// Core (shared between environments)
import { ArweaveQueryClient, GraphQLProvider } from "@arweave-query/core";

// Node.js specific
import {
  createNodeParquetProvider,
  createNodeCache,
} from "@arweave-query/core/node";

// Browser specific
import {
  createWebParquetProvider,
  createWebCache,
} from "@arweave-query/core/web";
```

**Why separate imports?**

- **Node.js** uses native DuckDB bindings for maximum performance
- **Browser** uses DuckDB-WASM for in-browser query processing
- Prevents bundling Node.js-only code in browser builds

## Contributing

We welcome contributions! Please see the [Contributing Guide](../../CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/the-permaweb-harlequin/arweave-query.git
cd arweave-query

# Install dependencies
pnpm install

# Build the package
cd packages/core
pnpm build

# Run tests
pnpm test                    # Unit tests
pnpm test:integration        # Integration tests (requires Docker)
```

### Running Tests

```bash
# Unit tests
pnpm test

# Integration tests (Node.js)
pnpm test:integration:node

# Integration tests (Browser)
pnpm test:integration:browser

# All tests
pnpm test:run && pnpm test:integration
```

## License

MIT © [the-permaweb-harlequin](https://github.com/the-permaweb-harlequin)

---

**Links:**

- [GitHub Repository](https://github.com/the-permaweb-harlequin/arweave-query)
- [Issue Tracker](https://github.com/the-permaweb-harlequin/arweave-query/issues)
- [NPM Package](https://www.npmjs.com/package/@arweave-query/core)
- [CI/CD Documentation](../../docs/CI_CD_SETUP.md)
- [Integration Testing Guide](../../docs/INTEGRATION_TESTING.md)

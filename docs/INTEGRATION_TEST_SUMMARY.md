# Integration Test Suite Summary

## Overview

Complete integration test suite for `@arweave-query` with **dual environment support** (Node.js and Browser) testing both **Parquet** and **GraphQL** providers against real data.

## Test Environments

### Node.js Integration Tests

- **Location**: `packages/core/tests/integration/node/`
- **Runtime**: Node.js with DuckDB-Neo
- **Command**: `pnpm test:integration:node`

### Browser Integration Tests

- **Location**: `packages/core/tests/integration/browser/`
- **Runtime**: Headless Chrome with DuckDB-WASM
- **Command**: `pnpm test:integration:browser`

## Test Suites (3 per environment = 6 total)

### 1. Parquet Provider Tests

**Files**:

- `node/parquet-query.test.ts` (7 tests)
- `browser/parquet-query.test.ts` (7 tests)

**Data Source**: HTTP-served parquet files from AR-IO node

- Blocks: `/local/datasets/blocks.parquet`
- Transactions: `/local/datasets/transactions.parquet`
- Tags: `/local/datasets/tags.parquet`

**Coverage**:

- ✅ Basic transaction queries
- ✅ Owner filtering (base64 string comparison fix)
- ✅ Block height range filtering (911404-1094394)
- ✅ Tag filtering
- ✅ Pagination with cursors
- ✅ Block queries
- ✅ Transaction lookup by ID

### 2. GraphQL Provider Tests

**Files**:

- `node/graphql-query.test.ts` (8 tests)
- `browser/graphql-query.test.ts` (8 tests)

**Data Source**: Live arweave.net/graphql endpoint

**Coverage**:

- ✅ Basic transaction queries
- ✅ Owner filtering
- ✅ Block height range filtering
- ✅ Tag filtering
- ✅ Pagination with cursors
- ✅ Block queries
- ✅ Transaction lookup by ID
- ✅ Recipient filtering

### 3. Cross-Provider Client Validation

**Files**:

- `node/client-cross-provider.test.ts` (3 tests)
- `browser/client-cross-provider.test.ts` (3 tests)

**Purpose**: Validates data consistency between providers

**Tests**:

1. **Cross-Provider Validation**
   - Queries 100 transactions from Parquet
   - Validates against GraphQL
   - **Results**: 100% consistency on all core fields!
2. **Client Provider Comparison**
   - Tests ArweaveQueryClient with different providers
   - Verifies identical results
3. **Fallback Scenarios**
   - Demonstrates GraphQL → Parquet fallback pattern

## Validation Results

### Data Consistency (100 transactions compared)

```
Total comparisons:     100
Owner matches:         100 (100.0%)
Recipient matches:     100 (100.0%) *
Block height matches:  100 (100.0%)
Tag count matches:     100 (100.0%)
Full matches:          100 (100.0%)

📦 Recipient Details:
  Both have recipient:    5 (values match)
  Neither has recipient:  95 (both null/undefined = match)
  Only Parquet has:       0 (mismatch)
  Only GraphQL has:       0 (mismatch)

* Recipient match = same value OR both null/undefined
```

## Key Technical Achievements

### 1. Base64 String Comparison Fix

**Problem**: DuckDB binary parameter binding doesn't work with HTTP-served parquet files

**Solution**: Convert blob columns to base64 strings using DuckDB's `base64()` function

```sql
WHERE base64(owner_address) = 'base64string'
```

**Impact**:

- ✅ Owner filtering now works perfectly
- ✅ Transaction by ID lookup now works
- ✅ Recipients filtering now works

### 2. Dual Database Support

- **Node.js**: DuckDB-Neo (native bindings)
- **Browser**: DuckDB-WASM (WebAssembly)
- **Same API**: Identical test code for both environments

### 3. Testcontainers Integration

- Automatic AR-IO node Docker container management
- Mounts local parquet fixtures
- Health checks and verification
- Clean startup/shutdown

### 4. Real Data Testing

- **Parquet**: Fixture data (blocks 911404-1094394)
- **GraphQL**: Live arweave.net data
- **Cross-validation**: Proves data integrity

## Infrastructure

### Testcontainers Helper

**File**: `tests/integration/testcontainers-helper.ts`

**Features**:

- Starts AR-IO node container
- Mounts parquet fixtures at `/app/data/datasets`
- Configures environment variables
- Waits for healthy state
- Minimal log output (errors only)

### Setup Files

- `node/setup.ts` - Node.js test environment setup
- `browser/setup.ts` - Browser test environment setup
- Both share AR-IO container lifecycle

## Running Tests

### All Integration Tests

```bash
pnpm test:integration
```

### Node.js Only

```bash
pnpm test:integration:node
```

### Browser Only

```bash
pnpm test:integration:browser
```

### With Docker Image Override

```bash
ARIO_IMAGE=ghcr.io/ar-io/ar-io-core:develop pnpm test:integration:node
```

## Test Configuration

### Node.js

**File**: `vitest.config.integration.ts`

- Environment: `node`
- Timeout: 180s (3 minutes)
- Hook Timeout: 240s (4 minutes)
- Single-threaded (avoids port conflicts)

### Browser

**File**: `vitest.config.browser.ts`

- Environment: `browser`
- Provider: `playwright`
- Browser: `chromium` (headless)
- Same timeouts as Node.js

## Performance

### Typical Test Run Times

- Parquet tests: ~3-4 seconds
- GraphQL tests: ~10-11 seconds
- Cross-provider validation: ~45 seconds (100 transaction lookups)
- **Total**: ~60 seconds per environment

### Container Startup

- First run: ~60-120 seconds (image pull + startup)
- Subsequent runs: ~30-40 seconds (image cached)

## Assertions & Quality Gates

All tests enforce:

- ✅ 95%+ match rate on core fields
- ✅ Proper data structure validation
- ✅ Pagination functionality
- ✅ Error handling
- ✅ Type safety

## Future Enhancements

Potential additions:

- [ ] WebSocket provider tests
- [ ] Cache provider tests
- [ ] Performance benchmarks
- [ ] Stress tests (10k+ transactions)
- [ ] Network failure simulation
- [ ] CI/CD integration examples

## Documentation

- **Setup Guide**: `INTEGRATION_TESTING.md`
- **Quick Start**: `README.md` (Testing section)
- **CI Example**: `.github/workflows/integration-tests.example.yml`

---

**Status**: ✅ Production Ready

**Last Updated**: 2025-10-01

**Test Count**: 18 tests (Node.js) + 18 tests (Browser) = **36 total integration tests**

# Testing Guide

This project has **two distinct test suites**: unit tests and integration tests.

## Test Suites Overview

### 1. Unit Tests

**Location**: `packages/core/src/**/*.test.ts`  
**Purpose**: Fast, isolated tests for individual components  
**Environment**: Node.js (no Docker required)  
**Command**: `pnpm test` or `pnpm test:run`

```bash
# Run unit tests in watch mode
pnpm test

# Run unit tests once
pnpm test:run
```

**What's excluded from unit tests**:

- Integration tests (`tests/integration/**`)
- Tests requiring Docker containers
- Tests requiring AR-IO node

### 2. Integration Tests

**Location**: `packages/core/tests/integration/**`  
**Purpose**: End-to-end validation with real infrastructure  
**Environment**: Node.js + Browser (requires Docker)  
**Command**: `pnpm test:integration` or specific environment

```bash
# Run all integration tests (Node + Browser)
pnpm test:integration

# Run Node.js integration tests only
pnpm test:integration:node

# Run Browser integration tests only
pnpm test:integration:browser
```

**What integration tests require**:

- ✅ Docker running (for Testcontainers)
- ✅ AR-IO node container
- ✅ Local parquet fixtures
- ✅ Internet connection (for GraphQL tests)

## Test Configuration Files

### Unit Tests

- **Config**: `vite.config.ts` (default)
- **Test Pattern**: `src/**/*.test.ts`
- **Excluded**: `tests/integration/**`
- **Timeout**: Default (5 seconds)

```typescript
// vite.config.ts
test: {
  environment: "node",
  globals: true,
  exclude: [
    "**/node_modules/**",
    "**/dist/**",
    "**/tests/integration/**", // Integration tests excluded
  ],
}
```

### Integration Tests (Node.js)

- **Config**: `vitest.config.integration.ts`
- **Test Pattern**: `tests/integration/node/**/*.test.ts`
- **Timeout**: 180 seconds (queries), 240 seconds (container startup)
- **Setup**: `tests/integration/node/setup.ts`

### Integration Tests (Browser)

- **Config**: `vitest.config.browser.ts`
- **Test Pattern**: `tests/integration/browser/**/*.test.ts`
- **Browser**: Chromium (headless)
- **Timeout**: 180 seconds (queries), 240 seconds (container startup)
- **Setup**: `tests/integration/browser/setup.ts`

## Running Tests in Development

### Quick Commands

```bash
# Unit tests (fast, no Docker)
pnpm test                    # Watch mode
pnpm test:run                # Run once

# Integration tests (slow, requires Docker)
pnpm test:integration        # All environments
pnpm test:integration:node   # Node.js only
pnpm test:integration:browser # Browser only
```

### Workflow

1. **During development**: Run `pnpm test` for quick feedback
2. **Before committing**: Run `pnpm test:run` to ensure all unit tests pass
3. **Before PR**: Run `pnpm test:integration` to validate end-to-end functionality

## Test Counts

- **Unit Tests**: 37 tests
  - Query Builder: 25 tests
  - Parquet Provider: 12 tests

- **Integration Tests**: 36 tests
  - Node.js: 18 tests (Parquet: 7, GraphQL: 8, Cross-provider: 3)
  - Browser: 18 tests (Parquet: 7, GraphQL: 8, Cross-provider: 3)

## CI/CD Considerations

For CI pipelines, run tests in separate jobs:

```yaml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test:run

  integration-tests:
    runs-on: ubuntu-latest
    services:
      docker:
        image: docker:dind
    steps:
      - run: pnpm test:integration
```

## Troubleshooting

### "AR-IO node not available" error

This means you're running integration tests without Docker. Use `pnpm test` for unit tests instead.

### Integration tests timing out

- Increase timeout in vitest config
- Check Docker is running
- Verify network connectivity for GraphQL tests

### Unit tests failing with DuckDB errors

- Ensure `pnpm build` has been run
- Check that `dist/` directory exists
- Clear `node_modules` and reinstall

## See Also

- [INTEGRATION_TESTING.md](./INTEGRATION_TESTING.md) - Detailed integration test setup
- [INTEGRATION_TEST_SUMMARY.md](./INTEGRATION_TEST_SUMMARY.md) - Test results and architecture

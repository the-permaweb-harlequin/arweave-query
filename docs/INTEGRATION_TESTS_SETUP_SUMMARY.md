# Integration Tests Setup Summary

This document summarizes the integration testing infrastructure that has been set up for the arweave-query project.

## 📋 What Was Created

### Configuration Files

1. **`packages/core/vitest.config.integration.ts`**
   - Vitest configuration for Node.js integration tests
   - Runs tests in Node environment
   - Single-threaded execution to avoid port conflicts
   - 2-minute timeout for container operations
   - Path aliases to use built package instead of source

2. **`packages/core/vitest.config.browser.ts`**
   - Vitest configuration for browser integration tests
   - Runs tests in headless Chromium via Playwright
   - Same timeout and threading as Node config
   - Browser-specific test environment setup

3. **`docker-compose.integration.yml`**
   - Example Docker Compose configuration
   - Reference for manual AR-IO node setup
   - Not used directly (Testcontainers handles this)

4. **`packages/core/.gitignore`**
   - Ignores test artifacts, build output, and temporary files
   - Includes Playwright-specific ignores

### Test Infrastructure

5. **`packages/core/tests/integration/testcontainers-helper.ts`**
   - Core helper for managing AR-IO node containers
   - Functions: `startArIONode()`, `stopArIONode()`, `verifyArIONode()`
   - Handles Docker container lifecycle
   - Mounts parquet fixtures
   - Configurable via `ARIO_IMAGE` environment variable

6. **`packages/core/tests/integration/node/setup.ts`**
   - Global setup for Node.js integration tests
   - Starts container before all tests
   - Cleans up after all tests
   - Exposes container info via `global.__ARIO_NODE__`

7. **`packages/core/tests/integration/browser/setup.ts`**
   - Global setup for browser integration tests
   - Same functionality as Node setup
   - Uses `globalThis` instead of `global`

8. **`packages/core/tests/integration/global.d.ts`**
   - TypeScript type definitions for test globals
   - Provides type safety for `__ARIO_NODE__` global variable

### Test Suites

9. **`packages/core/tests/integration/node/parquet-query.test.ts`**
   - Node.js integration tests for ParquetProvider
   - Tests:
     - Basic transaction queries
     - Owner filtering
     - Block height range filtering
     - Tag filtering
     - Pagination
     - Block queries
     - Single transaction retrieval

10. **`packages/core/tests/integration/browser/parquet-query.test.ts`**
    - Browser integration tests for ParquetProvider
    - Same test coverage as Node tests
    - Additional test for DuckDB WASM initialization

### Documentation

11. **`packages/core/tests/integration/README.md`**
    - Detailed documentation for integration tests
    - How to run tests
    - How it works
    - Writing new tests
    - Configuration details

12. **`INTEGRATION_TESTING.md`**
    - Comprehensive guide for integration testing
    - Prerequisites, setup, and usage
    - Troubleshooting guide
    - CI/CD integration examples
    - Performance considerations

13. **`README.md`** (updated)
    - Added Testing section
    - Quick start for integration tests
    - Links to detailed documentation

### Scripts and Automation

14. **`scripts/setup-integration-tests.sh`**
    - Automated setup script for integration tests
    - Checks prerequisites (Docker, Node.js, pnpm)
    - Verifies parquet fixtures exist
    - Installs dependencies and builds package
    - Provides helpful next steps

15. **`.github/workflows/integration-tests.example.yml`**
    - Example GitHub Actions workflow
    - Matrix testing across Node versions
    - Separate jobs for Node and Browser tests
    - Artifact upload on failure
    - Docker-based testing option

### Package Configuration

16. **`packages/core/package.json`** (updated)
    - Added dependencies:
      - `@vitest/browser`: Browser testing support
      - `playwright`: Browser automation
      - `testcontainers`: Docker container management
    - Added scripts:
      - `test:integration`: Run all integration tests
      - `test:integration:node`: Node.js tests only
      - `test:integration:browser`: Browser tests only

## 🏗️ Architecture

```
Integration Test Flow
═══════════════════════

┌─────────────────────────────────────────────────────────┐
│                    Test Suite Start                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│            setup.ts (beforeAll hook)                     │
│  • Calls startArIONode()                                 │
│  • Waits for health check                                │
│  • Exposes via global.__ARIO_NODE__                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              testcontainers-helper.ts                    │
│  • Pulls AR-IO Docker image                              │
│  • Creates container with:                               │
│    - Environment variables                               │
│    - Port 4000 exposed                                   │
│    - Parquet fixtures mounted                            │
│  • Waits for /ar-io/info endpoint                        │
│  • Verifies datasets endpoint                            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              AR-IO Node Container                        │
│  • Running on random available port                      │
│  • GraphQL: http://host:port/graphql                     │
│  • Datasets: http://host:port/ar-io/datasets             │
│  • Fixtures: /app/data/datasets/                         │
│    - blocks.parquet                                      │
│    - transactions.parquet                                │
│    - tags.parquet                                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    Test Files                            │
│  • Import from built package (@arweave-query/core/*)     │
│  • Access global.__ARIO_NODE__ for URLs                  │
│  • Create provider with parquet URLs                     │
│  • Execute test assertions                               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│            setup.ts (afterAll hook)                      │
│  • Calls stopArIONode()                                  │
│  • Cleans up container                                   │
│  • Releases resources                                    │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### First Time Setup

```bash
# 1. Run setup script
./scripts/setup-integration-tests.sh

# 2. Build the package
cd packages/core
pnpm build
```

### Running Tests

```bash
# Run all integration tests
pnpm test:integration

# Run Node.js tests only
pnpm test:integration:node

# Run Browser tests only
pnpm test:integration:browser

# Run with custom AR-IO image
ARIO_IMAGE=ghcr.io/ar-io/ar-io-core:develop pnpm test:integration
```

## 📦 Dependencies Added

```json
{
  "devDependencies": {
    "@vitest/browser": "^1.0.4",
    "playwright": "^1.40.1",
    "testcontainers": "^10.4.0"
  }
}
```

## 🎯 Key Features

### 1. **Isolated Test Environment**

- Each test run gets a fresh AR-IO node container
- No interference between test runs
- Clean state for every execution

### 2. **Platform Coverage**

- Node.js environment testing
- Browser environment testing (headless Chrome)
- Verifies DuckDB works in both environments

### 3. **Real Infrastructure**

- Uses actual AR-IO node Docker image
- Real parquet file reading
- Realistic query execution

### 4. **Built Package Testing**

- Tests import from `dist/` not `src/`
- Verifies the actual package users will install
- Catches build-related issues

### 5. **Automatic Cleanup**

- Containers are automatically stopped
- Resources are freed after tests
- No manual cleanup required

### 6. **Configurable**

- Custom Docker images via `ARIO_IMAGE`
- Adjustable timeouts
- Flexible fixture mounting

## 🔧 Customization

### Using a Different AR-IO Image

```bash
ARIO_IMAGE=ghcr.io/ar-io/ar-io-core:develop pnpm test:integration
```

### Adjusting Timeouts

Edit the vitest config files to change timeout values:

```typescript
// vitest.config.integration.ts or vitest.config.browser.ts
export default defineConfig({
  test: {
    testTimeout: 180000, // 3 minutes instead of 2
    hookTimeout: 180000,
  },
});
```

### Using Custom Fixtures

Update the `testcontainers-helper.ts` to mount different fixtures:

```typescript
const fixturesPath =
  process.env.FIXTURES_PATH ||
  resolve(__dirname, '../../../../fixtures/parquet');
```

## 📊 Test Coverage

### Node.js Tests

- ✅ Transaction queries
- ✅ Owner filtering
- ✅ Block height filtering
- ✅ Tag filtering
- ✅ Pagination
- ✅ Block queries
- ✅ Single transaction retrieval

### Browser Tests

- ✅ All Node.js tests
- ✅ DuckDB WASM initialization
- ✅ Browser-specific edge cases

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check Docker is running
docker info

# Check logs
docker logs <container-id>

# Try pulling image manually
docker pull ghcr.io/ar-io/ar-io-core:latest
```

### Tests Timeout

```bash
# Increase timeout in vitest configs
# Check network connectivity
# Ensure Docker has sufficient resources
```

### Import Errors

```bash
# Rebuild the package
cd packages/core
pnpm clean
pnpm build
```

## 🎓 Next Steps

1. **Add More Tests**: Extend test coverage for specific use cases
2. **CI Integration**: Enable the GitHub Actions workflow
3. **Performance Tests**: Add benchmarks for query performance
4. **Custom Fixtures**: Create fixtures for specific test scenarios
5. **Monitoring**: Add test result reporting and tracking

## 📚 References

- [Testcontainers Documentation](https://testcontainers.com/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [AR-IO Node Repository](https://github.com/ar-io/ar-io-node)
- [DuckDB Documentation](https://duckdb.org/)

## ✅ Checklist

Before running integration tests, ensure:

- [ ] Docker is installed and running
- [ ] Node.js 18+ is installed
- [ ] pnpm is installed
- [ ] Parquet fixtures exist in `fixtures/parquet/`
- [ ] Package is built (`pnpm build`)
- [ ] Dependencies are installed (`pnpm install`)

## 🎉 Success!

Integration tests are now fully configured and ready to use. Run `pnpm test:integration` to verify everything works!

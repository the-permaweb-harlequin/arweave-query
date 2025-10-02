# CI/CD Setup Summary

This document outlines the CI/CD setup for the `@arweave-query/core` package.

## Overview

The project has a complete CI/CD pipeline configured with GitHub Actions, supporting:

- **Continuous Integration**: Quality checks, tests, and builds on every push/PR
- **Stable Releases**: Automated releases to npm on merge to `main`
- **Alpha Releases**: Pre-release versions on merge to `alpha`
- **RC Releases**: Release candidates on PRs (except main↔alpha PRs)
- **Slack Notifications**: Optional notifications for releases

## Current Scope

**Note:** Currently, only the `@arweave-query/core` package is included in CI/CD. The CLI, docs, and React framework packages are excluded for now.

## Package Information

- **Package Name**: `@arweave-query/core`
- **NPM Organization**: `@arweave-query` (claimed on npmjs.org)
- **Repository**: GitHub monorepo with pnpm workspaces

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**

- Push to `main` or `alpha` branches
- Pull requests to any branch

**Jobs:**

#### Quality Checks

- Prettier formatting check
- ESLint linting (warnings allowed, errors fail)
- TypeScript type checking

#### Unit Tests

- Tests across Node.js 18, 20, and 22
- Uses Vitest
- Excludes integration tests

#### Integration Tests

- **Node.js**: Tests with DuckDB-Neo and Testcontainers
- **Browser**: Tests with DuckDB-WASM in headless Chrome
- Tests Parquet, GraphQL, and cross-provider validation
- Uses AR-IO node Docker container with local fixture data

#### Build Verification

- Builds the package
- Verifies all build artifacts exist

### 2. Stable Release Workflow (`.github/workflows/release-stable.yml`)

**Triggers:**

- Push to `main` branch

**Process:**

1. Runs full CI pipeline
2. Uses Changesets to determine version bumps
3. Either:
   - Creates/updates a release PR if there are changesets
   - Publishes to npm with `latest` tag if release PR is merged
4. Publishes with npm provenance for supply chain security
5. Sends Slack notification (if `SLACK_WEBHOOK_URL` secret is set)

**NPM Tag:** `latest`

### 3. Alpha Release Workflow (`.github/workflows/release-alpha.yml`)

**Triggers:**

- Push to `alpha` branch

**Process:**

1. Runs full CI pipeline
2. Uses Changesets with alpha pre-release mode
3. Either:
   - Creates/updates a release PR if there are changesets
   - Publishes to npm with `alpha` tag if release PR is merged
4. Publishes with npm provenance
5. Sends Slack notification (if `SLACK_WEBHOOK_URL` secret is set)

**NPM Tag:** `alpha`

### 4. RC Release Workflow (`.github/workflows/release-rc.yml`)

**Triggers:**

- Pull requests to `main` or `alpha` branches
- **Skips** if PR is from `alpha` to `main` or vice versa

**Process:**

1. Checks if RC should be skipped (main↔alpha PRs)
2. Runs full CI pipeline
3. Calculates RC version: `X.Y.Z-rc.PR#.SHA`
4. Publishes to npm with `rc` tag
5. Comments on PR with installation instructions
6. Updates comment on subsequent pushes to same PR
7. Sends Slack notification (if `SLACK_WEBHOOK_URL` secret is set)

**NPM Tag:** `rc`

**Version Format:** `0.1.0-rc.42.a1b2c3d` (base version + PR number + short SHA)

## Required GitHub Secrets

### NPM_TOKEN

- **Required**: Yes
- **Purpose**: Publishing to npm
- **Permissions**: Automation token with publish access to `@arweave-query` organization

### SLACK_WEBHOOK_URL

- **Required**: No (optional)
- **Purpose**: Release notifications
- **Format**: Slack incoming webhook URL

## Branch Strategy

### main

- **Stability**: Production-ready code
- **Releases**: Stable releases with `latest` npm tag
- **Protection**: Require PR reviews, passing CI

### alpha

- **Stability**: Pre-release features
- **Releases**: Alpha releases with `alpha` npm tag
- **Protection**: Require passing CI

### Feature Branches

- **Strategy**: Create PRs to `main` or `alpha`
- **RC Releases**: Automatic RC versions on PR push
- **Testing**: Full CI + integration tests

## Release Process

### Stable Release (main branch)

1. **Create Changeset**

   ```bash
   pnpm changeset add
   # Select package, version bump type, and describe changes
   ```

2. **Commit and Push**

   ```bash
   git add .changeset/
   git commit -m "chore: add changeset for feature X"
   git push
   ```

3. **Changesets Creates Release PR**
   - Automatically updates version in `package.json`
   - Generates `CHANGELOG.md` entries
   - PR title: "chore: release stable packages"

4. **Review and Merge Release PR**
   - Review changelog and version bumps
   - Merge to trigger publication

5. **Automatic Publication**
   - Package is built
   - Published to npm with `latest` tag
   - GitHub release is created
   - Slack notification sent (if configured)

### Alpha Release (alpha branch)

Same process as stable, but:

- Work on `alpha` branch
- Releases use `alpha` npm tag
- Versions formatted as `X.Y.Z-alpha.N`

### RC Release (Pull Request)

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes and Push**

   ```bash
   git push -u origin feature/my-feature
   ```

3. **Open Pull Request**
   - To `main` or `alpha`
   - RC release triggers automatically

4. **RC Publication**
   - Version: `X.Y.Z-rc.PR#.SHA`
   - Published to npm with `rc` tag
   - Comment added to PR with install instructions

5. **Test RC**

   ```bash
   npm install @arweave-query/core@rc
   # or specific version
   npm install @arweave-query/core@0.1.0-rc.42.a1b2c3d
   ```

6. **Merge PR**
   - RC version remains on npm
   - Next push to target branch creates new stable/alpha release

## Integration Test Setup

### Testcontainers

The integration tests use Testcontainers to run an AR-IO node Docker container:

- **Image**: `ghcr.io/ar-io/ar-io-core:latest`
- **Environment**: Configurable via `ARIO_IMAGE` env var
- **Fixtures**: Local parquet files mounted at `/app/data/datasets`
- **Startup Timeout**: 3+ minutes (AR-IO node initialization)

### Test Environments

#### Node.js (`test:integration:node`)

- Uses `duckdb` package (DuckDB-Neo)
- Tests SQL queries against HTTP-served parquet files
- Validates provider implementations

#### Browser (`test:integration:browser`)

- Uses `@duckdb/duckdb-wasm` package
- Runs in headless Chromium via Playwright
- Tests same functionality as Node.js environment
- Ensures cross-platform compatibility

### Test Coverage

1. **ParquetProvider Tests**
   - Transaction queries with filters
   - Block queries
   - Pagination
   - Owner and recipient filtering
   - Base64 string comparison for binary data

2. **GraphQLProvider Tests**
   - Queries against `arweave.net/graphql`
   - Graceful handling of missing data
   - Same test cases as ParquetProvider

3. **Cross-Provider Validation**
   - Query 100 transactions from Parquet
   - Query same transactions from GraphQL
   - Compare owner, recipient, block, and tags
   - Validate consistency between providers

## Local Development

### Prerequisites

```bash
# Install dependencies
pnpm install --no-frozen-lockfile

# Generate code
pnpm codegen
pnpm codegen:parquet
```

### Available Scripts

```bash
# Format code
pnpm format
pnpm format:check

# Lint
pnpm lint
pnpm lint:fix

# Type check
pnpm type-check

# Unit tests
pnpm test          # Watch mode
pnpm test:run      # Run once

# Integration tests
pnpm test:integration          # Both Node.js and Browser
pnpm test:integration:node     # Node.js only
pnpm test:integration:browser  # Browser only

# Build
pnpm build

# Full CI pipeline locally
pnpm run ci
```

### Running Integration Tests Locally

```bash
# Ensure Docker is running
docker ps

# Run Node.js integration tests
cd packages/core
pnpm test:integration:node

# Run browser integration tests
pnpm test:integration:browser
```

**Note:** Integration tests will:

- Pull the AR-IO node Docker image (if not cached)
- Start the container (takes 2-3 minutes)
- Run tests
- Stop and remove the container

## Code Generation

### GraphQL Types

GraphQL types are generated from the schema and queries:

```bash
pnpm codegen
```

**Files Generated:**

- `packages/core/src/generated/graphql.ts` - Core types and GraphQL request client
- `packages/frameworks/react/src/generated/hooks.tsx` - React Query hooks

**Configuration:** `graphql/codegen.yml`

### Parquet Types

TypeScript types for parquet schemas are generated from DuckDB:

```bash
pnpm codegen:parquet
```

**Files Generated:**

- `packages/core/src/generated/parquet-types.ts` - Parquet row types

**Configuration:** `scripts/codegen-parquet-types.ts`

## Troubleshooting

### Integration Tests Failing

**Container startup timeout:**

- Increase timeout in `vitest.config.integration.ts` or `vitest.config.browser.ts`
- Check Docker daemon is running and has sufficient resources

**Parquet files not accessible:**

- Verify fixtures exist in `fixtures/parquet/`
- Check container logs for mount issues
- Ensure AR-IO node has `ENABLE_DATASETS_ENDPOINT=true`

**DuckDB errors:**

- For Node.js: Check `duckdb` version compatibility
- For Browser: Ensure `@duckdb/duckdb-wasm` is properly loaded
- Verify HTTP URLs are accessible from the test environment

### Build Failures

**Missing generated files:**

```bash
pnpm codegen
pnpm codegen:parquet
```

**Type errors:**

```bash
pnpm type-check
```

**Linting errors:**

```bash
pnpm lint:fix
```

### Release Issues

**Changesets not detected:**

- Ensure `.changeset/` directory has changeset files
- Run `pnpm changeset:status` to check

**npm publish fails:**

- Verify `NPM_TOKEN` secret is set and valid
- Check npm organization membership
- Ensure version doesn't already exist on npm

**RC version conflicts:**

- RC versions are unique per PR and commit
- Merge conflicts won't occur
- Old RC versions remain on npm

## NPM Tags and Versions

### Version Ranges

- **Stable**: `1.0.0`, `1.0.1`, `1.1.0`, `2.0.0`
- **Alpha**: `1.0.0-alpha.0`, `1.0.0-alpha.1`
- **RC**: `1.0.0-rc.42.a1b2c3d`, `1.1.0-rc.99.xyz1234`

### Installing Versions

```bash
# Latest stable
npm install @arweave-query/core
npm install @arweave-query/core@latest

# Latest alpha
npm install @arweave-query/core@alpha

# Latest RC
npm install @arweave-query/core@rc

# Specific version
npm install @arweave-query/core@1.0.0
npm install @arweave-query/core@1.0.0-alpha.0
npm install @arweave-query/core@1.0.0-rc.42.a1b2c3d
```

### Tag Management

Tags are automatically updated:

- `latest` → most recent stable release
- `alpha` → most recent alpha release
- `rc` → most recent RC release

## Best Practices

### Commit Messages

Use conventional commits for better changelogs:

```bash
feat: add new query filter
fix: resolve pagination bug
docs: update API documentation
chore: update dependencies
perf: optimize query builder
test: add integration tests
```

### Changesets

- Add changesets for user-facing changes
- Skip for internal/dev changes (use `chore:` commits)
- Describe changes from user perspective
- Reference issues/PRs when applicable

### PR Workflow

1. Create feature branch from `main` or `alpha`
2. Make changes and commit
3. Push and open PR
4. Wait for CI and RC publication
5. Test RC version in your application
6. Request review
7. Merge when approved

### Testing Before Release

```bash
# Install RC from your PR
npm install @arweave-query/core@rc

# Or specific RC version
npm install @arweave-query/core@0.1.0-rc.42.a1b2c3d

# Test in your application
# ...

# If issues found, push fixes to PR
# New RC will be published automatically
```

## Future Enhancements

- [ ] Add CLI package to CI/CD
- [ ] Add React framework package to CI/CD
- [ ] Add docs package deployment
- [ ] Performance benchmarks in CI
- [ ] Code coverage reporting
- [ ] Dependabot integration
- [ ] Security scanning (npm audit, Snyk)
- [ ] Bundle size tracking
- [ ] Visual regression testing

## Resources

- [Changesets Documentation](https://github.com/changesets/changesets)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Testcontainers Documentation](https://testcontainers.com/)
- [Vitest Documentation](https://vitest.dev/)

# arweave-query

Tooling for querying data on arweave

# Providers

## GraphQL

GraphQL provider uses gateway graphql endpoints to query for transactions (slow)

## Parquet

The parquet provider leverages DuckDB (node/wasm depending on the env) to query parquet hosted on gateways and arweave.

## Arweave Node

The arweave node provider provides direct data resolution from chunks leveraging offsets

## Wayfinder (from ar.io)

Main data retrieval provider for pull data from ar.io gateways - similar to the arweave node provider, but simpler since
the gateways handle pulling data from the nodes.

# Packages

## Core

The core package handles the core client and provider interfaces including their bare node/web implementations

## React

The react package has hooks for leveraging the providers in react apps

# Testing

## Unit Tests

Run unit tests for all packages:

```bash
pnpm test
```

## Integration Tests

Integration tests verify the package works with real AR-IO node infrastructure using Docker and Testcontainers.

### Quick Start

```bash
# Setup (first time only)
./scripts/setup-integration-tests.sh

# Build the package
cd packages/core
pnpm build

# Run all integration tests
pnpm test:integration

# Or run specific environments
pnpm test:integration:node      # Node.js only
pnpm test:integration:browser   # Browser only (headless Chrome)
```

See [INTEGRATION_TESTING.md](./INTEGRATION_TESTING.md) for detailed documentation.

# Contributing

We welcome contributions! This project has a comprehensive CI/CD pipeline with automated releases.

## Quick Start

```bash
# Clone and setup
git clone https://github.com/the-permaweb-harlequin/arweave-query.git
cd arweave-query
pnpm install

# Run all checks
pnpm ci

# Create a changeset for your changes
pnpm changeset:add
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## CI/CD & Releases

This project uses automated releases with three environments:

| Environment | Branch | Version Format | NPM Tag |
|-------------|--------|----------------|---------|
| **Stable** | `main` | `1.0.0` | `latest` |
| **Alpha** | `alpha` | `1.0.0-alpha.TS.SHA` | `alpha` |
| **RC** | PR to `main`/`alpha` | `1.0.0-rc.PR.SHA` | `rc` |

**Install specific versions:**
```bash
npm install @arweave-query/core          # Latest stable
npm install @arweave-query/core@alpha    # Alpha release
npm install @arweave-query/core@rc       # Latest RC
```

See [CI_CD_SETUP.md](./CI_CD_SETUP.md) for complete documentation.

# Tech stack

for code formatting and linting, we want that at the top level shared on all packages

- pnpm package manager
- nx (monorepo setup)
  - changeset/nx integration
  - nx/semantic release integration for publishing
- Typescript
- Vite
  - hmr on the sdk and for building
- Vitest (for testing)
- Docker (local ar.io gateway for testing)
- Testcontainers (for running the ar.io gateway)
- eslint
- prettier
- commitlint
- react (for the react package)
- ario wayfinder for retrieving data
- DuckDB Neo node client (for nodejs) and DuckDB WASM for web client
- graphql codegen with graphql-request, and for arweave-query/react includes the hooks
  - split generation logic, one for the core and another for framework packages (leverages tanstack/react-query plugin and other framework specific plugins)
- LevelDB for query caching
  - this is a core package implementation with exports for node and web respectively.
  - for the react package, browser levelDB cache will be used in a persisted query client provider.
- oclif for cli
- Documentation site
  Uses static build of fumadocs for hosting
- git/github
  - main branch for stable releases (main is protected)
  - alpha branch for alpha releases (alpha is protected)
  - feature branches for adding new features
    - "rc-number" releases for feature branches who create PR's to alpha branch

# Project organization

- graphql directory
  - stores the schema and configs for codegen
- packages directory
  - core
  - frameworks
    - react
    - vue (future)
    - solid (future)
  - docs (fumadocs for the packages)
  - cli (oclif)
  - mcp (mcp server for LLM's to query data from arweave)
- docs directory
  - repository documentation, MADR, LLM tracking notes, past LLM conversations.
- .github
  - workflows
  - issue templates
- scripts
  - utilities for publishing, deploying, cleaning, generating, testing, etc...

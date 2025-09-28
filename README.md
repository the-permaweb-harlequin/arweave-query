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


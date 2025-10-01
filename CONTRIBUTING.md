# Contributing to arweave-query

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- Docker (for integration tests)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/the-permaweb-harlequin/arweave-query.git
cd arweave-query

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test:run
```

## Development Workflow

### 1. Create a Branch

```bash
# Start from alpha branch
git checkout alpha
git pull origin alpha

# Create your feature branch
git checkout -b feature/my-feature
# or
git checkout -b fix/bug-description
```

### 2. Make Changes

Follow these guidelines:

- **Write tests** for new features
- **Update documentation** for API changes
- **Follow code style** (enforced by Prettier and ESLint)
- **Use conventional commits** (see below)

### 3. Test Your Changes

```bash
# Run unit tests
pnpm test

# Run integration tests (requires Docker)
pnpm test:integration

# Run linting
pnpm lint

# Check formatting
pnpm format:check

# Type check
pnpm type-check

# Run all checks
pnpm ci
```

### 4. Create a Changeset

If your changes should trigger a release:

```bash
pnpm changeset:add
```

Follow the prompts:

- Select packages to include
- Choose version bump type (major/minor/patch)
- Write a summary of changes

### 5. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Features
git commit -m "feat: add new parquet provider"
git commit -m "feat(core): add GraphQL caching"

# Bug fixes
git commit -m "fix: resolve memory leak in DuckDB"
git commit -m "fix(web): handle large parquet files"

# Documentation
git commit -m "docs: update README examples"

# Refactoring
git commit -m "refactor: simplify query builder"

# Tests
git commit -m "test: add integration tests for browser"

# Chores
git commit -m "chore: update dependencies"
```

**Commit Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

### 6. Push and Create PR

```bash
# Push your branch
git push origin feature/my-feature

# Create a pull request
gh pr create --base alpha --title "feat: my feature"
```

## Pull Request Process

### 1. PR Created

When you create a PR:

- ✅ CI runs automatically (lint, test, build)
- ✅ RC version is published to npm (unless PR is `main` ↔ `alpha`)
- ✅ Bot comments with RC installation instructions

### 2. Code Review

- Address review comments
- Keep your branch up to date with base branch
- Ensure all CI checks pass

### 3. Testing RC Version

Install and test the RC version:

```bash
# Install the RC
npm install @arweave-query/core@rc

# Or install specific RC version
npm install @arweave-query/core@1.0.0-rc.123.abc1234
```

### 4. Merge

Once approved:

- PR will be merged to `alpha`
- Alpha release will be published automatically

## Release Process

### Alpha Releases

1. Merge PR to `alpha` branch
2. Alpha version automatically published
3. Version format: `1.0.0-alpha.TIMESTAMP.SHA`
4. NPM tag: `alpha`

### Stable Releases

1. Create PR from `alpha` to `main`
2. Get approval
3. Merge to `main`
4. Changesets creates release PR (or publishes if release PR exists)
5. Merge release PR
6. Stable version published to npm
7. NPM tag: `latest`

## Project Structure

```
arweave-query/
├── packages/
│   ├── core/               # Core package (@arweave-query/core)
│   ├── cli/                # CLI tool
│   └── frameworks/
│       └── react/          # React hooks
├── .github/
│   └── workflows/          # CI/CD workflows
├── .changeset/             # Changesets configuration
├── docs/                   # Documentation site
└── fixtures/               # Test fixtures
```

## Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run in watch mode
pnpm test

# Run specific package
cd packages/core && pnpm test
```

### Integration Tests

```bash
# All integration tests
pnpm test:integration

# Node.js only
pnpm test:integration:node

# Browser only
pnpm test:integration:browser
```

### Writing Tests

- Place unit tests next to source files: `*.test.ts`
- Place integration tests in `tests/integration/`
- Use descriptive test names
- Cover edge cases
- Mock external dependencies

## Code Style

We use:

- **Prettier** for formatting
- **ESLint** for linting
- **TypeScript** for type safety

Configuration is enforced via:

- Pre-commit hooks (Husky + lint-staged)
- CI checks

### Auto-fix Issues

```bash
# Format all files
pnpm format

# Fix linting issues
pnpm lint:fix
```

## Package-Specific Guidelines

### @arweave-query/core

- Keep dependencies minimal
- Maintain tree-shakability
- Support both Node.js and browser
- Provide separate `/node` and `/web` exports

### Integration Tests

- Use Testcontainers for Docker
- Mount fixtures from `fixtures/parquet/`
- Clean up resources in `afterAll`
- Use appropriate timeouts

## Documentation

Update documentation when:

- Adding new features
- Changing APIs
- Adding examples
- Fixing bugs (if docs were incorrect)

Documentation locations:

- API docs: In-code JSDoc comments
- Examples: `README.md` files
- Guides: `docs/` directory

## Getting Help

- 💬 Open a discussion for questions
- 🐛 Open an issue for bugs
- 💡 Open an issue for feature requests
- 📧 Contact maintainers for security issues

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn
- Follow the project's technical direction

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

## Recognition

Contributors will be:

- Listed in CHANGELOG.md
- Credited in release notes
- Acknowledged in the project README

Thank you for contributing! 🙏

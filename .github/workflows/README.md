# GitHub Workflows

This directory contains the CI/CD workflows for the arweave-query monorepo.

## Workflows

### 🔍 CI (`ci.yml`)

Runs on all PRs and pushes to `main` and `alpha` branches.

**Jobs:**
- **Quality Checks**: Formatting, linting, and type checking
- **Test**: Unit tests across Node.js 18, 20, and 22
- **Integration Tests**: Node.js and browser integration tests with Docker
- **Build**: Build verification and artifact checks

**Triggers:**
- All pull requests
- Pushes to `main` and `alpha` branches

### 🚀 Release Stable (`release-stable.yml`)

Creates stable releases when changes are merged to `main`.

**Process:**
1. Builds all packages
2. Uses Changesets to:
   - Create a release PR (if there are unreleased changes)
   - Or publish to npm (if the release PR is merged)
3. Publishes to npm with `latest` tag
4. Creates GitHub releases

**Triggers:**
- Push to `main` branch

**Requirements:**
- `NPM_TOKEN` secret must be configured
- Changesets files must exist in `.changeset/`

### 🧪 Release Alpha (`release-alpha.yml`)

Creates alpha releases when changes are merged to `alpha`.

**Process:**
1. Builds all packages
2. Calculates alpha version: `X.Y.Z-alpha.TIMESTAMP.SHA`
3. Publishes to npm with `alpha` tag
4. Creates GitHub pre-release

**Version Format:**
```
1.0.0-alpha.1730000000.abc1234
         └─ timestamp ─┘ └─ git SHA ─┘
```

**Install:**
```bash
npm install @arweave-query/core@alpha
```

**Triggers:**
- Push to `alpha` branch

### 🎯 Release RC (`release-rc.yml`)

Creates release candidate versions for pull requests.

**Process:**
1. Checks if PR is between `main` ↔ `alpha` (skips if true)
2. Builds all packages
3. Calculates RC version: `X.Y.Z-rc.PR.SHA`
4. Publishes to npm with `rc` tag
5. Comments on PR with installation instructions

**Version Format:**
```
1.0.0-rc.123.abc1234
      └─ PR # ─┘ └─ git SHA ─┘
```

**Install:**
```bash
npm install @arweave-query/core@rc
# or specific version
npm install @arweave-query/core@1.0.0-rc.123.abc1234
```

**Triggers:**
- PRs to `main` or `alpha` (except `main` ↔ `alpha`)

**Skipped for:**
- `main` → `alpha` PRs
- `alpha` → `main` PRs

## Release Strategy

### Branching Model

```
main (stable)
  ↓
  └─ alpha (pre-release)
       ↓
       └─ feature/* (development)
```

### Release Types

| Branch/PR | Release Type | NPM Tag | Version Format | Auto-Publish |
|-----------|--------------|---------|----------------|--------------|
| `main` merge | Stable | `latest` | `1.0.0` | ✅ Yes |
| `alpha` merge | Alpha | `alpha` | `1.0.0-alpha.TS.SHA` | ✅ Yes |
| Feature PR | RC | `rc` | `1.0.0-rc.PR.SHA` | ✅ Yes |
| `main` ↔ `alpha` PR | - | - | - | ❌ No |

### Workflow

#### 1. **Feature Development**
```bash
# Create feature branch from alpha
git checkout alpha
git pull
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Create changeset (optional, recommended)
pnpm changeset:add

# Push and create PR to alpha
git push origin feature/my-feature
```

**Result:** RC version published on npm with `rc` tag

#### 2. **Alpha Release**
```bash
# Merge feature PR to alpha
gh pr merge <pr-number> --merge
```

**Result:** Alpha version published on npm with `alpha` tag

#### 3. **Stable Release**
```bash
# When alpha is stable, create PR: alpha -> main
gh pr create --base main --head alpha --title "chore: promote to stable"

# Merge PR to main
gh pr merge <pr-number> --merge
```

**Result:** 
- Changesets creates/updates release PR
- When release PR is merged, stable version published to npm

## Secrets Required

| Secret | Purpose | Where to Get |
|--------|---------|--------------|
| `NPM_TOKEN` | Publish to npm | [npmjs.com/settings](https://www.npmjs.com/settings/YOUR_USERNAME/tokens) |
| `GITHUB_TOKEN` | Create releases | Auto-provided by GitHub |

### Setting Up NPM_TOKEN

1. Go to [npmjs.com](https://www.npmjs.com/)
2. Settings → Access Tokens → Generate New Token
3. Select "Automation" type
4. Copy the token
5. In GitHub: Settings → Secrets → Actions → New repository secret
6. Name: `NPM_TOKEN`, Value: `<your-token>`

## Local Testing

### Test CI Locally

```bash
# Run all CI checks
pnpm ci

# Or individually
pnpm format:check
pnpm lint
pnpm type-check
pnpm test:run
pnpm build
```

### Test Changesets

```bash
# Add a changeset
pnpm changeset:add

# Check changeset status
pnpm changeset:status

# Version packages (updates version in package.json)
pnpm version-packages

# Publish (don't run this locally!)
# pnpm release
```

## Troubleshooting

### CI Fails on `format:check`

```bash
# Fix formatting
pnpm format

# Commit changes
git add .
git commit -m "chore: format code"
```

### CI Fails on `lint`

```bash
# Fix linting issues
pnpm lint:fix

# Commit changes
git add .
git commit -m "chore: fix lint errors"
```

### Release Fails

Check:
1. ✅ `NPM_TOKEN` secret is configured
2. ✅ You have npm publish permissions for `@arweave-query` org
3. ✅ Package version doesn't already exist on npm
4. ✅ All tests pass

### RC Not Published

Check:
1. ✅ PR is not between `main` ↔ `alpha`
2. ✅ PR is targeting `main` or `alpha`
3. ✅ Build succeeds
4. ✅ `NPM_TOKEN` is valid

## Best Practices

1. **Always create changesets** for user-facing changes
2. **Test RC versions** before merging to alpha
3. **Test alpha versions** thoroughly before promoting to main
4. **Use conventional commits** for better changelogs
5. **Keep main stable** - only merge well-tested code

## Questions?

- Check the [Changesets documentation](https://github.com/changesets/changesets)
- Review [NX documentation](https://nx.dev/)
- Open an issue if you need help!


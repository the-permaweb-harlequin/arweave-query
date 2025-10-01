# CI/CD Setup Summary

Complete CI/CD pipeline for the arweave-query monorepo with automated testing, linting, and multi-environment releases.

## 🎯 Overview

This project uses a sophisticated CI/CD pipeline with:

- **NX** for monorepo task orchestration
- **Changesets** for version management
- **GitHub Actions** for CI/CD automation
- **pnpm** for package management

## 📋 Release Strategy

### Branch Model

```
main (stable releases)
  ↓ promote
  └─ alpha (alpha releases)
       ↓ merge
       └─ feature/* (RC releases on PR)
```

### Release Types

| Environment | Trigger              | Version Format                   | NPM Tag  | Auto-Publish |
| ----------- | -------------------- | -------------------------------- | -------- | ------------ |
| **Stable**  | Merge to `main`      | `1.0.0`                          | `latest` | ✅           |
| **Alpha**   | Merge to `alpha`     | `1.0.0-alpha.1730000000.abc1234` | `alpha`  | ✅           |
| **RC**      | PR to `main`/`alpha` | `1.0.0-rc.123.abc1234`           | `rc`     | ✅           |

**Special Rules:**

- ❌ RC releases are **NOT** created for `main` ↔ `alpha` PRs
- ✅ Alpha releases use timestamp + git SHA for uniqueness
- ✅ RC releases use PR number + git SHA for uniqueness

## 🔧 GitHub Workflows

### 1. CI Workflow (`ci.yml`)

**Runs on:** All PRs and pushes to `main`/`alpha`

**Jobs:**

1. **Quality Checks** (1 job)
   - Format checking
   - Linting
   - Type checking

2. **Test** (3 jobs - Node 18, 20, 22)
   - Unit tests
   - Build verification

3. **Integration Tests** (1 job)
   - Node.js integration tests with Docker
   - Browser integration tests with Playwright

4. **Build** (1 job)
   - Build all packages
   - Verify build artifacts

5. **All Checks Passed** (1 job)
   - Final verification gate

### 2. Release Stable Workflow (`release-stable.yml`)

**Runs on:** Push to `main`

**Process:**

1. Build all packages
2. Run `changeset version` (if needed)
3. Create release PR **or** publish to npm
4. Publish with `latest` tag
5. Enable npm provenance

**Requires:**

- Changesets in `.changeset/` directory
- `NPM_TOKEN` secret

### 3. Release Alpha Workflow (`release-alpha.yml`)

**Runs on:** Push to `alpha`

**Process:**

1. Build all packages
2. Calculate alpha version: `BASE-alpha.TIMESTAMP.SHA`
3. Update package.json versions
4. Publish to npm with `alpha` tag
5. Create GitHub pre-release
6. Enable npm provenance

### 4. Release RC Workflow (`release-rc.yml`)

**Runs on:** PRs to `main` or `alpha`

**Skip Logic:**

```typescript
if (base === 'main' && head === 'alpha') skip = true;
if (base === 'alpha' && head === 'main') skip = true;
```

**Process:**

1. Check if should skip (main ↔ alpha)
2. Build all packages
3. Calculate RC version: `BASE-rc.PR.SHA`
4. Update package.json versions
5. Publish to npm with `rc` tag
6. Comment on PR with install instructions
7. Enable npm provenance

## 📦 NX Configuration

### Targets Defined

| Target              | Description           | Cache | Dependencies        |
| ------------------- | --------------------- | ----- | ------------------- |
| `build`             | Build packages        | ✅    | Depends on `^build` |
| `test`              | Unit tests            | ✅    | None                |
| `test:integration*` | Integration tests     | ❌    | Depends on `build`  |
| `lint`              | ESLint                | ✅    | None                |
| `type-check`        | TypeScript            | ✅    | Depends on `^build` |
| `format`            | Prettier write        | ✅    | None                |
| `format:check`      | Prettier check        | ✅    | None                |
| `clean`             | Clean build artifacts | ❌    | None                |

### Caching Strategy

**Cached Operations:**

- `build` - Build outputs
- `test` - Test results and coverage
- `lint` - Lint results
- `type-check` - TypeScript check results
- `format`, `format:check` - Format check results

**Not Cached:**

- `test:integration*` - Requires Docker, network calls
- `clean` - No outputs to cache

### Named Inputs

- `default` - All project files + shared globals
- `production` - Default minus test files and configs
- `sharedGlobals` - Workspace-level configs

## 🔑 Required Secrets

| Secret         | Where to Set                | Purpose                         |
| -------------- | --------------------------- | ------------------------------- |
| `NPM_TOKEN`    | GitHub → Settings → Secrets | Publish to npm                  |
| `GITHUB_TOKEN` | Auto-provided               | Create releases, comment on PRs |

### Creating NPM_TOKEN

1. Go to [npmjs.com/settings/YOUR_USERNAME/tokens](https://www.npmjs.com/settings)
2. Click "Generate New Token" → "Automation"
3. Copy the token
4. In GitHub: Settings → Secrets and variables → Actions → New repository secret
5. Name: `NPM_TOKEN`, Value: `<paste-token>`

## 📝 Package Scripts

### Root Package (`package.json`)

```json
{
  "scripts": {
    "build": "nx run-many --target=build --all",
    "test": "nx run-many --target=test --all",
    "test:run": "nx run-many --target=test --all -- --run",
    "test:integration": "cd packages/core && pnpm test:integration",
    "test:integration:node": "cd packages/core && pnpm test:integration:node",
    "test:integration:browser": "cd packages/core && pnpm test:integration:browser",
    "lint": "nx run-many --target=lint --all",
    "lint:fix": "nx run-many --target=lint --all -- --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "nx run-many --target=type-check --all",
    "clean": "nx run-many --target=clean --all && nx reset",
    "changeset": "changeset",
    "changeset:add": "changeset add",
    "changeset:status": "changeset status",
    "version-packages": "changeset version",
    "release": "pnpm build && changeset publish",
    "ci": "pnpm format:check && pnpm lint && pnpm type-check && pnpm test:run && pnpm build"
  }
}
```

### Core Package (`packages/core/package.json`)

```json
{
  "scripts": {
    "build": "vite build",
    "test": "vitest",
    "test:run": "vitest run",
    "test:integration": "pnpm test:integration:node && pnpm test:integration:browser",
    "test:integration:node": "vitest run --config vitest.config.integration.ts",
    "test:integration:browser": "vitest run --config vitest.config.browser.ts",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx"
  }
}
```

## 🚀 Usage Examples

### Creating a Feature

```bash
# 1. Create feature branch from alpha
git checkout alpha && git pull
git checkout -b feature/my-feature

# 2. Make changes and test locally
pnpm ci

# 3. Create changeset (if needed)
pnpm changeset:add
# Select packages, version bump, and write summary

# 4. Commit and push
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature

# 5. Create PR
gh pr create --base alpha --title "feat: my feature"
```

**Result:** RC version published automatically, install with:

```bash
npm install @arweave-query/core@rc
```

### Releasing to Alpha

```bash
# Merge PR to alpha
gh pr merge <pr-number>
```

**Result:** Alpha version `1.0.0-alpha.TS.SHA` published, install with:

```bash
npm install @arweave-query/core@alpha
```

### Promoting to Stable

```bash
# 1. Create promotion PR
gh pr create --base main --head alpha --title "chore: promote alpha to stable"

# 2. Review and merge
gh pr merge <pr-number>
```

**Result:**

- Changesets creates/updates release PR
- Merge release PR to publish stable version

## 🧪 Local Development

### Run All CI Checks

```bash
pnpm ci
```

Equivalent to:

```bash
pnpm format:check && \
pnpm lint && \
pnpm type-check && \
pnpm test:run && \
pnpm build
```

### Run Specific Checks

```bash
# Format code
pnpm format

# Lint code
pnpm lint
pnpm lint:fix

# Type check
pnpm type-check

# Unit tests
pnpm test          # watch mode
pnpm test:run      # run once

# Integration tests
pnpm test:integration              # all
pnpm test:integration:node         # node only
pnpm test:integration:browser      # browser only

# Build
pnpm build
```

## 📊 Release Metrics

### Stable Release

- **Frequency:** When alpha is stable
- **Process Time:** ~5 minutes
- **Steps:** Build → Version → Publish → Release
- **Verification:** npm, GitHub releases

### Alpha Release

- **Frequency:** On every merge to alpha
- **Process Time:** ~3 minutes
- **Steps:** Build → Version → Publish → Pre-release
- **Verification:** npm (alpha tag), GitHub pre-releases

### RC Release

- **Frequency:** On every PR push
- **Process Time:** ~2 minutes
- **Steps:** Build → Version → Publish → Comment
- **Verification:** npm (rc tag), PR comment

## 🔍 Troubleshooting

### CI Failing

1. **Format Check Fails**

   ```bash
   pnpm format
   git add . && git commit -m "chore: format code"
   ```

2. **Lint Fails**

   ```bash
   pnpm lint:fix
   git add . && git commit -m "chore: fix lint errors"
   ```

3. **Tests Fail**

   ```bash
   pnpm test:run
   # Fix failing tests
   ```

4. **Build Fails**
   ```bash
   pnpm clean
   pnpm build
   ```

### Release Failing

1. **Check NPM_TOKEN**
   - Verify secret is set in GitHub
   - Verify token has publish permissions
   - Regenerate if needed

2. **Check Version Conflict**
   - Version might already exist on npm
   - Check changeset configuration

3. **Check Permissions**
   - Verify you're a member of `@arweave-query` org
   - Verify package access settings

### RC Not Created

1. **Is it a main ↔ alpha PR?**
   - RC is intentionally skipped for these

2. **Check PR base/head branches**
   - Must target `main` or `alpha`

3. **Check workflow runs**
   - View Actions tab in GitHub
   - Check for errors

## 📚 Additional Resources

- [Changesets Documentation](https://github.com/changesets/changesets/tree/main/docs)
- [NX Documentation](https://nx.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [pnpm Documentation](https://pnpm.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## ✅ Checklist

Before your first release:

- [ ] Configure `NPM_TOKEN` secret in GitHub
- [ ] Verify npm org access (`@arweave-query`)
- [ ] Test changeset workflow locally
- [ ] Review branching strategy
- [ ] Read CONTRIBUTING.md
- [ ] Create your first changeset

---

**Status:** ✅ Production Ready

**Last Updated:** 2025-10-01

**Maintained By:** The Permaweb Harlequin

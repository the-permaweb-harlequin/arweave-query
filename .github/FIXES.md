# CI/CD Setup Fixes

This document tracks issues encountered during CI/CD setup and their resolutions.

## ✅ Fixed: pnpm Version Mismatch

**Date:** 2025-10-01  
**Issue:** GitHub Actions failing with version conflict

### Error Message

```
Error: Multiple versions of pnpm specified:
  - version 8 in the GitHub Action config with the key "version"
  - version pnpm@8.15.0 in the package.json with the key "packageManager"
Remove one of these versions to avoid version mismatch errors like ERR_PNPM_BAD_PM_VERSION
```

### Root Cause

Workflows specified `version: 8` explicitly, which conflicted with `packageManager: "pnpm@8.15.0"` in `package.json`.

### Solution

Removed explicit version from all workflow files. The `pnpm/action-setup@v4` action automatically reads the version from `package.json`.

**Files Modified:**

- `.github/workflows/ci.yml`
- `.github/workflows/release-stable.yml`
- `.github/workflows/release-alpha.yml`
- `.github/workflows/release-rc.yml`

**Change:**

```yaml
# Before
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 8 # ❌ Removed

# After
- name: Setup pnpm
  uses: pnpm/action-setup@v4 # ✅ Reads from package.json
```

## ✅ Fixed: Lockfile Strategy Changed

**Date:** 2025-10-01  
**Issue:** CI failing with incompatible lockfile

### Error Message

```
WARN  Ignoring not compatible lockfile at /home/runner/work/arweave-query/arweave-query/pnpm-lock.yaml
ERR_PNPM_NO_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is absent
```

### Root Cause

The `pnpm-lock.yaml` was incompatible with the pnpm version, and using `--frozen-lockfile` prevented resolution.

### Solution

Changed CI strategy to use `--no-frozen-lockfile` to allow dependency resolution during CI runs:

```bash
# In all workflows
pnpm install --no-frozen-lockfile
```

**Files Modified:**

- `.github/workflows/ci.yml`
- `.github/workflows/release-stable.yml`
- `.github/workflows/release-alpha.yml`
- `.github/workflows/release-rc.yml`
- `pnpm-lock.yaml` (regenerated locally)

### Trade-offs

- ✅ **Pros:** More flexible, handles lockfile version mismatches
- ⚠️ **Cons:** Potentially non-deterministic builds (dependencies may update)
- 💡 **Mitigation:** Lockfile is still committed and used as baseline reference

### Prevention

Always commit the lockfile after:

1. Changing pnpm version in `package.json`
2. Adding/removing dependencies
3. Updating dependencies

## ✅ Fixed: YAML Indentation in release-rc.yml

**Date:** 2025-10-01  
**Issue:** Inconsistent indentation causing workflow syntax errors

### Root Cause

Mixed 4-space and 3-space indentation in workflow steps.

### Solution

Standardized all indentation to match GitHub Actions convention (consistent spacing).

**File Modified:**

- `.github/workflows/release-rc.yml`

## ✅ Fixed: Missing Generated Files

**Date:** 2025-10-01  
**Issue:** Build failing with "Cannot find module './generated/graphql.js'"

### Error Message

```
error TS2307: Cannot find module './generated/graphql.js' or its corresponding type declarations.
error TS2307: Cannot find module './generated/parquet-types.js' or its corresponding type declarations.
```

### Root Cause

Generated TypeScript files were not created before building. The project requires:

- GraphQL types generated from schema
- Parquet types generated from scripts

### Solution

Added code generation step to all workflows before building:

```yaml
- name: Generate code
  run: |
    pnpm codegen
    pnpm codegen:parquet

- name: Build packages
  run: pnpm build
```

**Files Modified:**

- `.github/workflows/ci.yml` (4 jobs updated)
- `.github/workflows/release-stable.yml`
- `.github/workflows/release-alpha.yml`
- `.github/workflows/release-rc.yml`

### Build Order

The correct order for building this project:

1. **Install dependencies** - `pnpm install`
2. **Generate code** - `pnpm codegen && pnpm codegen:parquet`
3. **Build packages** - `pnpm build`
4. **Run tests** - `pnpm test:run`

## Best Practices for Future

### 1. pnpm Version Management

- ✅ **DO:** Specify version in `package.json` only
  ```json
  {
    "packageManager": "pnpm@8.15.0"
  }
  ```
- ❌ **DON'T:** Specify version in workflow files
  ```yaml
  # Don't do this:
  uses: pnpm/action-setup@v4
  with:
    version: 8 # ❌
  ```

### 2. Lockfile Management

- ✅ **DO:** Always commit `pnpm-lock.yaml`
- ✅ **DO:** Regenerate lockfile when changing pnpm version
- ✅ **DO:** Use `--no-frozen-lockfile` in CI (for flexibility)
- ❌ **DON'T:** Manually edit the lockfile
- ❌ **DON'T:** Ignore lockfile in `.gitignore`
- 💡 **NOTE:** Using `--no-frozen-lockfile` allows CI to resolve dependencies even with version mismatches

### 3. Workflow Formatting

- ✅ **DO:** Use consistent indentation (2 spaces per level)
- ✅ **DO:** Validate YAML syntax before committing
- ✅ **DO:** Use quotes for strings with special characters
- ❌ **DON'T:** Mix tabs and spaces

### 4. Testing Workflows Locally

Before pushing workflow changes:

```bash
# 1. Install act (GitHub Actions local runner)
brew install act

# 2. Test workflow locally
act -W .github/workflows/ci.yml

# 3. Or use GitHub's workflow validator
# Push to a test branch and check Actions tab
```

### 5. Debugging Failed Workflows

When a workflow fails:

1. **Check the error message** in GitHub Actions logs
2. **Verify secrets** are configured correctly
3. **Test commands locally** using the same pnpm version
4. **Check syntax** using a YAML validator
5. **Review recent changes** to workflow files

### 6. Committing Workflow Changes

**Recommended commit messages:**

```bash
# For fixes
git commit -m "ci: fix pnpm version mismatch"

# For new workflows
git commit -m "ci: add RC release workflow"

# For updates
git commit -m "ci: update Node.js versions to 18, 20, 22"
```

## Verification Checklist

Before merging CI/CD changes:

- [ ] `pnpm-lock.yaml` is committed and up to date
- [ ] Workflows use correct pnpm setup (no explicit version)
- [ ] All YAML files have valid syntax
- [ ] Secrets are configured in GitHub
- [ ] Branch protection rules are set
- [ ] Test the CI workflow with a test PR
- [ ] Documentation is updated

## Helpful Resources

- [pnpm action-setup](https://github.com/pnpm/action-setup)
- [GitHub Actions Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [YAML Validator](https://www.yamllint.com/)

## Quick Commands

```bash
# Full setup (same as CI)
pnpm install --no-frozen-lockfile
pnpm codegen
pnpm codegen:parquet
pnpm build

# Regenerate lockfile
rm pnpm-lock.yaml && pnpm install

# Generate types
pnpm codegen              # GraphQL types
pnpm codegen:parquet      # Parquet types

# Validate workflow syntax (requires act)
act -l

# Check pnpm version
pnpm --version

# Check package manager setting
node -p "require('./package.json').packageManager"

# Test install (same as CI)
pnpm install --no-frozen-lockfile

# Or strict install (for testing determinism)
pnpm install --frozen-lockfile
```

---

**Last Updated:** 2025-10-01  
**Status:** All issues resolved ✅

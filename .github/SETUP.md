# GitHub Actions Setup Guide

Complete setup guide for CI/CD workflows in this repository.

## 🔑 Required Secrets

Configure these secrets in GitHub: **Settings → Secrets and variables → Actions → New repository secret**

### 1. NPM_TOKEN ✅ (Configured)

**Purpose:** Publish packages to npm registry

**How to create:**

1. Go to [npmjs.com/settings/YOUR_USERNAME/tokens](https://www.npmjs.com/settings)
2. Click **"Generate New Token"** → **"Automation"**
3. Copy the token
4. Add to GitHub secrets as `NPM_TOKEN`

**Required permissions:**

- ✅ Publish packages
- ✅ Access to `@arweave-query` organization

**Used in:**

- `release-stable.yml` - Publish stable releases
- `release-alpha.yml` - Publish alpha releases
- `release-rc.yml` - Publish RC releases

### 2. SLACK_WEBHOOK_URL

**Purpose:** Send release notifications to Slack

**How to create:**

1. Go to your Slack workspace
2. Visit [api.slack.com/apps](https://api.slack.com/apps)
3. Click **"Create New App"** → **"From scratch"**
4. Name it (e.g., "arweave-query Releases")
5. Select your workspace
6. Go to **"Incoming Webhooks"** → Enable
7. Click **"Add New Webhook to Workspace"**
8. Select the channel for notifications
9. Copy the webhook URL
10. Add to GitHub secrets as `SLACK_WEBHOOK_URL`

**Example webhook URL:**

```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**Used in:**

- `release-stable.yml` - Notify stable releases
- `release-alpha.yml` - Notify alpha releases
- `release-rc.yml` - Notify RC releases

**Notification format:**

- 🚀 Stable releases: Green (success) / Red (failure)
- 🧪 Alpha releases: Orange (success) / Red (failure)
- 🏗️ RC releases: Blue (success) / Red (failure)

### 3. GITHUB_TOKEN (Auto-provided)

**Purpose:** Create GitHub releases, comment on PRs, push commits

**No action needed** - Automatically provided by GitHub Actions

**Permissions:**

- ✅ Read repository
- ✅ Write releases
- ✅ Comment on PRs
- ✅ Push commits

## 📋 Setup Checklist

### Initial Setup

- [ ] **Fork/Clone Repository**

  ```bash
  git clone https://github.com/the-permaweb-harlequin/arweave-query.git
  cd arweave-query
  ```

- [ ] **Install Dependencies**

  ```bash
  pnpm install
  ```

- [ ] **Verify Build**
  ```bash
  pnpm build
  pnpm test:run
  ```

### GitHub Configuration

- [x] **NPM_TOKEN Secret** - Already configured
  - Verify: Settings → Secrets → NPM_TOKEN exists

- [ ] **SLACK_WEBHOOK_URL Secret** - Add webhook URL
  - Settings → Secrets → New secret → `SLACK_WEBHOOK_URL`

- [ ] **Branch Protection Rules** - Protect main and alpha
  - Settings → Branches → Add rule for `main`:
    - ✅ Require pull request reviews (1 approval)
    - ✅ Require status checks to pass
    - ✅ Require branches to be up to date
    - ✅ Include administrators
  - Settings → Branches → Add rule for `alpha`:
    - ✅ Require status checks to pass
    - ✅ Require branches to be up to date

- [ ] **Enable GitHub Actions**
  - Settings → Actions → General
  - Workflow permissions: **"Read and write permissions"**
  - ✅ Allow GitHub Actions to create and approve pull requests

### NPM Configuration

- [x] **Organization Access** - Verified for `@arweave-query`
  - You have publish access to the org

- [ ] **Package Access Settings**
  - Go to [npmjs.com/settings/@arweave-query/packages](https://www.npmjs.com/settings/@arweave-query/packages)
  - Ensure package is **"Public"**
  - Verify team members have correct permissions

### Slack Configuration (Optional)

- [ ] **Create Slack App**
  - Follow steps in "SLACK_WEBHOOK_URL" section above

- [ ] **Configure Channel**
  - Choose a channel for release notifications
  - Recommended: `#releases` or `#deployments`

- [ ] **Test Notification**
  - After adding secret, trigger a test release
  - Verify notification appears in Slack

## 🧪 Testing the Setup

### 1. Test CI Workflow

```bash
# Create a test branch
git checkout -b test/ci-setup

# Make a small change
echo "# Test" >> TEST.md

# Push and create PR
git add .
git commit -m "test: verify CI"
git push origin test/ci-setup
gh pr create --base alpha --title "test: CI verification"
```

**Expected:**

- ✅ CI workflow runs (format, lint, type-check, test, build)
- ✅ All checks pass
- ✅ RC version published to npm
- ✅ Bot comments on PR with RC install instructions
- ✅ Slack notification sent (if configured)

### 2. Test Alpha Release

```bash
# Merge the test PR
gh pr merge <pr-number> --squash

# Check alpha branch
git checkout alpha
git pull
```

**Expected:**

- ✅ Alpha release workflow runs
- ✅ Version `X.Y.Z-alpha.TIMESTAMP.SHA` published
- ✅ GitHub pre-release created
- ✅ Slack notification sent (if configured)
- ✅ Can install: `npm install @arweave-query/core@alpha`

### 3. Test Stable Release

```bash
# Create changeset
pnpm changeset:add
# Select packages, version bump, write summary

# Commit changeset
git add .changeset
git commit -m "chore: add changeset for test"
git push origin alpha

# Create PR to main
gh pr create --base main --head alpha --title "chore: test stable release"

# Merge PR (after approval)
gh pr merge <pr-number>
```

**Expected:**

- ✅ Changesets creates release PR
- ✅ Merge release PR to publish
- ✅ Stable version `X.Y.Z` published
- ✅ GitHub release created
- ✅ Slack notification sent (if configured)
- ✅ Can install: `npm install @arweave-query/core@latest`

## 🔍 Verification Commands

### Check NPM Tokens Work

```bash
# Set token locally (don't commit!)
echo "//registry.npmjs.org/:_authToken=YOUR_TOKEN" > .npmrc

# Try publishing (dry run)
cd packages/core
npm publish --dry-run

# Clean up
rm ../../.npmrc
```

### Check Slack Webhook Works

```bash
# Test webhook directly
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test notification from arweave-query"}' \
  YOUR_WEBHOOK_URL
```

### Check GitHub Permissions

```bash
# Verify you can create releases
gh release create test-release --draft --notes "Test"
gh release delete test-release --yes

# Verify you can comment on PRs
gh pr comment <pr-number> --body "Test comment"
```

## 📊 Workflow Execution

### CI Workflow

**Triggers:** All PRs, pushes to main/alpha  
**Duration:** ~5-10 minutes  
**Jobs:** Quality → Test → Integration → Build → Verify

### Release Stable

**Triggers:** Push to `main`  
**Duration:** ~3-5 minutes  
**Jobs:** Release → Notify

**Publishes:**

- 📦 npm package: `@arweave-query/core@latest`
- 🏷️ GitHub release: `vX.Y.Z`

### Release Alpha

**Triggers:** Push to `alpha`  
**Duration:** ~3-5 minutes  
**Jobs:** Release → Notify

**Publishes:**

- 📦 npm package: `@arweave-query/core@alpha`
- 🏷️ GitHub pre-release: `vX.Y.Z-alpha.TS.SHA`

### Release RC

**Triggers:** PRs to `main`/`alpha` (except main↔alpha)  
**Duration:** ~2-3 minutes  
**Jobs:** Check → Release → Notify

**Publishes:**

- 📦 npm package: `@arweave-query/core@rc`
- 💬 PR comment with install instructions

## 🚨 Troubleshooting

### NPM Publish Fails

**Error:** `401 Unauthorized`

- Check NPM_TOKEN is valid
- Verify token has publish permissions
- Regenerate token if needed

**Error:** `403 Forbidden`

- Check you're a member of `@arweave-query` org
- Verify package access settings

**Error:** `Version already exists`

- Version was already published
- For stable: Update changeset version
- For alpha/RC: Wait for new commit (auto-increments)

### Slack Notifications Not Sending

**No notification:**

- Verify `SLACK_WEBHOOK_URL` secret is set
- Check webhook URL is valid
- Test webhook with curl command above

**Notification fails:**

- Check Slack app permissions
- Verify channel exists
- Re-create webhook if needed

### CI Fails on Tests

**Integration tests timeout:**

- Docker might not be available
- Check Docker service in GitHub Actions
- Increase timeout in workflow

**Unit tests fail:**

- Run locally: `pnpm test:run`
- Check for environment-specific issues
- Review error logs in Actions

### Release Workflow Doesn't Run

**Check triggers:**

- Verify branch name matches (`main`, `alpha`)
- Check workflow file syntax
- View Actions tab for errors

**Check permissions:**

- Settings → Actions → Workflow permissions
- Should be "Read and write"

## 📚 Additional Resources

- [Changesets Documentation](https://github.com/changesets/changesets)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [NPM Tokens Guide](https://docs.npmjs.com/about-access-tokens)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)

## ✅ Final Checklist

Before going live:

- [x] NPM_TOKEN configured
- [ ] SLACK_WEBHOOK_URL configured (optional)
- [ ] Branch protection rules enabled
- [ ] GitHub Actions permissions set
- [ ] Test CI workflow passes
- [ ] Test alpha release works
- [ ] Test stable release works
- [ ] Team members added to npm org
- [ ] Documentation reviewed
- [ ] Slack channel configured (optional)

---

**Setup Status:** 90% Complete

**Remaining:** Configure Slack webhook (optional), enable branch protection

**Contact:** Open an issue if you need help!

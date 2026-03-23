# CI/CD Setup for @sankalpmukim/hadolint-lsp

This repository uses GitHub Actions for continuous integration and deployment.

## CI Workflow

The `.github/workflows/ci-cd.yml` workflow:

- **Runs on every push and pull request** to `master` or `main` branches
- **Tests the package** using `npm test`
- **Publishes to npm** automatically when a release is created

## Workflow Steps

### Test Job (runs on every push/PR)

1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Run tests (`npm test`)

### Publish Job (runs only on release)

1. Runs after tests pass
2. Publishes to npm registry
3. Creates GitHub release

## Setting Up NPM Token

To enable automatic publishing, add `NPM_TOKEN` secret to your GitHub repository:

### Option 1: Granular Access Token (Recommended)

1. Go to https://www.npmjs.com/settings/tokens
2. Click **"Generate New Token"**
3. Select **"Granular Access Token"**
4. Configure:
   - **Name**: `github-actions-hadolint-lsp`
   - **Organization**: `@sankalpmukim`
   - **Expiration**: 90 days or No expiration
   - **Access Level**: **"Publish"**
   - **Enable 2FA bypass**: ✅ Yes
5. Click **"Generate Token"**
6. **Copy the token** (you won't see it again!)

### Option 2: Automation Token

1. Go to https://www.npmjs.com/settings/tokens
2. Click **"Generate New Token"**
3. Select **"Automation"**
4. Configure:
   - **Name**: `github-actions-hadolint-lsp`
   - **Expiration**: 90 days or No expiration
5. Click **"Generate Token"**
6. **Copy the token**

### Add Token to GitHub

1. Go to: https://github.com/sankalpmukim/hadolint-lsp/settings/secrets/actions/new
2. **Name**: `NPM_TOKEN`
3. **Secret**: Paste your npm token
4. Click **"Add secret"**

## Creating Releases and Publishing

Once the secret is configured, publishing is automatic:

### Method 1: Create GitHub Release (Recommended)

1. Go to: https://github.com/sankalpmukim/hadolint-lsp/releases/new
2. **Tag version**: `v0.1.0` (or `v0.2.0`, etc.)
3. **Release title**: `v0.1.0`
4. **Description**: Add release notes
5. Click **"Publish release"**

This triggers the CI/CD workflow which:
- Runs tests
- Publishes to npm
- Creates GitHub release

### Method 2: Tag and Push

```bash
# Bump version in package.json
npm version patch  # or minor, or major

# Create tag
git tag v0.1.1
git push origin v0.1.1

# This also triggers the publish workflow
```

## Version Bumping

Before creating a release, bump the version:

```bash
# Patch version (0.1.0 -> 0.1.1)
npm version patch

# Minor version (0.1.0 -> 0.2.0)
npm version minor

# Major version (0.1.0 -> 1.0.0)
npm version major
```

This automatically:
- Updates `package.json`
- Creates git commit
- Creates git tag

## Testing Locally

Before pushing:

```bash
# Run tests locally
npm test

# Check package
npm pack --dry-run
```

## Monitoring

View workflow runs: https://github.com/sankalpmukim/hadolint-lsp/actions

## Summary

- ✅ Tests run on every push/PR
- ✅ Publishing happens on GitHub releases
- ✅ NPM_TOKEN secret required for publishing
- ✅ Uses Node.js 20
- ✅ Caches npm dependencies for faster builds

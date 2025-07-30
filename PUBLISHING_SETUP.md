# Publishing Setup Guide

## 🚀 Automated Publishing Workflow

We've set up a complete automated publishing workflow using **Changesets** and **GitHub Actions**. Here's what's been configured:

### ✅ What's Already Done

1. **Changesets Configuration** (`.changeset/config.json`)
   - GitHub changelog integration
   - Public access for all packages
   - Proper base branch (`master`)

2. **GitHub Actions Workflow** (`.github/workflows/release.yml`)
   - Automated testing before release
   - Creates release PRs automatically
   - Publishes to npm when PRs are merged
   - Runs on every push to `master`

3. **Package Scripts** (`package.json`)
   - `npm run changeset` - Add new changeset
   - `npm run version-packages` - Version packages
   - `npm run release` - Build and publish

4. **Template System Enhancement**
   - Dual-mode templates (dev vs published)
   - `--use-published` flag for end users
   - Preserves development workflow

## 🔧 Required Setup Steps

### 1. NPM Organization Setup

You mentioned you registered the `@manifold-studio` organization. Complete the setup:

```bash
# Login to npm (if not already)
npm login

# Verify organization access
npm org ls manifold-studio

# Add yourself as owner (if needed)
npm org set manifold-studio tonyhschu developer
```

### 2. GitHub Secrets Configuration

Add these secrets to your GitHub repository:

1. **NPM_TOKEN**: 
   ```bash
   # Create an automation token on npmjs.com
   # Go to: https://www.npmjs.com/settings/tokens
   # Create "Automation" token with "Publish" permission
   ```

2. **GITHUB_TOKEN**: Already available automatically

**To add secrets:**
1. Go to: `https://github.com/tonyhschu/manifold-cad-live-preview/settings/secrets/actions`
2. Click "New repository secret"
3. Add `NPM_TOKEN` with your npm automation token

### 3. First Release Process

#### Option A: Beta Release (Recommended)
```bash
# 1. Enter prerelease mode
npm run changeset pre enter beta

# 2. Version packages
npm run version-packages

# 3. Commit and push
git add .
git commit -m "Enter beta prerelease mode"
git push

# 4. GitHub Actions will automatically publish with @beta tag
```

#### Option B: Direct Release
```bash
# 1. Version packages (uses existing changeset)
npm run version-packages

# 2. Commit and push
git add .
git commit -m "Version packages for initial release"
git push

# 3. GitHub Actions will automatically publish to @latest
```

## 📋 Daily Workflow

### Adding Changes
```bash
# 1. Make your changes
# 2. Add a changeset
npm run changeset

# 3. Follow prompts to select packages and change type
# 4. Commit the changeset
git add .changeset/
git commit -m "Add changeset for feature X"
git push
```

### Publishing
1. **Automatic**: Push to `master` → GitHub Actions handles everything
2. **Manual**: Merge the "Version Packages" PR created by the bot

## 🎯 Publishing Order

The workflow will automatically publish in the correct order:
1. `@manifold-studio/wrapper` (no dependencies)
2. `@manifold-studio/typeface` (depends on wrapper)
3. `@manifold-studio/configurator` (depends on wrapper)
4. `@manifold-studio/create-app` (uses configurator)

## 🔍 Monitoring

- **Release PRs**: Automatically created when changesets exist
- **Published Packages**: Check npm or GitHub Actions logs
- **Changelogs**: Auto-generated with GitHub links
- **Git Tags**: Automatically created for each release

## 🚨 Troubleshooting

### If Publishing Fails
1. Check GitHub Actions logs
2. Verify NPM_TOKEN is valid
3. Ensure packages build successfully
4. Check for version conflicts on npm

### If Tests Fail
The workflow will not publish if tests fail, ensuring quality.

## 📚 Next Steps

1. Complete NPM organization setup
2. Add NPM_TOKEN to GitHub secrets
3. Choose beta or direct release approach
4. Test the workflow with a small change

The system is now ready for automated, professional package publishing! 🎉

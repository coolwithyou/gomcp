# Release Process for gomcp

This document outlines the release process for gomcp, including version management and automated publishing.

## Version Management Strategy

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (x.0.0): Breaking changes
- **MINOR** (0.x.0): New features (backwards compatible)
- **PATCH** (0.0.x): Bug fixes (backwards compatible)

## Release Workflow

### 1. Development Process
```
develop branch → feature branches → PR to develop → PR to main
```

### 2. Preparing a Release

#### Step 1: Update Version
```bash
# On main branch after merging from develop
git checkout main
git pull origin main

# Update version (choose one):
npm version patch     # Bug fixes: 0.12.3 → 0.12.4
npm version minor     # New features: 0.12.3 → 0.13.0
npm version major     # Breaking changes: 0.12.3 → 1.0.0
```

#### Step 2: Update CHANGELOG
Edit `CHANGELOG.md` to add release notes:
```markdown
## [0.12.4] - 2024-01-15

### Added
- New feature description

### Fixed
- Bug fix description

### Changed
- Changed behavior description
```

#### Step 3: Commit and Tag
```bash
# The npm version command already creates a commit and tag
# Just push with tags:
git push origin main --tags
```

### 3. Automated Release Process

Once you push the tag, GitHub Actions will:
1. Run all tests
2. Build the package
3. Create a GitHub Release with notes from CHANGELOG
4. Publish to npm registry
5. Verify the publication

### 4. Manual Release (if needed)

If automation fails:
```bash
# Ensure you're on the tagged commit
git checkout v0.12.4

# Build and publish
npm run build
npm publish
```

## Pre-release Versions

For beta/alpha releases:
```bash
# Beta release
npm version prerelease --preid=beta  # 0.12.3 → 0.12.4-beta.0

# Alpha release  
npm version prerelease --preid=alpha # 0.12.3 → 0.12.4-alpha.0

# Publish with tag
npm publish --tag beta
```

## Checklist Before Release

- [ ] All tests passing
- [ ] CHANGELOG.md updated
- [ ] README.md is current
- [ ] No console.log statements in production code
- [ ] Dependencies are up to date
- [ ] Breaking changes documented

## Rollback Process

If a bad version is published:
1. **Deprecate** the bad version (don't unpublish):
   ```bash
   npm deprecate gomcp@0.12.4 "Critical bug, use 0.12.5 instead"
   ```

2. **Fix and release** a new patch version immediately

## GitHub Actions Setup Required

1. **NPM_TOKEN**: See [NPM Token Setup Guide](./NPM_TOKEN_SETUP.md)
2. **Branch Protection**: Recommended for main branch
3. **Required Checks**: CI tests must pass

## Version History Commands

```bash
# View all versions
npm view gomcp versions

# View latest version
npm view gomcp version

# View specific version info
npm view gomcp@0.12.3

# View local version
npm version
```

## Best Practices

1. **Never** force push to main
2. **Always** update CHANGELOG.md
3. **Test** locally before releasing
4. **Announce** major releases
5. **Document** breaking changes clearly

## Support

- Issues: https://github.com/coolwithyou/gomcp/issues
- Discussions: https://github.com/coolwithyou/gomcp/discussions
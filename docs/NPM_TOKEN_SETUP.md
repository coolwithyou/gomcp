# NPM Token Setup Guide for GitHub Actions

This guide explains how to set up an NPM token for automated publishing through GitHub Actions.

## Step 1: Generate NPM Access Token

1. Log in to npmjs.com
2. Click on your profile picture → **Access Tokens**
3. Click **Generate New Token** → **Classic Token**
4. Select **Automation** type (recommended for CI/CD)
5. Copy the generated token (starts with `npm_`)

> ⚠️ **Important**: Save this token securely. You won't be able to see it again!

## Step 2: Add Token to GitHub Secrets

1. Go to your GitHub repository: https://github.com/coolwithyou/gomcp
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following:
   - **Name**: `NPM_TOKEN`
   - **Value**: Paste your npm token
5. Click **Add secret**

## Step 3: Verify Setup

The token is already referenced in `.github/workflows/release.yml`:

```yaml
- name: Publish to npm
  run: npm publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Security Best Practices

- ✅ Use **Automation** tokens for CI/CD (not Publish tokens)
- ✅ Tokens should have minimal required permissions
- ✅ Rotate tokens periodically (every 90 days recommended)
- ✅ Never commit tokens to your repository
- ✅ Use GitHub Secrets for all sensitive data

## Testing the Setup

After setting up the token, your next release will automatically publish to npm:

1. Update version: `npm version patch`
2. Push with tags: `git push origin main --tags`
3. GitHub Actions will handle the rest!

## Troubleshooting

If publishing fails:
1. Check the Actions tab for error logs
2. Verify the token hasn't expired
3. Ensure the token has publish permissions
4. Check if the package name is available on npm

## Optional: Add Codecov Token

If you want coverage reports:
1. Sign up at codecov.io
2. Add your repository
3. Copy the token
4. Add as `CODECOV_TOKEN` in GitHub Secrets
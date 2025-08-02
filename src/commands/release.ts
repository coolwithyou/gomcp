import chalk from 'chalk';
import ora from 'ora';
import { execa } from 'execa';
import { generateChangelog } from '../utils/changelog.js';
import { 
  getCurrentBranch, 
  hasUncommittedChanges, 
  getLatestTag,
  pushWithTags 
} from '../utils/git.js';

export type ReleaseType = 'patch' | 'minor' | 'major';

interface ReleaseOptions {
  skipTests?: boolean;
  skipLint?: boolean;
  skipBuild?: boolean;
  dryRun?: boolean;
}

export async function runRelease(releaseType: ReleaseType, options: ReleaseOptions = {}) {
  console.log(chalk.cyan.bold(`\n🚀 Starting ${releaseType} release process...\n`));

  try {
    // Check if on main branch
    const currentBranch = await getCurrentBranch();
    if (currentBranch !== 'main') {
      throw new Error(`You must be on the main branch to release. Current branch: ${currentBranch}`);
    }

    // Check for uncommitted changes
    if (await hasUncommittedChanges()) {
      throw new Error('You have uncommitted changes. Please commit or stash them before releasing.');
    }

    // Pull latest changes
    const pullSpinner = ora('Pulling latest changes from main...').start();
    try {
      await execa('git', ['pull', 'origin', 'main']);
      pullSpinner.succeed('Latest changes pulled');
    } catch (error) {
      pullSpinner.fail('Failed to pull latest changes');
      throw error;
    }

    // Run pre-release checks
    if (!options.skipTests) {
      const testSpinner = ora('Running tests...').start();
      try {
        await execa('npm', ['test']);
        testSpinner.succeed('All tests passed');
      } catch (error) {
        testSpinner.fail('Tests failed');
        throw new Error('Tests must pass before releasing');
      }
    }

    if (!options.skipLint) {
      const lintSpinner = ora('Running lint checks...').start();
      try {
        await execa('npm', ['run', 'lint']);
        lintSpinner.succeed('Lint checks passed');
      } catch (error) {
        lintSpinner.fail('Lint checks failed');
        throw new Error('Lint checks must pass before releasing');
      }
    }

    if (!options.skipBuild) {
      const buildSpinner = ora('Building project...').start();
      try {
        await execa('npm', ['run', 'build']);
        buildSpinner.succeed('Build successful');
      } catch (error) {
        buildSpinner.fail('Build failed');
        throw new Error('Build must succeed before releasing');
      }
    }

    // Get current version before update
    const { stdout: currentVersion } = await execa('npm', ['pkg', 'get', 'version']);
    const cleanCurrentVersion = currentVersion.replace(/"/g, '');

    // Update version
    const versionSpinner = ora(`Updating version (${releaseType})...`).start();
    try {
      if (options.dryRun) {
        versionSpinner.info(`[DRY RUN] Would update version from ${cleanCurrentVersion} using ${releaseType}`);
      } else {
        await execa('npm', ['version', releaseType, '--no-git-tag-version']);
        const { stdout: newVersion } = await execa('npm', ['pkg', 'get', 'version']);
        const cleanNewVersion = newVersion.replace(/"/g, '');
        versionSpinner.succeed(`Version updated: ${cleanCurrentVersion} → ${cleanNewVersion}`);
      }
    } catch (error) {
      versionSpinner.fail('Failed to update version');
      throw error;
    }

    // Get the new version
    const { stdout: newVersion } = await execa('npm', ['pkg', 'get', 'version']);
    const cleanNewVersion = newVersion.replace(/"/g, '');

    // Generate changelog
    const changelogSpinner = ora('Generating changelog...').start();
    try {
      const latestTag = await getLatestTag();
      const changelogEntry = await generateChangelog(cleanNewVersion, latestTag);
      
      if (options.dryRun) {
        changelogSpinner.info('[DRY RUN] Would update CHANGELOG.md with:');
        console.log(chalk.gray(changelogEntry));
      } else {
        // Update CHANGELOG.md
        const fs = await import('fs/promises');
        const changelogPath = 'CHANGELOG.md';
        
        try {
          const existingChangelog = await fs.readFile(changelogPath, 'utf-8');
          // Insert new entry after the title
          const updatedChangelog = existingChangelog.replace(
            /^(# Changelog\n+)/m,
            `$1${changelogEntry}\n`
          );
          await fs.writeFile(changelogPath, updatedChangelog);
        } catch (error) {
          // If CHANGELOG.md doesn't exist, create it
          const newChangelog = `# Changelog\n\n${changelogEntry}`;
          await fs.writeFile(changelogPath, newChangelog);
        }
        
        changelogSpinner.succeed('Changelog updated');
      }
    } catch (error) {
      changelogSpinner.fail('Failed to generate changelog');
      throw error;
    }

    // Commit changes
    const commitSpinner = ora('Creating release commit...').start();
    try {
      if (options.dryRun) {
        commitSpinner.info('[DRY RUN] Would commit with message: chore(release): ' + cleanNewVersion);
      } else {
        await execa('git', ['add', 'package.json', 'package-lock.json', 'CHANGELOG.md']);
        await execa('git', ['commit', '-m', `chore(release): ${cleanNewVersion}`]);
        commitSpinner.succeed('Release commit created');
      }
    } catch (error) {
      commitSpinner.fail('Failed to create commit');
      throw error;
    }

    // Create tag
    const tagSpinner = ora('Creating version tag...').start();
    try {
      if (options.dryRun) {
        tagSpinner.info(`[DRY RUN] Would create tag: v${cleanNewVersion}`);
      } else {
        await execa('git', ['tag', '-a', `v${cleanNewVersion}`, '-m', `Release v${cleanNewVersion}`]);
        tagSpinner.succeed(`Tag created: v${cleanNewVersion}`);
      }
    } catch (error) {
      tagSpinner.fail('Failed to create tag');
      throw error;
    }

    // Push changes and tags
    const pushSpinner = ora('Pushing changes to remote...').start();
    try {
      if (options.dryRun) {
        pushSpinner.info('[DRY RUN] Would push to origin main with tags');
      } else {
        await pushWithTags();
        pushSpinner.succeed('Changes pushed to remote');
      }
    } catch (error) {
      pushSpinner.fail('Failed to push changes');
      throw error;
    }

    // Success message
    console.log(chalk.green.bold(`\n✅ Release v${cleanNewVersion} completed successfully!`));
    console.log(chalk.gray('\nGitHub Actions will now:'));
    console.log(chalk.gray('  - Run tests'));
    console.log(chalk.gray('  - Create GitHub release'));
    console.log(chalk.gray('  - Publish to npm'));
    console.log(chalk.gray(`\nTrack progress at: https://github.com/coolwithyou/gomcp/actions`));

  } catch (error) {
    console.error(chalk.red('\n❌ Release failed:'), error);
    console.log(chalk.yellow('\nPlease fix the issues and try again.'));
    process.exit(1);
  }
}
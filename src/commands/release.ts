import chalk from 'chalk';
import {
  createStepProgressBar
} from '../utils/progress.js';
import { execa } from 'execa';
import { generateChangelog } from '../utils/changelog.js';
import { readFile, writeFile } from 'fs/promises';
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
  console.log(chalk.cyan.bold(`
🚀 Starting ${releaseType} release process...
`));

  // Define all release steps upfront
  const steps = [
    { name: 'Checking prerequisites', weight: 10 },
    { name: 'Pulling latest changes', weight: 10 },
    ...(options.skipTests ? [] : [{ name: 'Running tests', weight: 20 }]),
    ...(options.skipLint ? [] : [{ name: 'Running lint checks', weight: 15 }]),
    ...(options.skipBuild ? [] : [{ name: 'Building project', weight: 20 }]),
    { name: 'Updating version', weight: 10 },
    { name: 'Generating changelog', weight: 10 },
    { name: 'Creating release commit', weight: 5 },
    { name: 'Creating version tag', weight: 5 },
    { name: 'Pushing to remote', weight: 15 }
  ];

  const progressBar = createStepProgressBar({ steps });

  try {
    // Check prerequisites
    progressBar.nextStep();
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
    progressBar.nextStep();
    try {
      await execa('git', ['pull', 'origin', 'main']);
    } catch (error) {
      progressBar.fail('Failed to pull latest changes');
      throw error;
    }

    // Run pre-release checks
    if (!options.skipTests) {
      progressBar.nextStep();
      try {
        await execa('npm', ['test']);
      } catch (error) {
        progressBar.fail('Tests failed');
        throw new Error('Tests must pass before releasing');
      }
    }

    if (!options.skipLint) {
      progressBar.nextStep();
      try {
        await execa('npm', ['run', 'lint']);
      } catch (error) {
        progressBar.fail('Lint checks failed');
        throw new Error('Lint checks must pass before releasing');
      }
    }

    if (!options.skipBuild) {
      progressBar.nextStep();
      try {
        await execa('npm', ['run', 'build']);
      } catch (error) {
        progressBar.fail('Build failed');
        throw new Error('Build must succeed before releasing');
      }
    }

    // Get current version before update
    const { stdout: currentVersion } = await execa('npm', ['pkg', 'get', 'version']);
    const _cleanCurrentVersion = currentVersion.replace(/"/g, '');

    // Update version
    progressBar.nextStep();
    try {
      if (options.dryRun) {
        console.log(chalk.gray('[Dry run] Would run: npm version ' + releaseType));
      } else {
        await execa('npm', ['version', releaseType, '--no-git-tag-version']);
      }
    } catch (error) {
      progressBar.fail('Failed to update version');
      throw error;
    }

    // Get the new version
    const { stdout: newVersion } = await execa('npm', ['pkg', 'get', 'version']);
    const cleanNewVersion = newVersion?.replace(/"/g, '') || '';

    // Rebuild project to include new version in compiled files
    if (!options.skipBuild && !options.dryRun) {
      try {
        await execa('npm', ['run', 'build']);
      } catch (error) {
        progressBar.fail('Failed to rebuild with new version');
        throw error;
      }
    }

    // Generate changelog
    progressBar.nextStep();
    try {
      const latestTag = await getLatestTag();
      const changelog = await generateChangelog(latestTag || 'HEAD');

      if (options.dryRun) {
        console.log(chalk.gray('[Dry run] Generated changelog:'));
        console.log(chalk.gray(changelog));
      } else {
        // Update CHANGELOG.md
        const changelogPath = 'CHANGELOG.md';
        let existingChangelog = '';
        try {
          existingChangelog = await readFile(changelogPath, 'utf-8');
        } catch {
          // File doesn't exist, create new
        }

        const newChangelog = changelog + '\n\n' + existingChangelog;
        await writeFile(changelogPath, newChangelog);
      }
    } catch (error) {
      progressBar.fail('Failed to generate changelog');
      throw error;
    }

    // Commit changes
    progressBar.nextStep();
    try {
      if (options.dryRun) {
        console.log(chalk.gray('[DRY RUN] Would commit with message: chore(release): ' + cleanNewVersion));
      } else {
        await execa('git', ['add', '.']);
        await execa('git', ['commit', '-m', `chore(release): ${cleanNewVersion}`]);
      }
    } catch (error) {
      progressBar.fail('Failed to create commit');
      throw error;
    }

    // Create tag
    progressBar.nextStep();
    try {
      if (options.dryRun) {
        console.log(chalk.gray(`[DRY RUN] Would create tag: v${cleanNewVersion}`));
      } else {
        await execa('git', ['tag', `v${cleanNewVersion}`]);
      }
    } catch (error) {
      progressBar.fail('Failed to create tag');
      throw error;
    }

    // Push changes and tags
    progressBar.nextStep();
    try {
      if (options.dryRun) {
        console.log(chalk.gray('[DRY RUN] Would push to origin main with tags'));
      } else {
        await pushWithTags();
      }
    } catch (error) {
      progressBar.fail('Failed to push changes');
      throw error;
    }

    // Mark progress as complete
    progressBar.succeed(`Release v${cleanNewVersion} completed successfully!`);

    // Success message
    console.log(chalk.green.bold(`
✅ Release v${cleanNewVersion} completed successfully!`));
    console.log(chalk.gray('\nGitHub Actions will now:'));
    console.log(chalk.gray('  - Run tests'));
    console.log(chalk.gray('  - Create GitHub release'));
    console.log(chalk.gray('  - Publish to npm'));
    console.log(chalk.gray('\nTrack progress at: https://github.com/coolwithyou/gomcp/actions'));

  } catch (error) {
    console.error(chalk.red('\n❌ Release failed:'), error);
    console.log(chalk.yellow('\nPlease fix the issues and try again.'));
    process.exit(1);
  }
}

#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { mainMenu } from './ui.js';
import {
  installPreset,
  verifyInstallations,
  listInstalledServers,
} from './installer.js';
import { servers, presets } from './servers.js';
import { InstallScope } from './types.js';
import { displayActivationStatus } from './activation.js';
import { runRelease, ReleaseType } from './commands/release.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { i18n, t } from './i18n/index.js';
import { getLanguagePreference } from './config.js';
import { checkForUpdates, getUpdateCommand } from './utils/version-check.js';
import { displayUpdateNotification } from './utils/update-notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
interface PackageJson {
  version: string;
}

const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')) as PackageJson;
const version = packageJson.version;

async function main(): Promise<void> {
  // Initialize i18n
  const savedLanguage = await getLanguagePreference();
  await i18n.initialize(savedLanguage);

  // Display ASCII art title
  console.log(chalk.cyan.bold(`
   ██████╗  ██████╗ ██╗    ███╗   ███╗ ██████╗██████╗ 
  ██╔════╝ ██╔═══██╗██║    ████╗ ████║██╔════╝██╔══██╗
  ██║  ███╗██║   ██║██║    ██╔████╔██║██║     ██████╔╝
  ██║   ██║██║   ██║╚═╝    ██║╚██╔╝██║██║     ██╔═══╝ 
  ╚██████╔╝╚██████╔╝██╗    ██║ ╚═╝ ██║╚██████╗██║     
   ╚═════╝  ╚═════╝ ╚═╝    ╚═╝     ╚═╝ ╚═════╝╚═╝     
  `));
  console.log(chalk.cyan.bold(`  🚀 Interactive MCP Setup for Claude Code v${version}`));

  // Check for updates asynchronously
  checkForUpdates(version).then((updateInfo) => {
    if (updateInfo?.isUpdateAvailable) {
      const updateCommand = getUpdateCommand();
      displayUpdateNotification(updateInfo.latestVersion, updateCommand);
    }
  }).catch(() => {
    // Silently ignore errors
  });

  program
    .name('gomcp')
    .description('Install MCP servers for Claude Code interactively')
    .version(version);

  program
    .option('-p, --preset <preset>', 'Install a preset collection of servers')
    .option('-l, --list', 'List all available MCP servers')
    .option('-i, --installed [scope]', 'List installed MCP servers (optional: user/project/all)')
    .option('-r, --remove', 'Remove MCP servers interactively')
    .option('-v, --verify', 'Verify installed MCP servers')
    .option('-a, --activation', 'Show MCP server activation status')
    .option('-s, --scope <scope>', 'Installation scope: user (global) or project', 'user')
    .option('-f, --force', 'Force installation even if scope is not recommended')
    .option('-d, --show-descriptions', 'Show server descriptions in lists')
    .action(async (options: {
      list?: boolean;
      installed?: boolean | string;
      remove?: boolean;
      verify?: boolean;
      activation?: boolean;
      preset?: string;
      scope: string;
      force?: boolean;
      showDescriptions?: boolean;
    }) => {
      try {
        if (options.list) {
          listServers(options.showDescriptions);
          return;
        }

        if (options.installed !== undefined) {
          // Handle --installed flag
          let scope: InstallScope | 'all' = 'all';
          if (typeof options.installed === 'string') {
            scope = options.installed as InstallScope | 'all';
          }

          if (scope === 'all' || scope === 'user' || scope === 'project') {
            await listInstalledServers(scope);
          } else {
            console.error(chalk.red(`Invalid scope: ${scope as string}`));
            console.log('Valid scopes: user, project, all');
            process.exit(1);
          }
          return;
        }

        if (options.remove) {
          // Interactive removal
          await mainMenu(options.scope as InstallScope, 'remove', options.showDescriptions);
          return;
        }

        if (options.verify) {
          await verifyInstallations();
          return;
        }

        if (options.activation) {
          await displayActivationStatus();
          return;
        }

        if (options.preset) {
          if (!presets[options.preset]) {
            console.error(chalk.red(`Unknown preset: ${options.preset}`));
            console.log('Available presets:', Object.keys(presets).join(', '));
            process.exit(1);
          }

          // Validate scope
          const scope = options.scope as InstallScope;
          if (!['user', 'project'].includes(scope)) {
            console.error(chalk.red(`Invalid scope: ${scope}`));
            console.log('Valid scopes: user (global), project');
            process.exit(1);
          }

          await installPreset(options.preset, scope, options.force);
          return;
        }

        // Default: show interactive menu
        console.log(
          chalk.gray(
            `${t('messages.navigationTip')}\n`
          )
        );
        await mainMenu(options.scope as InstallScope, undefined, options.showDescriptions);
      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    });

  // Add release command
  program
    .command('release <type>')
    .description('Automate npm release process (patch, minor, major)')
    .option('--skip-tests', 'Skip running tests')
    .option('--skip-lint', 'Skip running lint')
    .option('--skip-build', 'Skip running build')
    .option('--dry-run', 'Perform a dry run without making changes')
    .action(async (type: string, options: {
      skipTests?: boolean;
      skipLint?: boolean;
      skipBuild?: boolean;
      dryRun?: boolean;
    }) => {
      if (!['patch', 'minor', 'major'].includes(type)) {
        console.error(chalk.red(`Invalid release type: ${type}`));
        console.log('Valid types: patch, minor, major');
        process.exit(1);
      }

      await runRelease(type as ReleaseType, options);
    });

  program.parse();
}

function listServers(showDescriptions?: boolean) {
  console.log(chalk.bold('Available MCP Servers:\n'));

  const categories = [...new Set(servers.map((s) => s.category))];

  for (const category of categories) {
    console.log(chalk.yellow(`\n${category.toUpperCase()}`));
    console.log(chalk.gray('─'.repeat(40)));

    const categoryServers = servers.filter((s) => s.category === category);
    for (const server of categoryServers) {
      const icon = server.recommended ? '⭐' : '  ';
      const config = server.requiresConfig ? chalk.gray(' (requires config)') : '';
      if (showDescriptions) {
        console.log(`${icon} ${chalk.green(server.name)} - ${server.description}${config}`);
      } else {
        console.log(`${icon} ${chalk.green(server.name)}${config}`);
      }
    }
  }

  console.log(chalk.gray('\n─'.repeat(40)));
  console.log('\nPresets available:');
  for (const [name, serverIds] of Object.entries(presets)) {
    console.log(`  ${chalk.cyan(name)}: ${serverIds.join(', ')}`);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled error:'), error);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});

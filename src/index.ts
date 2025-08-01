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
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
interface PackageJson {
  version: string;
}

const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')) as PackageJson;
const version = packageJson.version;

async function main(): Promise<void> {
  // Display ASCII art title
  console.log(chalk.cyan.bold(`
   ██████╗  ██████╗ ██╗    ███╗   ███╗ ██████╗██████╗ 
  ██╔════╝ ██╔═══██╗██║    ████╗ ████║██╔════╝██╔══██╗
  ██║  ███╗██║   ██║██║    ██╔████╔██║██║     ██████╔╝
  ██║   ██║██║   ██║╚═╝    ██║╚██╔╝██║██║     ██╔═══╝ 
  ╚██████╔╝╚██████╔╝██╗    ██║ ╚═╝ ██║╚██████╗██║     
   ╚═════╝  ╚═════╝ ╚═╝    ╚═╝     ╚═╝ ╚═════╝╚═╝     
  `));
  console.log(chalk.cyan.bold('  🚀 Interactive MCP Setup for Claude Code\n'));

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
    .action(async (options: {
      list?: boolean;
      installed?: boolean | string;
      remove?: boolean;
      verify?: boolean;
      activation?: boolean;
      preset?: string;
      scope: string;
      force?: boolean;
    }) => {
      try {
        if (options.list) {
          listServers();
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
          await mainMenu(options.scope as InstallScope, 'remove');
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
            'Tip: Select "← Back" or press Enter without selecting to go back to previous menu\n'
          )
        );
        await mainMenu(options.scope as InstallScope);
      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    });

  program.parse();
}

function listServers() {
  console.log(chalk.bold('Available MCP Servers:\n'));

  const categories = [...new Set(servers.map((s) => s.category))];

  for (const category of categories) {
    console.log(chalk.yellow(`\n${category.toUpperCase()}`));
    console.log(chalk.gray('─'.repeat(40)));

    const categoryServers = servers.filter((s) => s.category === category);
    for (const server of categoryServers) {
      const icon = server.recommended ? '⭐' : '  ';
      const config = server.requiresConfig ? chalk.gray(' (requires config)') : '';
      console.log(`${icon} ${chalk.green(server.name)} - ${server.description}${config}`);
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

#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import { mainMenu } from './ui.js';
import { installPreset, verifyInstallations, listInstalledServers, } from './installer.js';
import { servers, presets } from './servers.js';
import { displayActivationStatus } from './activation.js';
import { runRelease } from './commands/release.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { i18n, t } from './i18n/index.js';
import { getLanguagePreference } from './config.js';
import { checkForUpdates, getUpdateCommand } from './utils/version-check.js';
import { displayUpdateNotification } from './utils/update-notification.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
const version = packageJson.version;
async function main() {
    const savedLanguage = await getLanguagePreference();
    await i18n.initialize(savedLanguage);
    console.log(chalk.cyan.bold(`
   ██████╗  ██████╗ ██╗    ███╗   ███╗ ██████╗██████╗ 
  ██╔════╝ ██╔═══██╗██║    ████╗ ████║██╔════╝██╔══██╗
  ██║  ███╗██║   ██║██║    ██╔████╔██║██║     ██████╔╝
  ██║   ██║██║   ██║╚═╝    ██║╚██╔╝██║██║     ██╔═══╝ 
  ╚██████╔╝╚██████╔╝██╗    ██║ ╚═╝ ██║╚██████╗██║     
   ╚═════╝  ╚═════╝ ╚═╝    ╚═╝     ╚═╝ ╚═════╝╚═╝     
  `));
    console.log(chalk.cyan.bold(`  🚀 Interactive MCP Setup for Claude Code v${version}`));
    checkForUpdates(version).then((updateInfo) => {
        if (updateInfo?.isUpdateAvailable) {
            const updateCommand = getUpdateCommand();
            displayUpdateNotification(updateInfo.latestVersion, updateCommand);
        }
    }).catch(() => {
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
        .action(async (options) => {
        try {
            if (options.list) {
                listServers(options.showDescriptions);
                return;
            }
            if (options.installed !== undefined) {
                let scope = 'all';
                if (typeof options.installed === 'string') {
                    scope = options.installed;
                }
                if (scope === 'all' || scope === 'user' || scope === 'project') {
                    await listInstalledServers(scope);
                }
                else {
                    console.error(chalk.red(`Invalid scope: ${scope}`));
                    console.log('Valid scopes: user, project, all');
                    process.exit(1);
                }
                return;
            }
            if (options.remove) {
                await mainMenu(options.scope, 'remove', options.showDescriptions);
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
                const scope = options.scope;
                if (!['user', 'project'].includes(scope)) {
                    console.error(chalk.red(`Invalid scope: ${scope}`));
                    console.log('Valid scopes: user (global), project');
                    process.exit(1);
                }
                await installPreset(options.preset, scope, options.force);
                return;
            }
            console.log(chalk.gray(`${t('messages.navigationTip')}\n`));
            await mainMenu(options.scope, undefined, options.showDescriptions);
        }
        catch (error) {
            console.error(chalk.red('Error:'), error);
            process.exit(1);
        }
    });
    program
        .command('release <type>')
        .description('Automate npm release process (patch, minor, major)')
        .option('--skip-tests', 'Skip running tests')
        .option('--skip-lint', 'Skip running lint')
        .option('--skip-build', 'Skip running build')
        .option('--dry-run', 'Perform a dry run without making changes')
        .action(async (type, options) => {
        if (!['patch', 'minor', 'major'].includes(type)) {
            console.error(chalk.red(`Invalid release type: ${type}`));
            console.log('Valid types: patch, minor, major');
            process.exit(1);
        }
        await runRelease(type, options);
    });
    program.parse();
}
function listServers(showDescriptions) {
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
            }
            else {
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
process.on('unhandledRejection', (error) => {
    console.error(chalk.red('Unhandled error:'), error);
    process.exit(1);
});
main().catch((error) => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map
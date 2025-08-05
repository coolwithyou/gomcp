import chalk from 'chalk';
import { t } from '../i18n/index.js';
export function displayUpdateNotification(latestVersion, updateCommand) {
    const lines = [];
    lines.push('╔══════════════════════════════════════════════════════════════╗');
    const updateMsg = t('version.updateAvailable', { version: latestVersion });
    lines.push(`║  🆕 ${updateMsg.padEnd(57)} ║`);
    lines.push('║'.padEnd(65) + '║');
    const instructionsMsg = t('version.updateInstructions');
    lines.push(`║  ${instructionsMsg.padEnd(60)} ║`);
    lines.push(`║  ${chalk.cyan(updateCommand).padEnd(69)} ║`);
    lines.push('║'.padEnd(65) + '║');
    if (updateCommand === 'npx gomcp') {
        const npxMsg = t('version.npxNote');
        if (npxMsg.length > 58) {
            const words = npxMsg.split(' ');
            let currentLine = '';
            for (const word of words) {
                if ((currentLine + ' ' + word).length > 58) {
                    lines.push(`║  ${currentLine.padEnd(60)} ║`);
                    currentLine = word;
                }
                else {
                    currentLine = currentLine ? currentLine + ' ' + word : word;
                }
            }
            if (currentLine) {
                lines.push(`║  ${currentLine.padEnd(60)} ║`);
            }
        }
        else {
            lines.push(`║  ${npxMsg.padEnd(60)} ║`);
        }
    }
    lines.push('╚══════════════════════════════════════════════════════════════╝');
    lines.forEach(line => console.log(chalk.yellowBright(line)));
    console.log();
}
//# sourceMappingURL=update-notification.js.map
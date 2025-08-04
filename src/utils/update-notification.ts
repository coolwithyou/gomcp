import chalk from 'chalk';
import { t } from '../i18n/index.js';

/**
 * Displays a formatted update notification box in the console with localized messages and update instructions.
 *
 * @param latestVersion - The latest available version to display in the notification
 * @param updateCommand - The command users should run to update, which may trigger additional notes if set to 'npx gomcp'
 */
export function displayUpdateNotification(latestVersion: string, updateCommand: string): void {
  const lines: string[] = [];

  // Top border
  lines.push('╔══════════════════════════════════════════════════════════════╗');

  // Update available message
  const updateMsg = t('version.updateAvailable', { version: latestVersion });
  lines.push(`║  🆕 ${updateMsg.padEnd(57)} ║`);
  lines.push('║'.padEnd(65) + '║');

  // Update instructions
  const instructionsMsg = t('version.updateInstructions');
  lines.push(`║  ${instructionsMsg.padEnd(60)} ║`);
  lines.push(`║  ${chalk.cyan(updateCommand).padEnd(69)} ║`);
  lines.push('║'.padEnd(65) + '║');

  // NPX note if applicable
  if (updateCommand === 'npx gomcp') {
    const npxMsg = t('version.npxNote');
    // Split long message into multiple lines if needed
    if (npxMsg.length > 58) {
      const words = npxMsg.split(' ');
      let currentLine = '';
      for (const word of words) {
        if ((currentLine + ' ' + word).length > 58) {
          lines.push(`║  ${currentLine.padEnd(60)} ║`);
          currentLine = word;
        } else {
          currentLine = currentLine ? currentLine + ' ' + word : word;
        }
      }
      if (currentLine) {
        lines.push(`║  ${currentLine.padEnd(60)} ║`);
      }
    } else {
      lines.push(`║  ${npxMsg.padEnd(60)} ║`);
    }
  }

  // Bottom border
  lines.push('╚══════════════════════════════════════════════════════════════╝');

  // Display the box
  lines.forEach(line => console.log(chalk.yellowBright(line)));
  console.log(); // Extra line for spacing
}

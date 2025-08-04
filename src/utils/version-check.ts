import https from 'https';
import { loadConfig, saveConfig } from '../config.js';

export interface VersionCheckResult {
  currentVersion: string;
  latestVersion: string;
  isUpdateAvailable: boolean;
  lastChecked: Date;
}

interface NpmRegistryResponse {
  'dist-tags': {
    latest: string;
  };
}

/**
 * Check if we should perform an update check (once every 24 hours)
 */
export async function shouldCheckForUpdates(): Promise<boolean> {
  const config = await loadConfig();

  if (!config?.lastUpdateCheck) {
    return true;
  }

  const lastCheck = new Date(config.lastUpdateCheck);
  const now = new Date();
  const hoursSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastCheck >= 24;
}

/**
 * Save the last update check time
 */
export async function saveLastCheckTime(): Promise<void> {
  const config = await loadConfig() || {
    version: '1.0.0',
    installedServers: [],
    presets: {},
    lastUpdated: new Date().toISOString(),
  };

  config.lastUpdateCheck = new Date().toISOString();
  await saveConfig(config);
}

/**
 * Fetch the latest version from npm registry
 */
function fetchLatestVersion(packageName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'registry.npmjs.org',
      path: `/${packageName}`,
      method: 'GET',
      timeout: 3000,
      headers: {
        'Accept': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data) as NpmRegistryResponse;
          resolve(parsed['dist-tags'].latest);
        } catch (error) {
          reject(new Error('Failed to parse npm registry response'));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Compare two semantic versions
 */
function isNewerVersion(current: string, latest: string): boolean {
  const parseVersion = (v: string): number[] => {
    return v.replace(/^v/, '').split('.').map(n => parseInt(n, 10));
  };

  const currentParts = parseVersion(current);
  const latestParts = parseVersion(latest);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;

    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }

  return false;
}

/**
 * Check for updates to gomcp
 */
export async function checkForUpdates(currentVersion: string): Promise<VersionCheckResult | null> {
  try {
    // Check if we should perform the check
    if (!await shouldCheckForUpdates()) {
      return null;
    }

    // Fetch latest version from npm
    const latestVersion = await fetchLatestVersion('gomcp');

    // Save check time
    await saveLastCheckTime();

    // Compare versions
    const isUpdateAvailable = isNewerVersion(currentVersion, latestVersion);

    return {
      currentVersion,
      latestVersion,
      isUpdateAvailable,
      lastChecked: new Date(),
    };
  } catch (error) {
    // Silently fail - don't interrupt the user experience
    return null;
  }
}

/**
 * Get the appropriate update command based on how gomcp was installed
 */
export function getUpdateCommand(): string {
  // Check if running through npx
  if (process.env.npm_execpath?.includes('npx')) {
    return 'npx';
  }

  // Default to global update
  return 'npm update -g gomcp';
}

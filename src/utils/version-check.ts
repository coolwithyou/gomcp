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
 * Determines whether an update check should be performed based on the last recorded check time.
 *
 * Returns `true` if no previous check has been recorded or if at least 24 hours have passed since the last check; otherwise, returns `false`.
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
 * Updates and persists the timestamp of the last update check in the configuration.
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
 * Retrieves the latest published version of a package from the npm registry.
 *
 * @param packageName - The name of the npm package to check
 * @returns A promise that resolves with the latest version string from the npm registry
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
 * Determines if the `latest` semantic version is newer than the `current` version.
 *
 * @param current - The current version string (e.g., "1.2.3")
 * @param latest - The version string to compare against (e.g., "1.3.0")
 * @returns `true` if `latest` is strictly newer than `current`; otherwise, `false`
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
 * Checks if a newer version of "gomcp" is available on the npm registry.
 *
 * If an update check is due, fetches the latest version, compares it to the provided current version, and returns a `VersionCheckResult` with details. Returns `null` if no check is needed or if an error occurs.
 *
 * @param currentVersion - The currently installed version of "gomcp"
 * @returns A `VersionCheckResult` object if an update check is performed, or `null` if not needed or on error
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
 * Returns the recommended command to update "gomcp" based on the current execution environment.
 *
 * If the package is being run via `npx`, returns `"npx"`. Otherwise, returns the global npm update command.
 *
 * @returns The update command string appropriate for the installation method
 */
export function getUpdateCommand(): string {
  // Check if running through npx
  if (process.env.npm_execpath?.includes('npx')) {
    return 'npx';
  }

  // Default to global update
  return 'npm update -g gomcp';
}

import https from 'https';
import { loadConfig, saveConfig } from '../config.js';
export async function shouldCheckForUpdates() {
    const config = await loadConfig();
    if (!config?.lastUpdateCheck) {
        return true;
    }
    const lastCheck = new Date(config.lastUpdateCheck);
    const now = new Date();
    const hoursSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastCheck >= 24;
}
export async function saveLastCheckTime() {
    const config = await loadConfig() || {
        version: '1.0.0',
        installedServers: [],
        presets: {},
        lastUpdated: new Date().toISOString(),
    };
    config.lastUpdateCheck = new Date().toISOString();
    await saveConfig(config);
}
function fetchLatestVersion(packageName) {
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
                    const parsed = JSON.parse(data);
                    resolve(parsed['dist-tags'].latest);
                }
                catch (error) {
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
function isNewerVersion(current, latest) {
    const parseVersion = (v) => {
        return v.replace(/^v/, '').split('.').map(n => parseInt(n, 10));
    };
    const currentParts = parseVersion(current);
    const latestParts = parseVersion(latest);
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const currentPart = currentParts[i] || 0;
        const latestPart = latestParts[i] || 0;
        if (latestPart > currentPart)
            return true;
        if (latestPart < currentPart)
            return false;
    }
    return false;
}
export async function checkForUpdates(currentVersion) {
    try {
        if (!await shouldCheckForUpdates()) {
            return null;
        }
        const latestVersion = await fetchLatestVersion('gomcp');
        await saveLastCheckTime();
        const isUpdateAvailable = isNewerVersion(currentVersion, latestVersion);
        return {
            currentVersion,
            latestVersion,
            isUpdateAvailable,
            lastChecked: new Date(),
        };
    }
    catch (error) {
        return null;
    }
}
export function getUpdateCommand() {
    if (process.env.npm_execpath?.includes('npx')) {
        return 'npx';
    }
    return 'npm update -g gomcp';
}
//# sourceMappingURL=version-check.js.map
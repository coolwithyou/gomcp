export interface VersionCheckResult {
    currentVersion: string;
    latestVersion: string;
    isUpdateAvailable: boolean;
    lastChecked: Date;
}
export declare function shouldCheckForUpdates(): Promise<boolean>;
export declare function saveLastCheckTime(): Promise<void>;
export declare function checkForUpdates(currentVersion: string): Promise<VersionCheckResult | null>;
export declare function getUpdateCommand(): string;
//# sourceMappingURL=version-check.d.ts.map
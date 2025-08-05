export type ReleaseType = 'patch' | 'minor' | 'major';
interface ReleaseOptions {
    skipTests?: boolean;
    skipLint?: boolean;
    skipBuild?: boolean;
    dryRun?: boolean;
}
export declare function runRelease(releaseType: ReleaseType, options?: ReleaseOptions): Promise<void>;
export {};
//# sourceMappingURL=release.d.ts.map
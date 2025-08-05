export declare function getCurrentBranch(): Promise<string>;
export declare function hasUncommittedChanges(): Promise<boolean>;
export declare function getLatestTag(): Promise<string | undefined>;
export declare function pushWithTags(): Promise<void>;
export declare function isRepositoryClean(): Promise<boolean>;
export declare function fetchRemote(): Promise<void>;
export declare function isUpToDate(): Promise<boolean>;
//# sourceMappingURL=git.d.ts.map
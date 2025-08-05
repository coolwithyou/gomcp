import cliProgress from 'cli-progress';
export interface ProgressOptions {
    total: number;
    label: string;
    showPercentage?: boolean;
    showETA?: boolean;
    format?: string;
}
export interface ProgressPayload {
    label?: string;
    eta_formatted?: string;
    [key: string]: unknown;
}
export declare class ProgressBar {
    private bar;
    private startTime;
    private label;
    private showETA;
    private currentValue;
    constructor(options: ProgressOptions);
    private buildFormat;
    update(current: number, payload?: ProgressPayload): void;
    increment(delta?: number, payload?: ProgressPayload): void;
    succeed(message?: string): void;
    fail(message?: string): void;
    stop(): void;
    private formatTime;
}
export interface StepProgressOptions {
    steps: Array<{
        name: string;
        weight?: number;
    }>;
    showStepNumber?: boolean;
}
export interface IndeterminateProgressOptions {
    label: string;
    spinnerFrames?: string[];
}
export interface TimeBasedProgressOptions {
    label: string;
    estimatedDuration: number;
    updateInterval?: number;
}
export declare class StepProgressBar {
    private bar;
    private steps;
    private currentStep;
    private totalWeight;
    private completedWeight;
    private showStepNumber;
    constructor(options: StepProgressOptions);
    nextStep(): void;
    completeCurrentStep(): void;
    succeed(message?: string): void;
    fail(message?: string): void;
}
export declare class IndeterminateProgressBar {
    private interval;
    private currentFrame;
    private frames;
    private label;
    private isRunning;
    constructor(options: IndeterminateProgressOptions);
    private start;
    private render;
    updateLabel(label: string): void;
    succeed(message?: string): void;
    fail(message?: string): void;
    stop(): void;
}
export declare class TimeBasedProgressBar {
    private bar;
    private startTime;
    private estimatedDuration;
    private updateInterval;
    private timer;
    private label;
    constructor(options: TimeBasedProgressOptions);
    private startTimer;
    private formatElapsed;
    succeed(message?: string): void;
    fail(message?: string): void;
}
export declare class MultiProgressBar {
    private multiBar;
    private bars;
    private barValues;
    constructor();
    add(id: string, total: number, label: string): cliProgress.SingleBar;
    update(id: string, current: number, status?: string): void;
    succeed(id: string, message?: string): void;
    fail(id: string, message?: string): void;
    stop(): void;
}
export declare function createProgressBar(options: ProgressOptions): ProgressBar;
export declare function createStepProgressBar(options: StepProgressOptions): StepProgressBar;
export declare function createIndeterminateProgressBar(options: IndeterminateProgressOptions): IndeterminateProgressBar;
export declare function createTimeBasedProgressBar(options: TimeBasedProgressOptions): TimeBasedProgressBar;
export declare function createMultiProgressBar(): MultiProgressBar;
//# sourceMappingURL=progress.d.ts.map
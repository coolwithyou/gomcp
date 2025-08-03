import chalk from 'chalk';
import cliProgress from 'cli-progress';
import { performance } from 'perf_hooks';

export interface ProgressOptions {
  total: number;
  label: string;
  showPercentage?: boolean;
  showETA?: boolean;
  format?: string;
}

export class ProgressBar {
  private bar: cliProgress.SingleBar;
  private startTime: number;
  private label: string;
  private showETA: boolean;
  private currentValue: number = 0;

  constructor(options: ProgressOptions) {
    const {
      total,
      label,
      showPercentage = true,
      showETA = true,
      format
    } = options;

    this.label = label;
    this.showETA = showETA;
    this.startTime = performance.now();

    const defaultFormat = this.buildFormat(showPercentage, showETA);

    this.bar = new cliProgress.SingleBar({
      format: format || defaultFormat,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      clearOnComplete: true,
      stopOnComplete: true,
      forceRedraw: true
    }, cliProgress.Presets.shades_classic);

    this.bar.start(total, 0);
  }

  private buildFormat(showPercentage: boolean, showETA: boolean): string {
    let format = `${chalk.cyan('{label}')} |{bar}|`;

    if (showPercentage) {
      format += ' {percentage}%';
    }

    format += ' | {value}/{total}';

    if (showETA) {
      format += ' | ETA: {eta_formatted}';
    }

    return format;
  }

  update(current: number, payload?: Record<string, any>): void {
    const updatePayload: Record<string, any> = {
      label: payload?.label || this.label,
      ...payload
    };

    if (this.showETA) {
      const elapsed = (performance.now() - this.startTime) / 1000;
      const rate = current / elapsed;
      const total = this.bar.getTotal();
      const remaining = total - current;
      const eta = rate > 0 ? remaining / rate : 0;

      updatePayload.eta_formatted = this.formatTime(eta);
    }

    this.currentValue = current;
    this.bar.update(current, updatePayload);
  }

  increment(delta: number = 1, payload?: Record<string, any>): void {
    const current = this.currentValue + delta;
    this.update(current, payload);
  }

  succeed(message?: string): void {
    this.bar.update(this.bar.getTotal());
    this.bar.stop();
    if (message) {
      console.log(chalk.green('✓'), message);
    }
  }

  fail(message?: string): void {
    this.bar.stop();
    if (message) {
      console.log(chalk.red('✗'), message);
    }
  }

  stop(): void {
    this.bar.stop();
  }

  private formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return `${minutes}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }
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
  estimatedDuration: number; // in milliseconds
  updateInterval?: number; // in milliseconds
}

export class StepProgressBar {
  private bar: cliProgress.SingleBar;
  private steps: Array<{ name: string; weight: number }>;
  private currentStep: number = -1;
  private totalWeight: number;
  private completedWeight: number = 0;
  private showStepNumber: boolean;

  constructor(options: StepProgressOptions) {
    this.showStepNumber = options.showStepNumber ?? true;

    // Normalize weights
    this.steps = options.steps.map(step => ({
      name: step.name,
      weight: step.weight || 1
    }));

    this.totalWeight = this.steps.reduce((sum, step) => sum + step.weight, 0);

    const format = this.showStepNumber
      ? `${chalk.cyan('{step}')} [{currentStep}/{totalSteps}] |{bar}| {percentage}%`
      : `${chalk.cyan('{step}')} |{bar}| {percentage}%`;

    this.bar = new cliProgress.SingleBar({
      format,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      clearOnComplete: true,
      stopOnComplete: true
    }, cliProgress.Presets.shades_classic);

    this.bar.start(100, 0, {
      step: 'Initializing...',
      currentStep: 0,
      totalSteps: this.steps.length
    });
  }

  nextStep(): void {
    if (this.currentStep >= 0 && this.currentStep < this.steps.length) {
      this.completedWeight += this.steps[this.currentStep].weight;
    }

    this.currentStep++;

    if (this.currentStep < this.steps.length) {
      const progress = Math.round((this.completedWeight / this.totalWeight) * 100);
      this.bar.update(progress, {
        step: this.steps[this.currentStep].name,
        currentStep: this.currentStep + 1,
        totalSteps: this.steps.length
      });
    }
  }

  completeCurrentStep(): void {
    if (this.currentStep >= 0 && this.currentStep < this.steps.length) {
      this.completedWeight += this.steps[this.currentStep].weight;
      const progress = Math.round((this.completedWeight / this.totalWeight) * 100);
      this.bar.update(progress);
    }
  }

  succeed(message?: string): void {
    this.bar.update(100);
    this.bar.stop();
    if (message) {
      console.log(chalk.green('✓'), message);
    }
  }

  fail(message?: string): void {
    this.bar.stop();
    if (message) {
      console.log(chalk.red('✗'), message);
    }
  }
}

export class IndeterminateProgressBar {
  private interval: NodeJS.Timeout | null = null;
  private currentFrame: number = 0;
  private frames: string[];
  private label: string;
  private isRunning: boolean = false;

  constructor(options: IndeterminateProgressOptions) {
    this.label = options.label;
    this.frames = options.spinnerFrames || ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.start();
  }

  private start(): void {
    this.isRunning = true;
    this.render();
    this.interval = setInterval(() => {
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
      this.render();
    }, 80);
  }

  private render(): void {
    if (this.isRunning) {
      // Clear the entire line first to prevent text artifacts
      process.stdout.write('\r\x1b[K');
      process.stdout.write(`${chalk.cyan(this.frames[this.currentFrame])} ${this.label}`);
    }
  }

  updateLabel(label: string): void {
    this.label = label;
    this.render();
  }

  succeed(message?: string): void {
    this.stop();
    console.log(`\r${chalk.green('✓')} ${message || this.label}`);
  }

  fail(message?: string): void {
    this.stop();
    console.log(`\r${chalk.red('✗')} ${message || this.label}`);
  }

  stop(): void {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write('\r\x1b[K'); // Clear the line
  }
}

export class TimeBasedProgressBar {
  private bar: cliProgress.SingleBar;
  private startTime: number;
  private estimatedDuration: number;
  private updateInterval: number;
  private timer: NodeJS.Timeout | null = null;
  private label: string;

  constructor(options: TimeBasedProgressOptions) {
    this.label = options.label;
    this.estimatedDuration = options.estimatedDuration;
    this.updateInterval = options.updateInterval || 100;
    this.startTime = performance.now();

    this.bar = new cliProgress.SingleBar({
      format: `${chalk.cyan('{label}')} |{bar}| {percentage}% | {elapsed}`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      clearOnComplete: true,
      stopOnComplete: true
    }, cliProgress.Presets.shades_classic);

    this.bar.start(100, 0, {
      label: this.label,
      elapsed: '0s'
    });

    this.startTimer();
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      const elapsed = performance.now() - this.startTime;
      const progress = Math.min(100, Math.round((elapsed / this.estimatedDuration) * 100));

      this.bar.update(progress, {
        label: this.label,
        elapsed: this.formatElapsed(elapsed)
      });

      if (progress >= 100 && this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }, this.updateInterval);
  }

  private formatElapsed(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }

  succeed(message?: string): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.bar.update(100);
    this.bar.stop();
    if (message) {
      console.log(chalk.green('✓'), message);
    }
  }

  fail(message?: string): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.bar.stop();
    if (message) {
      console.log(chalk.red('✗'), message);
    }
  }
}

export class MultiProgressBar {
  private multiBar: cliProgress.MultiBar;
  private bars: Map<string, cliProgress.SingleBar> = new Map();

  constructor() {
    this.multiBar = new cliProgress.MultiBar({
      clearOnComplete: false,
      hideCursor: true,
      forceRedraw: true,
      format: '{label} |{bar}| {percentage}% | {value}/{total} | {status}'
    }, cliProgress.Presets.shades_classic);
  }

  add(id: string, total: number, label: string): cliProgress.SingleBar {
    const bar = this.multiBar.create(total, 0, {
      label: chalk.cyan(label),
      status: 'Starting...'
    });
    this.bars.set(id, bar);
    return bar;
  }

  update(id: string, current: number, status?: string): void {
    const bar = this.bars.get(id);
    if (bar) {
      bar.update(current, { status: status || 'Processing...' });
    }
  }

  succeed(id: string, message?: string): void {
    const bar = this.bars.get(id);
    if (bar) {
      bar.update(bar.getTotal(), { status: chalk.green(message || 'Complete') });
    }
  }

  fail(id: string, message?: string): void {
    const bar = this.bars.get(id);
    if (bar) {
      const currentValue = (bar as any).value || 0;
      bar.update(currentValue, { status: chalk.red(message || 'Failed') });
    }
  }

  stop(): void {
    this.multiBar.stop();
  }
}

// Factory functions

export function createProgressBar(options: ProgressOptions): ProgressBar {
  return new ProgressBar(options);
}

export function createStepProgressBar(options: StepProgressOptions): StepProgressBar {
  return new StepProgressBar(options);
}

export function createIndeterminateProgressBar(options: IndeterminateProgressOptions): IndeterminateProgressBar {
  return new IndeterminateProgressBar(options);
}

export function createTimeBasedProgressBar(options: TimeBasedProgressOptions): TimeBasedProgressBar {
  return new TimeBasedProgressBar(options);
}

export function createMultiProgressBar(): MultiProgressBar {
  return new MultiProgressBar();
}

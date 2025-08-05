import chalk from 'chalk';
import cliProgress from 'cli-progress';
import { performance } from 'perf_hooks';
export class ProgressBar {
    bar;
    startTime;
    label;
    showETA;
    currentValue = 0;
    constructor(options) {
        const { total, label, showPercentage = true, showETA = true, format } = options;
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
    buildFormat(showPercentage, showETA) {
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
    update(current, payload) {
        const updatePayload = {
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
    increment(delta = 1, payload) {
        const current = this.currentValue + delta;
        this.update(current, payload);
    }
    succeed(message) {
        this.bar.update(this.bar.getTotal());
        this.bar.stop();
        if (message) {
            console.log(chalk.green('✓'), message);
        }
    }
    fail(message) {
        this.bar.stop();
        if (message) {
            console.log(chalk.red('✗'), message);
        }
    }
    stop() {
        this.bar.stop();
    }
    formatTime(seconds) {
        if (seconds < 60) {
            return `${Math.round(seconds)}s`;
        }
        else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.round(seconds % 60);
            return `${minutes}m ${secs}s`;
        }
        else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    }
}
export class StepProgressBar {
    bar;
    steps;
    currentStep = -1;
    totalWeight;
    completedWeight = 0;
    showStepNumber;
    constructor(options) {
        this.showStepNumber = options.showStepNumber ?? true;
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
    nextStep() {
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
    completeCurrentStep() {
        if (this.currentStep >= 0 && this.currentStep < this.steps.length) {
            this.completedWeight += this.steps[this.currentStep].weight;
            const progress = Math.round((this.completedWeight / this.totalWeight) * 100);
            this.bar.update(progress);
        }
    }
    succeed(message) {
        this.bar.update(100);
        this.bar.stop();
        if (message) {
            console.log(chalk.green('✓'), message);
        }
    }
    fail(message) {
        this.bar.stop();
        if (message) {
            console.log(chalk.red('✗'), message);
        }
    }
}
export class IndeterminateProgressBar {
    interval = null;
    currentFrame = 0;
    frames;
    label;
    isRunning = false;
    constructor(options) {
        this.label = options.label;
        this.frames = options.spinnerFrames || ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.start();
    }
    start() {
        this.isRunning = true;
        this.render();
        this.interval = setInterval(() => {
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
            this.render();
        }, 80);
    }
    render() {
        if (this.isRunning) {
            process.stdout.write('\r\x1b[K');
            process.stdout.write(`${chalk.cyan(this.frames[this.currentFrame])} ${this.label}`);
        }
    }
    updateLabel(label) {
        this.label = label;
        this.render();
    }
    succeed(message) {
        this.stop();
        console.log(`\r${chalk.green('✓')} ${message || this.label}`);
    }
    fail(message) {
        this.stop();
        console.log(`\r${chalk.red('✗')} ${message || this.label}`);
    }
    stop() {
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        process.stdout.write('\r\x1b[K');
    }
}
export class TimeBasedProgressBar {
    bar;
    startTime;
    estimatedDuration;
    updateInterval;
    timer = null;
    label;
    constructor(options) {
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
    startTimer() {
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
    formatElapsed(ms) {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) {
            return `${seconds}s`;
        }
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    }
    succeed(message) {
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
    fail(message) {
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
    multiBar;
    bars = new Map();
    barValues = new Map();
    constructor() {
        this.multiBar = new cliProgress.MultiBar({
            clearOnComplete: false,
            hideCursor: true,
            forceRedraw: true,
            format: '{label} |{bar}| {percentage}% | {value}/{total} | {status}'
        }, cliProgress.Presets.shades_classic);
    }
    add(id, total, label) {
        const bar = this.multiBar.create(total, 0, {
            label: chalk.cyan(label),
            status: 'Starting...'
        });
        this.bars.set(id, bar);
        this.barValues.set(id, 0);
        return bar;
    }
    update(id, current, status) {
        const bar = this.bars.get(id);
        if (bar) {
            bar.update(current, { status: status || 'Processing...' });
            this.barValues.set(id, current);
        }
    }
    succeed(id, message) {
        const bar = this.bars.get(id);
        if (bar) {
            bar.update(bar.getTotal(), { status: chalk.green(message || 'Complete') });
        }
    }
    fail(id, message) {
        const bar = this.bars.get(id);
        if (bar) {
            const currentValue = this.barValues.get(id) || 0;
            bar.update(currentValue, { status: chalk.red(message || 'Failed') });
        }
    }
    stop() {
        this.multiBar.stop();
    }
}
export function createProgressBar(options) {
    return new ProgressBar(options);
}
export function createStepProgressBar(options) {
    return new StepProgressBar(options);
}
export function createIndeterminateProgressBar(options) {
    return new IndeterminateProgressBar(options);
}
export function createTimeBasedProgressBar(options) {
    return new TimeBasedProgressBar(options);
}
export function createMultiProgressBar() {
    return new MultiProgressBar();
}
//# sourceMappingURL=progress.js.map
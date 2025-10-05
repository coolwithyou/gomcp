import { execa } from 'execa';
import chalk from 'chalk';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Chrome 확장 자동 로딩 유틸리티
 */
export class ChromeAutomation {
	private static readonly EXTENSION_DIR = path.join(os.homedir(), '.gomcp', 'chrome-extensions');
	private static readonly EXTENSION_NAME = 'mcp-chrome';

	/**
	 * Chrome을 확장과 함께 자동으로 시작합니다
	 */
	static async launchChromeWithExtension(): Promise<void> {
		const extensionPath = path.join(this.EXTENSION_DIR, this.EXTENSION_NAME);

		// 확장 존재 확인
		try {
			await fs.access(extensionPath);
		} catch {
			throw new Error(`Extension not found at: ${extensionPath}`);
		}

		const platform = os.platform();
		let chromePath: string;

		// 플랫폼별 Chrome 경로
		switch (platform) {
			case 'darwin': // macOS
				chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
				break;
			case 'win32': // Windows
				chromePath = process.env.ProgramFiles
					? path.join(process.env.ProgramFiles, 'Google\\Chrome\\Application\\chrome.exe')
					: 'chrome';
				break;
			case 'linux': // Linux
				chromePath = 'google-chrome';
				break;
			default:
				chromePath = 'chrome';
		}

		const args = [
			`--load-extension=${extensionPath}`,
			'--new-window',
			'--disable-extensions-except=' + extensionPath,
			'--disable-default-apps',
			'--no-first-run',
			'--disable-popup-blocking'
		];

		console.log(chalk.cyan('\n🚀 Launching Chrome with MCP extension...'));
		console.log(chalk.gray(`Extension: ${extensionPath}`));
		console.log(chalk.gray(`Command: ${chromePath} ${args.join(' ')}`));

		try {
			// Chrome을 백그라운드에서 실행
			const chromeProcess = execa(chromePath, args, {
				detached: true,
				stdio: 'ignore'
			});

			chromeProcess.unref(); // 프로세스를 독립적으로 실행

			console.log(chalk.green('✓ Chrome launched with MCP extension!'));
			console.log(chalk.yellow('\n📌 Next Steps:'));
			console.log('1. Chrome이 자동으로 열렸습니다');
			console.log('2. 확장 아이콘을 클릭하여 "Connected" 상태 확인');
			console.log('3. 포트 12306에서 MCP 서버가 실행 중인지 확인');

			return;
		} catch (error) {
			throw new Error(`Failed to launch Chrome: ${error}`);
		}
	}

	/**
	 * Chrome 프로필에 확장을 영구적으로 추가합니다 (macOS AppleScript)
	 */
	static async installExtensionViaMacOSAutomation(): Promise<void> {
		if (os.platform() !== 'darwin') {
			throw new Error('This method is only available on macOS');
		}

		const extensionPath = path.join(this.EXTENSION_DIR, this.EXTENSION_NAME);

		const appleScript = `
      tell application "Google Chrome"
        activate
        delay 2
        open location "chrome://extensions/"
        delay 3
      end tell

      tell application "System Events"
        tell process "Google Chrome"
          -- Enable Developer Mode
          try
            click button "Developer mode" of group 1 of group 1 of tab group 1 of splitter group 1 of window 1
            delay 1
          end try
          
          -- Click Load unpacked
          try
            click button "Load unpacked" of group 1 of group 1 of tab group 1 of splitter group 1 of window 1
            delay 2
            
            -- Navigate to extension folder
            keystroke "g" using {command down, shift down}
            delay 1
            keystroke "${extensionPath}"
            delay 1
            keystroke return
            delay 1
            keystroke return
            
          end try
        end tell
      end tell
    `;

		console.log(chalk.cyan('\n🤖 Running macOS automation...'));
		console.log(chalk.yellow('⚠️  This requires accessibility permissions for Terminal/iTerm'));

		try {
			await execa('osascript', ['-e', appleScript]);
			console.log(chalk.green('✓ Automation completed!'));
			console.log(chalk.gray('Check Chrome extensions page for the installed extension'));
		} catch (error) {
			console.log(chalk.red('✗ Automation failed:'), error);
			console.log(chalk.yellow('💡 Fallback to manual installation'));
		}
	}

	/**
	 * Chrome 확장 상태를 확인합니다
	 */
	static async checkExtensionStatus(): Promise<{
		chromeRunning: boolean;
		extensionLoaded: boolean;
		mcpServerRunning: boolean;
	}> {
		const results = {
			chromeRunning: false,
			extensionLoaded: false,
			mcpServerRunning: false
		};

		// Chrome 프로세스 확인
		try {
			const { stdout } = await execa('pgrep', ['-f', 'Google Chrome']);
			results.chromeRunning = stdout.trim().length > 0;
		} catch {
			// pgrep 실패는 프로세스가 없음을 의미
		}

		// MCP 서버 확인
		try {
			const response = await fetch('http://127.0.0.1:12306/mcp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 1,
					method: 'ping'
				})
			});
			results.mcpServerRunning = response.ok;
			results.extensionLoaded = response.ok; // MCP 서버가 동작하면 확장도 로드됨
		} catch {
			// 연결 실패
		}

		return results;
	}

	/**
	 * 종합 자동 설치 프로세스
	 */
	static async autoInstallExtension(): Promise<void> {
		const platform = os.platform();

		console.log(chalk.cyan('\n🔄 Starting automatic extension installation...'));

		// 1. 현재 상태 확인
		const status = await this.checkExtensionStatus();

		if (status.mcpServerRunning) {
			console.log(chalk.green('✓ Chrome MCP extension is already running!'));
			return;
		}

		// 2. 플랫폼별 자동 설치 시도
		if (platform === 'darwin') {
			console.log(chalk.blue('🍎 Attempting macOS automation...'));
			try {
				await this.installExtensionViaMacOSAutomation();
				return;
			} catch (error) {
				console.log(chalk.yellow('⚠️  Automation failed, trying CLI method...'));
			}
		}

		// 3. CLI 플래그 방법 (모든 플랫폼)
		console.log(chalk.blue('🖥️  Using Chrome CLI method...'));
		await this.launchChromeWithExtension();
	}

	/**
	 * 원클릭 설치 명령어 생성
	 */
	static generateOneClickCommand(): string {
		const extensionPath = path.join(this.EXTENSION_DIR, this.EXTENSION_NAME);
		const platform = os.platform();

		let chromePath: string;
		let command: string;

		switch (platform) {
			case 'darwin':
				chromePath = '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome';
				command = `${chromePath} --load-extension="${extensionPath}" --new-window`;
				break;
			case 'win32':
				chromePath = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';
				command = `${chromePath} --load-extension="${extensionPath}" --new-window`;
				break;
			default:
				command = `google-chrome --load-extension="${extensionPath}" --new-window`;
		}

		return command;
	}
}
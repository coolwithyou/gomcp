import { execa } from 'execa';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { IndeterminateProgressBar } from './progress.js';

interface GitHubRelease {
	tag_name: string;
	assets: {
		name: string;
		browser_download_url: string;
	}[];
}

/**
 * Chrome Extension 자동 설치 유틸리티
 */
export class ChromeExtensionInstaller {
	private static readonly REPO = 'hangwin/mcp-chrome';
	private static readonly EXTENSION_DIR = path.join(os.homedir(), '.gomcp', 'chrome-extensions');
	private static readonly EXTENSION_NAME = 'mcp-chrome';

	/**
	 * Chrome MCP 확장을 자동으로 다운로드하고 설치합니다
	 */
	static async installChromeExtension(progressBar?: IndeterminateProgressBar): Promise<string> {
		try {
			progressBar?.updateLabel('🔍 Checking for latest Chrome extension...');

			// 1. GitHub API에서 최신 릴리스 확인
			const latestRelease = await this.getLatestRelease();

			// 2. 확장 파일 찾기 (zip 파일)
			const extensionAsset = latestRelease.assets.find(asset =>
				asset.name.toLowerCase().includes('extension') ||
				asset.name.toLowerCase().includes('chrome') ||
				asset.name.endsWith('.zip')
			);

			if (!extensionAsset) {
				throw new Error('Chrome extension file not found in latest release');
			}

			progressBar?.updateLabel('📥 Downloading Chrome extension...');

			// 3. 확장 디렉토리 생성
			const extensionPath = path.join(this.EXTENSION_DIR, this.EXTENSION_NAME);
			await fs.mkdir(extensionPath, { recursive: true });

			// 4. 확장 파일 다운로드
			const zipPath = path.join(this.EXTENSION_DIR, extensionAsset.name);
			await this.downloadFile(extensionAsset.browser_download_url, zipPath);

			progressBar?.updateLabel('📦 Extracting Chrome extension...');

			// 5. 압축 해제
			await this.extractZip(zipPath, extensionPath);

			// 6. 임시 zip 파일 삭제
			await fs.unlink(zipPath);

			progressBar?.updateLabel('✅ Chrome extension ready for installation');

			return extensionPath;
		} catch (error) {
			throw new Error(`Failed to install Chrome extension: ${error}`);
		}
	}

	/**
	 * GitHub API에서 최신 릴리스 정보를 가져옵니다
	 */
	private static async getLatestRelease(): Promise<GitHubRelease> {
		try {
			const response = await fetch(`https://api.github.com/repos/${this.REPO}/releases/latest`);
			if (!response.ok) {
				throw new Error(`GitHub API error: ${response.status}`);
			}
			return await response.json() as GitHubRelease;
		} catch (error) {
			throw new Error(`Failed to fetch latest release: ${error}`);
		}
	}

	/**
	 * 파일을 다운로드합니다
	 */
	private static async downloadFile(url: string, filePath: string): Promise<void> {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Download failed: ${response.status}`);
			}

			const buffer = await response.arrayBuffer();
			await fs.writeFile(filePath, Buffer.from(buffer));
		} catch (error) {
			throw new Error(`Failed to download file: ${error}`);
		}
	}

	/**
	 * ZIP 파일을 압축 해제합니다
	 */
	private static async extractZip(zipPath: string, extractPath: string): Promise<void> {
		try {
			// unzip 명령어 사용 (macOS/Linux 기본 설치)
			await execa('unzip', ['-o', zipPath, '-d', extractPath]);
		} catch (error) {
			// unzip이 없는 경우 대안 방법
			try {
				// Node.js 스트림을 사용한 압축 해제 (추가 구현 필요)
				throw new Error('Please install unzip utility or extract manually');
			} catch (fallbackError) {
				throw new Error(`Failed to extract ZIP: ${error}`);
			}
		}
	}

	/**
	 * Chrome 확장 로딩 가이드를 표시합니다
	 */
	static showInstallationGuide(extensionPath: string): void {
		console.log(chalk.cyan('\n🌏 Chrome Extension Installation Guide'));
		console.log(chalk.cyan('═'.repeat(50)));

		console.log('\n📋 Follow these steps to load the Chrome extension:');
		console.log('\n1. Open Chrome browser');
		console.log('2. Go to: chrome://extensions/');
		console.log('3. Enable "Developer mode" (toggle in top-right)');
		console.log('4. Click "Load unpacked"');
		console.log(`5. Select this folder: ${chalk.bold(extensionPath)}`);
		console.log('6. Click the extension icon and connect to enable MCP');

		console.log(chalk.green('\n✅ Once loaded, the Chrome MCP server will be ready to use!'));
		console.log(chalk.gray(`\n💡 Extension files are stored at: ${extensionPath}`));

		console.log(chalk.yellow('\n⚠️  Important Notes:'));
		console.log('• Keep Chrome browser open for MCP functionality');
		console.log('• The extension needs to stay enabled in Chrome');
		console.log('• If you see connection issues, check the extension status');
	}

	/**
	 * 확장이 이미 설치되어 있는지 확인합니다
	 */
	static async isExtensionInstalled(): Promise<boolean> {
		try {
			const extensionPath = path.join(this.EXTENSION_DIR, this.EXTENSION_NAME);
			const stats = await fs.stat(extensionPath);
			return stats.isDirectory();
		} catch {
			return false;
		}
	}

	/**
 * 설치된 확장의 경로를 반환합니다
 */
	static getExtensionPath(): string {
		return path.join(this.EXTENSION_DIR, this.EXTENSION_NAME);
	}

	/**
	 * Chrome MCP HTTP 서버가 실행 중인지 확인합니다
	 */
	static async checkHttpServerStatus(): Promise<boolean> {
		try {
			const response = await fetch('http://127.0.0.1:12306/mcp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 1,
					method: 'initialize',
					params: {
						protocolVersion: '2024-11-05',
						capabilities: {},
						clientInfo: {
							name: 'gomcp-test',
							version: '1.0.0',
						},
					},
				}),
			});
			return response.ok;
		} catch {
			return false;
		}
	}

	/**
	 * Chrome MCP 상태 진단 정보를 제공합니다
	 */
	static async getDiagnosticInfo(): Promise<{
		extensionInstalled: boolean;
		httpServerRunning: boolean;
		recommendations: string[];
	}> {
		const extensionInstalled = await this.isExtensionInstalled();
		const httpServerRunning = await this.checkHttpServerStatus();

		const recommendations: string[] = [];

		if (!extensionInstalled) {
			recommendations.push('Install Chrome extension from GitHub releases');
			recommendations.push('Run: gomcp and select Chrome MCP for auto-installation');
		}

		if (!httpServerRunning) {
			recommendations.push('Open Chrome browser');
			recommendations.push('Go to chrome://extensions/ and ensure Chrome MCP extension is enabled');
			recommendations.push('Click the extension icon and ensure it shows "Connected" status');
			recommendations.push('Check that the extension is communicating on port 12306');
		}

		if (extensionInstalled && !httpServerRunning) {
			recommendations.push('The extension may be installed but not connected');
			recommendations.push('Try refreshing the extension or restarting Chrome');
		}

		return {
			extensionInstalled,
			httpServerRunning,
			recommendations,
		};
	}
}
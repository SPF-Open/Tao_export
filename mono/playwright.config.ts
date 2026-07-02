import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

// Some sandboxed environments pre-install a Chromium build and block browser
// downloads; use it when present instead of the version-pinned download.
const prebuiltChromium = '/opt/pw-browsers/chromium';
const launchOptions = existsSync(prebuiltChromium) ? { executablePath: prebuiltChromium } : {};

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: 'list',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry',
		launchOptions
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: {
		command: 'npm run build && npm run preview -- --port 4173 --strictPort',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	}
});

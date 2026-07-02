import type { Page } from '@playwright/test';

/**
 * Collects page errors and same-origin console errors. Console errors caused
 * by blocked *external* resources (e.g. the Google Fonts stylesheet in a
 * sandboxed CI without internet access) are ignored — they are environment
 * noise, not application bugs.
 */
export function collectErrors(page: Page): string[] {
	const errors: string[] = [];
	page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
	page.on('console', (msg) => {
		if (msg.type() !== 'error') return;
		const url = msg.location().url;
		if (url && !url.includes('localhost')) return;
		errors.push(`console: ${msg.text()}`);
	});
	return errors;
}

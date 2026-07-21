import { expect, test } from '@playwright/test';
import { collectErrors } from './helpers/errors';

const routes: { path: string; heading: RegExp }[] = [
	{ path: '/', heading: /choose a module/i },
	{ path: '/import', heading: /import a question file/i },
	{ path: '/export', heading: /import a tao export/i },
	{ path: '/format', heading: /format/i },
	{ path: '/editor', heading: /editor/i },
	{ path: '/audit', heading: /audit/i },
	{ path: '/library', heading: /database|library/i },
	{ path: '/iat', heading: /iat|item analysis/i },
	{ path: '/forge', heading: /forge|calendar/i },
	{ path: '/docs', heading: /doc/i },
	{ path: '/changelog', heading: /changelog|what changed/i }
];

for (const { path, heading } of routes) {
	test(`${path} renders without errors`, async ({ page }) => {
		const errors = collectErrors(page);

		await page.goto(path);
		await expect(page.locator('h1, h2, h3').filter({ hasText: heading }).first()).toBeVisible();

		// Give async init (stores, workers) a moment to surface failures.
		await page.waitForTimeout(400);
		expect(errors).toEqual([]);
	});
}

test('main navigation drawer links between tools', async ({ page }) => {
	const errors = collectErrors(page);

	await page.goto('/');
	// The home grid links to the import tool.
	await page.getByRole('link', { name: /import/i }).first().click();
	await expect(page).toHaveURL(/\/import/);
	await expect(page.getByText(/import a question file/i).first()).toBeVisible();

	expect(errors).toEqual([]);
});

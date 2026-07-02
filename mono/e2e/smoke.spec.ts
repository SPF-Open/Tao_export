import { expect, test } from '@playwright/test';

test('home page loads without runtime errors', async ({ page }) => {
	const pageErrors: Error[] = [];
	page.on('pageerror', (err) => pageErrors.push(err));

	await page.goto('/');

	await expect(page.getByRole('link', { name: /TAO/i }).first()).toBeVisible();
	expect(pageErrors).toEqual([]);
});

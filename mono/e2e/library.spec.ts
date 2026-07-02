import { expect, test } from '@playwright/test';
import { collectErrors } from './helpers/errors';

test('the library boots its SQLite worker without errors', async ({ page }) => {
	const errors = collectErrors(page);

	await page.goto('/library');
	await expect(page.getByText(/no library open|create.*library/i).first()).toBeVisible();

	// The sqlite-wasm worker initialises asynchronously (OPFS SAHPool or
	// in-memory fallback); give it time to fail loudly if it is broken.
	await page.waitForTimeout(1500);
	expect(errors).toEqual([]);
});

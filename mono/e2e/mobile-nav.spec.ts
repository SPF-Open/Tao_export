import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 375, height: 812 } });

test('on a phone the sidebar opens as a drawer and the backdrop closes it', async ({ page }) => {
	await page.goto('/import');

	const sidebar = page.getByRole('complementary');
	await expect(sidebar).toBeHidden();

	await page.getByRole('button', { name: 'Open sidebar' }).click();
	await expect(sidebar).toBeVisible();

	// The drawer covers most of the backdrop; tap the visible strip on the right.
	await page.getByRole('button', { name: 'Close menu' }).click({ position: { x: 365, y: 400 } });
	await expect(sidebar).toBeHidden();
});

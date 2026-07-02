import { expect, test } from '@playwright/test';

test('an unknown route shows the styled error page', async ({ page }) => {
	await page.goto('/definitely-not-a-page');

	await expect(page.getByText(/this page does not exist/i)).toBeVisible();
	await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible();
});

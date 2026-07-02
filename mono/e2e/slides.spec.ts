import { expect, test } from '@playwright/test';
import { collectErrors } from './helpers/errors';

test('keyboard navigation advances the deck', async ({ page }) => {
	const errors = collectErrors(page);

	await page.goto('/slides');
	await expect(page.getByText('01 / 08')).toBeVisible();

	await page.keyboard.press('ArrowRight');
	await expect(page.getByText('02 / 08')).toBeVisible();
	await expect(page).toHaveURL(/slide=2/);

	await page.keyboard.press('ArrowLeft');
	await expect(page.getByText('01 / 08')).toBeVisible();

	expect(errors).toEqual([]);
});

test('a shared ?slide=N link lands on that slide', async ({ page }) => {
	await page.goto('/slides?slide=5');
	await expect(page.getByText('05 / 08')).toBeVisible();
	await expect(page.getByText(/from raw data to delivered exam/i)).toBeVisible();
});

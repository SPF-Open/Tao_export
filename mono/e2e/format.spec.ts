import { expect, test } from '@playwright/test';
import { buildQtiZipBuffer } from './helpers/buildQtiZip';
import { collectErrors } from './helpers/errors';

test('the format tool parses a QTI zip and lists its questions', async ({ page }) => {
	const errors = collectErrors(page);
	const zip = await buildQtiZipBuffer();

	await page.goto('/format');
	await page.locator('input[type="file"]').setInputFiles({
		name: 'export.zip',
		mimeType: 'application/zip',
		buffer: zip
	});

	// The question picker lists one row per qti.xml entry, titled from the QTI.
	const rows = page.getByRole('listitem').getByRole('button', { name: /MKV 01/ });
	await expect(rows).toHaveCount(2);

	// Selecting a question opens the stem editor for it.
	await rows.first().click();
	await expect(page.getByRole('heading', { level: 3, name: /MKV 01/ })).toBeVisible();
	await expect(page.getByRole('textbox')).toBeVisible();

	expect(errors).toEqual([]);
});

import { expect, test } from '@playwright/test';
import { buildEditorZipBuffer } from './helpers/buildEditorZip';
import { collectErrors } from './helpers/errors';

test('the editor tool opens a QTI zip, edits a question in both modes, and exports', async ({ page }) => {
	const errors = collectErrors(page);
	const zip = await buildEditorZipBuffer();

	await page.goto('/editor');
	await page.locator('input[type="file"]').setInputFiles({
		name: 'export.zip',
		mimeType: 'application/zip',
		buffer: zip
	});

	// The question picker lists one row per item.
	const rows = page.locator('.question-list').getByRole('listitem');
	await expect(rows).toHaveCount(2);
	await expect(rows.getByRole('button', { name: /QCM Test/ })).toBeVisible();
	await expect(rows.getByRole('button', { name: /Question ouverte/ })).toBeVisible();

	// Selecting the choice question opens the Simple-mode editor.
	await rows.getByRole('button', { name: /QCM Test/ }).click();
	await expect(page.getByRole('heading', { level: 3, name: /QCM Test/ })).toBeVisible();

	// Edit the first choice's text in Simple mode.
	const firstChoiceText = page.locator('.choice-row').first().locator('textarea');
	await expect(firstChoiceText).toHaveValue('Amsterdam');
	await firstChoiceText.fill('Amsterdam (NL)');

	// The sidebar marks the question as modified.
	await expect(page.locator('.question-row.active .dirty-dot')).toBeVisible();

	// Switch to raw XML mode and confirm the edit is reflected there.
	await page.getByRole('button', { name: 'XML brut' }).click();
	const rawEditor = page.locator('.raw-editor textarea');
	await expect(rawEditor).toHaveValue(/Amsterdam \(NL\)/);

	// Switch back to Simple mode — both views stay in sync.
	await page.getByRole('button', { name: 'Simple' }).click();
	await expect(firstChoiceText).toHaveValue('Amsterdam (NL)');

	// Export and confirm the download UI appears.
	await page.getByRole('button', { name: /Exporter le ZIP/ }).click();
	await expect(page.getByRole('button', { name: /Télécharger/ }).first()).toBeVisible();

	expect(errors).toEqual([]);
});

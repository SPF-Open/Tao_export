/**
 * Regression tests for the import page:
 * - a corrupt Excel file must surface a notification instead of an unhandled
 *   promise rejection;
 * - store subscriptions must not outlive the page (the old manual
 *   store.subscribe calls leaked and re-parsed once per past visit).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import { get } from 'svelte/store';
import * as XLSX from 'xlsx';
import ImportPage from './+page.svelte';
import { file, currentSheet } from '$lib/import/helper/store';
import { notifications } from '$lib/ui/notifications';
import { Question } from '$lib/import/helper/question';

function makeXlsxFile(): File {
	const sheet = XLSX.utils.aoa_to_sheet([
		['Title', 'Prompt'],
		['Q1', 'What?']
	]);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1');
	const bytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
	return new File([bytes], 'questions.xlsx');
}

async function waitFor(assertion: () => void): Promise<void> {
	await vi.waitFor(assertion, { timeout: 2000 });
}

beforeEach(() => {
	file.set(null);
	currentSheet.set('');
	notifications.set([]);
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe('import page', () => {
	test('a corrupt file shows an error notification instead of crashing', async () => {
		render(ImportPage);
		file.set(new File([new Uint8Array([1, 2, 3, 4])], 'broken.xlsx'));

		await waitFor(() => {
			const items = get(notifications);
			expect(items.some((n) => n.variant === 'error')).toBe(true);
		});
	});

	test('parsing runs once per change, even after remounting the page', async () => {
		const parseSpy = vi.spyOn(Question, 'parseSheet').mockReturnValue([]);

		// First visit: loading a file parses once.
		const first = render(ImportPage);
		file.set(makeXlsxFile());
		currentSheet.set('Sheet1');
		await waitFor(() => expect(parseSpy).toHaveBeenCalledTimes(1));

		// Leaving the page must tear its subscriptions down.
		first.unmount();

		// Second visit: the still-loaded file parses once more on mount…
		render(ImportPage);
		await waitFor(() => expect(parseSpy).toHaveBeenCalledTimes(2));

		// …and a sheet change parses exactly once, not once per past visit.
		currentSheet.set('Other');
		await waitFor(() => expect(parseSpy).toHaveBeenCalledTimes(3));
	});
});

import { BlobReader, BlobWriter, TextReader, TextWriter, ZipReader, ZipWriter, type FileEntry } from '@zip.js/zip.js';
import { parseEditableItem, type EditableItem } from './itemFields';

export interface EditorPackage {
	items: EditableItem[];
	/** Zip filename of test.xml, or null when the package has none (Format-tool-style loose item bundles). */
	testFilename: string | null;
	/** Zip filename of imsmanifest.xml, or null when the package has none. */
	manifestFilename: string | null;
	/** Current raw text of every relevant file, keyed by zip filename — the shared source of truth for Simple and Raw modes. */
	texts: Map<string, string>;
}

/**
 * Enumerate every `*qti.xml` entry in a QTI zip into its editable field
 * model, and capture the raw text of `test.xml`/`imsmanifest.xml` when
 * present. Matching is deliberately lenient (same as `parseStemZip` in
 * `$lib/format/stemZip.ts`) — a package doesn't need a test.xml or
 * imsmanifest.xml for its items to be editable; TAO-options/LOM metadata
 * sections are simply unavailable for a package that lacks them.
 */
export async function parseEditorZip(input: Blob | File): Promise<EditorPackage> {
	const reader = new ZipReader(new BlobReader(input));
	const items: EditableItem[] = [];
	const texts = new Map<string, string>();
	let testFilename: string | null = null;
	let manifestFilename: string | null = null;

	try {
		const entries = await reader.getEntries();

		const testEntry =
			entries.find((e): e is FileEntry => !e.directory && /(^|\/)tests\//.test(e.filename)) ??
			entries.find((e): e is FileEntry => !e.directory && e.filename.toLowerCase().endsWith('test.xml'));
		const manifestEntry = entries.find(
			(e): e is FileEntry => !e.directory && e.filename.toLowerCase().endsWith('imsmanifest.xml')
		);

		if (testEntry) {
			testFilename = testEntry.filename;
			texts.set(testFilename, await testEntry.getData(new TextWriter()));
		}
		if (manifestEntry) {
			manifestFilename = manifestEntry.filename;
			texts.set(manifestFilename, await manifestEntry.getData(new TextWriter()));
		}

		for (const entry of entries) {
			if (entry.directory || !entry.getData) continue;
			if (!entry.filename.toLowerCase().endsWith('qti.xml')) continue;

			const xml = await entry.getData(new TextWriter());
			texts.set(entry.filename, xml);
			items.push(parseEditableItem(xml, entry.filename));
		}
	} finally {
		await reader.close();
	}

	return { items, testFilename, manifestFilename, texts };
}

/**
 * Rebuild the zip: every entry named in `edits` is written with its edited
 * text; every other entry (assets, css, and any file with no edits) passes
 * through byte-identical, same as `buildStemZip`.
 */
export async function buildEditorZip(
	input: Blob | File,
	edits: Map<string, string>
): Promise<{ blob: Blob; changedFiles: number; totalItems: number }> {
	const reader = new ZipReader(new BlobReader(input));
	const writer = new ZipWriter(new BlobWriter('application/zip'));

	let changedFiles = 0;
	let totalItems = 0;

	try {
		const entries = await reader.getEntries();

		for (const entry of entries) {
			if (entry.directory || !entry.getData) continue;
			if (entry.filename.toLowerCase().endsWith('qti.xml')) totalItems += 1;

			const edited = edits.get(entry.filename);
			if (edited !== undefined) {
				const original = await entry.getData(new TextWriter());
				if (edited !== original) changedFiles += 1;
				await writer.add(entry.filename, new TextReader(edited));
			} else {
				const blob = await entry.getData(new BlobWriter());
				await writer.add(entry.filename, new BlobReader(blob));
			}
		}
	} finally {
		await reader.close();
	}

	const blob = await writer.close();
	return { blob, changedFiles, totalItems };
}

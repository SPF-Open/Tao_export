import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BlobReader, BlobWriter, TextReader, TextWriter, ZipReader, ZipWriter, type FileEntry } from '@zip.js/zip.js';
import { buildEditorZip, parseEditorZip } from '../editorZip.js';

const fixtures = fileURLToPath(new URL('fixtures', import.meta.url));
const read = (name: string) => readFileSync(join(fixtures, name), 'utf-8');

async function buildFixtureZip(): Promise<Blob> {
	const writer = new ZipWriter(new BlobWriter('application/zip'));
	await writer.add('items/item-choice-1/qti.xml', new TextReader(read('choice-item.qti.xml')));
	await writer.add('items/item-text-1/qti.xml', new TextReader(read('text-item.qti.xml')));
	await writer.add('tests/test-1/test.xml', new TextReader(read('test.xml')));
	await writer.add('imsmanifest.xml', new TextReader(read('imsmanifest.xml')));
	await writer.add('css/style.css', new TextReader('body { color: red; }'));
	return writer.close();
}

describe('parseEditorZip', () => {
	test('enumerates every qti.xml entry and locates test.xml / imsmanifest.xml', async () => {
		const zip = await buildFixtureZip();
		const pkg = await parseEditorZip(zip);

		expect(pkg.items).toHaveLength(2);
		expect(pkg.items.map((i) => i.identifier).sort()).toEqual(['item-choice-1', 'item-text-1']);
		expect(pkg.testFilename).toBe('tests/test-1/test.xml');
		expect(pkg.manifestFilename).toBe('imsmanifest.xml');
		expect(pkg.texts.get('imsmanifest.xml')).toContain('res-choice-1');
		expect(pkg.texts.get('tests/test-1/test.xml')).toContain('assessmentItemRef');
		expect(pkg.texts.get('items/item-choice-1/qti.xml')).toContain('Bruxelles');
	});

	test('degrades gracefully for a loose bundle with no test.xml or imsmanifest.xml', async () => {
		const writer = new ZipWriter(new BlobWriter('application/zip'));
		await writer.add('items/item-choice-1/qti.xml', new TextReader(read('choice-item.qti.xml')));
		const zip = await writer.close();

		const pkg = await parseEditorZip(zip);
		expect(pkg.items).toHaveLength(1);
		expect(pkg.testFilename).toBeNull();
		expect(pkg.manifestFilename).toBeNull();
	});
});

describe('buildEditorZip', () => {
	test('writes edited entries and passes everything else through byte-identical', async () => {
		const zip = await buildFixtureZip();
		const edits = new Map<string, string>([
			['items/item-choice-1/qti.xml', read('choice-item.qti.xml').replace('Bruxelles', 'Bruxelles-Capitale')]
		]);

		const { blob, changedFiles, totalItems } = await buildEditorZip(zip, edits);
		expect(changedFiles).toBe(1);
		expect(totalItems).toBe(2);

		const reader = new ZipReader(new BlobReader(blob));
		const entries = await reader.getEntries();
		expect(entries.map((e) => e.filename).sort()).toEqual(
			['css/style.css', 'imsmanifest.xml', 'items/item-choice-1/qti.xml', 'items/item-text-1/qti.xml', 'tests/test-1/test.xml'].sort()
		);

		const editedItem = entries.find(
			(e): e is FileEntry => !e.directory && e.filename === 'items/item-choice-1/qti.xml'
		);
		const editedText = await editedItem!.getData(new TextWriter());
		expect(editedText).toContain('Bruxelles-Capitale');

		const untouchedItem = entries.find(
			(e): e is FileEntry => !e.directory && e.filename === 'items/item-text-1/qti.xml'
		);
		const untouchedText = await untouchedItem!.getData(new TextWriter());
		expect(untouchedText).toBe(read('text-item.qti.xml'));

		const css = entries.find((e): e is FileEntry => !e.directory && e.filename === 'css/style.css');
		const cssText = await css!.getData(new TextWriter());
		expect(cssText).toBe('body { color: red; }');

		await reader.close();
	});

	test('does not count a file as changed when the edited text equals the original', async () => {
		const zip = await buildFixtureZip();
		const edits = new Map<string, string>([['items/item-choice-1/qti.xml', read('choice-item.qti.xml')]]);

		const { changedFiles } = await buildEditorZip(zip, edits);
		expect(changedFiles).toBe(0);
	});
});

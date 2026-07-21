import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js';

const fixtures = fileURLToPath(
	new URL('../../src/lib/editor/__tests__/fixtures', import.meta.url)
);

/**
 * Builds a TAO-shaped QTI zip (two items + test.xml + imsmanifest.xml) that
 * `parseEditorZip` accepts, and returns its bytes for `setInputFiles`.
 */
export async function buildEditorZipBuffer(): Promise<Buffer> {
	const writer = new ZipWriter(new BlobWriter('application/zip'));
	const read = (name: string) => readFileSync(join(fixtures, name), 'utf-8');

	await writer.add('items/item-choice-1/qti.xml', new TextReader(read('choice-item.qti.xml')));
	await writer.add('items/item-text-1/qti.xml', new TextReader(read('text-item.qti.xml')));
	await writer.add('tests/test-1/test.xml', new TextReader(read('test.xml')));
	await writer.add('imsmanifest.xml', new TextReader(read('imsmanifest.xml')));

	const blob = await writer.close();
	return Buffer.from(await blob.arrayBuffer());
}

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js';

const fixtures = fileURLToPath(
	new URL('../../src/lib/format/__tests__/fixtures', import.meta.url)
);

/**
 * Builds a minimal TAO QTI zip (one `items/<id>/qti.xml` entry per fixture)
 * that `parseStemZip` accepts, and returns its bytes for `setInputFiles`.
 */
export async function buildQtiZipBuffer(
	fixtureNames: string[] = ['bold.qti.xml', 'prompt-only.qti.xml']
): Promise<Buffer> {
	const writer = new ZipWriter(new BlobWriter('application/zip'));
	for (const [i, name] of fixtureNames.entries()) {
		const xml = readFileSync(join(fixtures, name), 'utf-8');
		await writer.add(`items/item-${i + 1}/qti.xml`, new TextReader(xml));
	}
	const blob = await writer.close();
	return Buffer.from(await blob.arrayBuffer());
}

import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractLomFields, hasMetadata, hasResource } from '../manifestFields.js';
import { insertLomSkeleton, spliceLomField } from '../manifestSplice.js';

const fixtures = fileURLToPath(new URL('fixtures', import.meta.url));
const read = (name: string) => readFileSync(join(fixtures, name), 'utf-8');

describe('extractLomFields / hasResource / hasMetadata', () => {
	test('resolves a resource by href and walks its LOM leaf fields generically', () => {
		const manifest = read('imsmanifest.xml');
		const fields = extractLomFields(manifest, 'items/item-choice-1/qti.xml');

		expect(fields).toHaveLength(2);
		expect(fields[0]).toMatchObject({ index: 0, label: 'string', value: 'competency' });
		expect(fields[1]).toMatchObject({ index: 1, label: 'string', value: 'C12' });
	});

	test('reports a resource with no <metadata> block as such', () => {
		const manifest = read('imsmanifest.xml');
		expect(hasResource(manifest, 'items/item-text-1/qti.xml')).toBe(true);
		expect(hasMetadata(manifest, 'items/item-text-1/qti.xml')).toBe(false);
		expect(extractLomFields(manifest, 'items/item-text-1/qti.xml')).toEqual([]);
	});

	test('returns empty/false for an item with no resource at all', () => {
		const manifest = read('imsmanifest.xml');
		expect(hasResource(manifest, 'items/item-unknown/qti.xml')).toBe(false);
		expect(extractLomFields(manifest, 'items/item-unknown/qti.xml')).toEqual([]);
	});
});

describe('spliceLomField', () => {
	test('replaces one leaf field by index, leaving the others and the rest of the manifest untouched', () => {
		const manifest = read('imsmanifest.xml');
		const out = spliceLomField(manifest, 'items/item-choice-1/qti.xml', 1, 'C99');

		const fields = extractLomFields(out, 'items/item-choice-1/qti.xml');
		expect(fields[0].value).toBe('competency');
		expect(fields[1].value).toBe('C99');
		expect(out).toContain('<schema>QTIv2.2 Package</schema>');
		expect(out).toContain('res-text-1');
	});

	test('XML-escapes the new value', () => {
		const manifest = read('imsmanifest.xml');
		const out = spliceLomField(manifest, 'items/item-choice-1/qti.xml', 1, 'A & B < C');
		expect(out).toContain('A &amp; B &lt; C');
	});

	test('is a no-op when the value is unchanged', () => {
		const manifest = read('imsmanifest.xml');
		expect(spliceLomField(manifest, 'items/item-choice-1/qti.xml', 0, 'competency')).toBe(manifest);
	});

	test('is a no-op when the item has no metadata block to edit', () => {
		const manifest = read('imsmanifest.xml');
		expect(spliceLomField(manifest, 'items/item-text-1/qti.xml', 0, 'anything')).toBe(manifest);
	});
});

describe('insertLomSkeleton', () => {
	test('adds a minimal, editable metadata block to a resource that had none', () => {
		const manifest = read('imsmanifest.xml');
		const out = insertLomSkeleton(manifest, 'items/item-text-1/qti.xml');

		expect(hasMetadata(out, 'items/item-text-1/qti.xml')).toBe(true);
		const fields = extractLomFields(out, 'items/item-text-1/qti.xml');
		expect(fields).toHaveLength(2);
		expect(fields[0]).toMatchObject({ label: 'string', value: 'competency' });
		expect(fields[1]).toMatchObject({ label: 'string', value: '' });
		// The other resource's existing metadata is untouched.
		expect(extractLomFields(out, 'items/item-choice-1/qti.xml')).toHaveLength(2);
	});

	test('is a no-op when the resource already has a metadata block', () => {
		const manifest = read('imsmanifest.xml');
		expect(insertLomSkeleton(manifest, 'items/item-choice-1/qti.xml')).toBe(manifest);
	});

	test('is a no-op when the item has no resource at all', () => {
		const manifest = read('imsmanifest.xml');
		expect(insertLomSkeleton(manifest, 'items/item-unknown/qti.xml')).toBe(manifest);
	});
});

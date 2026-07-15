import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractTestToolOptions, findItemRefTag } from '../testFields.js';
import { spliceTestToolOptions } from '../testSplice.js';

const fixtures = fileURLToPath(new URL('fixtures', import.meta.url));
const read = (name: string) => readFileSync(join(fixtures, name), 'utf-8');

describe('findItemRefTag / extractTestToolOptions', () => {
	test('resolves an item ref by href regardless of the relative-path prefix', () => {
		const testXml = read('test.xml');
		const tag = findItemRefTag(testXml, 'items/item-choice-1/qti.xml');
		expect(tag).toContain('ref-choice-1');
	});

	test('reads the tool options and informational flag off @category', () => {
		const testXml = read('test.xml');
		const options = extractTestToolOptions(testXml, 'items/item-choice-1/qti.xml');
		expect(options).toEqual({ tools: { calculator: true, zoom: true }, informational: false });
	});

	test('returns empty tools for an empty category', () => {
		const testXml = read('test.xml');
		const options = extractTestToolOptions(testXml, 'items/item-text-1/qti.xml');
		expect(options).toEqual({ tools: {}, informational: false });
	});

	test('returns null when the item has no ref in test.xml', () => {
		const testXml = read('test.xml');
		expect(extractTestToolOptions(testXml, 'items/item-unknown/qti.xml')).toBeNull();
	});
});

describe('spliceTestToolOptions', () => {
	test('rebuilds the @category token string for the matching item ref only', () => {
		const testXml = read('test.xml');
		const out = spliceTestToolOptions(testXml, 'items/item-text-1/qti.xml', { highlighter: true }, true);

		expect(out).toContain('ref-text-1');
		expect(extractTestToolOptions(out, 'items/item-text-1/qti.xml')).toEqual({
			tools: { highlighter: true },
			informational: true
		});
		// The other item's ref is untouched.
		expect(extractTestToolOptions(out, 'items/item-choice-1/qti.xml')).toEqual({
			tools: { calculator: true, zoom: true },
			informational: false
		});
	});

	test('is a no-op when the resulting category string is unchanged', () => {
		const testXml = read('test.xml');
		const out = spliceTestToolOptions(testXml, 'items/item-choice-1/qti.xml', { calculator: true, zoom: true }, false);
		expect(out).toBe(testXml);
	});

	test('is a no-op when the item has no ref in test.xml', () => {
		const testXml = read('test.xml');
		expect(spliceTestToolOptions(testXml, 'items/item-unknown/qti.xml', { zoom: true }, false)).toBe(testXml);
	});
});

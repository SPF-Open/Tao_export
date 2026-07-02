import { describe, expect, test } from 'vitest';
import { fnv1aHex } from '../hashUtil.js';
import { buildMatchQuery } from '../worker/search.js';
import { extractCompetencies } from '../parse/competency.js';
import type { AssessmentItem } from '$lib/questions/types.js';

describe('fnv1aHex', () => {
	test('is deterministic and order-sensitive', () => {
		expect(fnv1aHex('a|b|c')).toBe(fnv1aHex('a|b|c'));
		expect(fnv1aHex('a|b')).not.toBe(fnv1aHex('b|a'));
	});
	test('returns 8 hex chars', () => {
		expect(fnv1aHex('anything')).toMatch(/^[0-9a-f]{8}$/);
	});
});

describe('buildMatchQuery', () => {
	test('builds prefix terms joined by implicit AND', () => {
		expect(buildMatchQuery('hello world')).toBe('"hello"* "world"*');
	});
	test('neutralizes FTS operators by quoting', () => {
		// Double quotes are escaped; bare operators become literal tokens.
		expect(buildMatchQuery('a"b OR c')).toBe('"a""b"* "OR"* "c"*');
	});
	test('collapses extra whitespace and ignores empties', () => {
		expect(buildMatchQuery('  foo   bar  ')).toBe('"foo"* "bar"*');
	});
});

describe('extractCompetencies', () => {
	function item(metadata: AssessmentItem['metadata']): AssessmentItem {
		return { id: 'x', title: 't', type: 'single-choice', content: {}, metadata };
	}

	test('reads competency/indicator from item metadata', () => {
		const result = extractCompetencies(
			item({ competency: 'C1', indicator: 'I1', competencyDescr: 'desc', masteryDescr: 'mast' })
		);
		expect(result).toEqual([
			{ code: 'C1', label: 'desc', description: 'mast', indicator: 'I1' }
		]);
	});

	test('falls back to indicator as code when no competency', () => {
		const result = extractCompetencies(item({ indicator: 'I9' }));
		expect(result[0].code).toBe('I9');
	});

	test('returns empty when no competency data', () => {
		expect(extractCompetencies(item({}))).toEqual([]);
		expect(extractCompetencies(item(undefined))).toEqual([]);
	});
});

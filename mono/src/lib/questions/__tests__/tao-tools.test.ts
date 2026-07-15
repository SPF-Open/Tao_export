import { describe, expect, test } from 'vitest';
import { parseCategory, stringifyCategory } from '../tao-tools.js';

describe('stringifyCategory', () => {
	test('is the inverse of parseCategory for a mix of tools and the informational flag', () => {
		const category = 'x-tao-option-zoom x-tao-option-calculator x-tao-itemusage-informational';
		const { tools, informational } = parseCategory(category);
		expect(stringifyCategory(tools, informational)).toBe(
			'x-tao-option-zoom x-tao-option-calculator x-tao-itemusage-informational'
		);
	});

	test('returns an empty string for no tools and no informational flag', () => {
		expect(stringifyCategory({}, false)).toBe('');
	});

	test('omits false/undefined tool flags', () => {
		expect(stringifyCategory({ zoom: true, calculator: false }, false)).toBe('x-tao-option-zoom');
	});
});

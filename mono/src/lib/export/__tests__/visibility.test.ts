import { describe, expect, test } from 'vitest';
import { isItemVisible, reconcileInstructionVisibility } from '../visibility.js';
import type { AssessmentItem } from '$lib/questions/types.js';

const item = (id: string, type: AssessmentItem['type']): AssessmentItem => ({
	id,
	title: id,
	type,
	content: {}
});

describe('isItemVisible', () => {
	test('questions are visible by default and hidden on explicit false', () => {
		expect(isItemVisible(new Map(), true, 'q1', 'single-choice')).toBe(true);
		expect(isItemVisible(new Map([['q1', false]]), true, 'q1', 'single-choice')).toBe(false);
	});

	test('instructions follow the global toggle unless explicitly re-shown', () => {
		// Toggle on: visible unless hidden explicitly.
		expect(isItemVisible(new Map(), true, 'i1', 'instruction')).toBe(true);
		// Toggle off: hidden unless explicitly set to true.
		expect(isItemVisible(new Map(), false, 'i1', 'instruction')).toBe(false);
		expect(isItemVisible(new Map([['i1', true]]), false, 'i1', 'instruction')).toBe(true);
	});
});

describe('reconcileInstructionVisibility', () => {
	const items = [item('q1', 'single-choice'), item('i1', 'instruction'), item('i2', 'instruction')];

	test('marks every instruction hidden when the toggle goes off', () => {
		const result = reconcileInstructionVisibility(new Map(), items, false);
		expect(result).not.toBeNull();
		expect(result!.get('i1')).toBe(false);
		expect(result!.get('i2')).toBe(false);
		expect(result!.has('q1')).toBe(false);
	});

	test('clears instruction overrides when the toggle goes back on', () => {
		const overrides = new Map<string, boolean>([
			['i1', false],
			['i2', true],
			['q1', false]
		]);
		const result = reconcileInstructionVisibility(overrides, items, true);
		expect(result).not.toBeNull();
		expect(result!.has('i1')).toBe(false);
		expect(result!.has('i2')).toBe(false);
		// Question overrides are untouched.
		expect(result!.get('q1')).toBe(false);
	});

	test('returns null when nothing changes', () => {
		expect(reconcileInstructionVisibility(new Map(), items, true)).toBeNull();
		const alreadyHidden = new Map<string, boolean>([
			['i1', false],
			['i2', false]
		]);
		expect(reconcileInstructionVisibility(alreadyHidden, items, false)).toBeNull();
	});
});

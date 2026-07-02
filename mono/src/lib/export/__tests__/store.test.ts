/**
 * Characterization tests for the export store.
 *
 * The store keeps module-level mutable state (original question/answer orders)
 * and wires behaviour through store subscriptions, so every test re-imports a
 * fresh module instance via `vi.resetModules()` + dynamic import.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { get } from 'svelte/store';
import type { Assessment, AssessmentItem } from '$lib/questions/types.js';

type ExportStore = typeof import('../store');

async function freshStore(): Promise<ExportStore> {
	vi.resetModules();
	return import('../store');
}

function item(
	id: string,
	title: string,
	type: AssessmentItem['type'] = 'single-choice',
	optionIds: string[] = []
): AssessmentItem {
	return {
		id,
		title,
		type,
		content: { text: title },
		responses: optionIds.length
			? [
					{
						id: `${id}-resp`,
						cardinality: 'single',
						baseType: 'identifier',
						options: optionIds.map((oid) => ({ id: oid, content: { text: oid } }))
					}
				]
			: undefined
	};
}

function assessment(id: string, title: string, items: AssessmentItem[]): Assessment {
	return {
		id,
		title,
		metadata: { tools: {} },
		sections: [{ id: `${id}-s1`, title: 'Section 1', items }],
		assets: {}
	};
}

const threeQuestions = () => [
	item('q1', 'Question 1', 'single-choice', ['a', 'b', 'c']),
	item('q2', 'Question 2', 'single-choice', ['d', 'e', 'f']),
	item('q3', 'Question 3', 'single-choice', ['g', 'h', 'i'])
];

/**
 * Loads one assessment and activates its items, mirroring what ZipDropZone
 * does on load (it sets activeItems directly; the examsIndex subscription
 * only reacts to later index *changes*).
 */
function loadExam(store: ExportStore, items: AssessmentItem[] = threeQuestions()): void {
	store.assessments.set([assessment('exam-1', 'Exam One', items)]);
	store.activeItems.set(items);
	store.windowName.set('Exam One');
}

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('exam selection (examsIndex)', () => {
	test('changing the exam index flattens that exam into activeItems and resets state', async () => {
		const store = await freshStore();
		store.assessments.set([
			assessment('e1', 'First', [item('q1', 'Question 1')]),
			assessment('e2', 'Second', [item('q2', 'Question 2')])
		]);
		store.activeItems.set([item('q1', 'Question 1')]);
		store.showItems.set(new Map([['q1', false]]));

		store.examsIndex.set(1);
		expect(get(store.activeItems).map((i) => i.id)).toEqual(['q2']);
		expect(get(store.oldItems)).toEqual([]);
		expect(get(store.showItems).size).toBe(0);
		expect(get(store.windowName)).toBe('Second');
	});

	test('an out-of-range index leaves activeItems untouched', async () => {
		const store = await freshStore();
		loadExam(store);
		store.examsIndex.set(5);
		expect(get(store.activeItems).map((i) => i.id)).toEqual(['q1', 'q2', 'q3']);
	});
});

describe('sort', () => {
	test('sorting orders questions by number in title, instructions last', async () => {
		const store = await freshStore();
		loadExam(store, [
			item('q10', 'Question 10'),
			item('inst', 'Read me first', 'instruction'),
			item('q2', 'Question 2'),
			item('q1', 'Question 1')
		]);

		store.sort.set(true);
		expect(get(store.activeItems).map((i) => i.id)).toEqual(['q1', 'q2', 'q10', 'inst']);
	});

	test('toggling sort off keeps the sorted order (current behaviour)', async () => {
		const store = await freshStore();
		loadExam(store, [item('q2', 'Question 2'), item('q1', 'Question 1')]);

		store.sort.set(true);
		expect(get(store.activeItems).map((i) => i.id)).toEqual(['q1', 'q2']);
		// The store sorts the saved copy (oldItems) too, so switching sort off
		// does NOT restore the pre-sort order. Pinned as-is.
		store.sort.set(false);
		expect(get(store.activeItems).map((i) => i.id)).toEqual(['q1', 'q2']);
	});
});

describe('randomizeQuestion', () => {
	test('shuffles non-instruction items, keeps instructions first', async () => {
		const store = await freshStore();
		loadExam(store, [
			item('q1', 'Question 1'),
			item('inst', 'Instructions', 'instruction'),
			item('q2', 'Question 2'),
			item('q3', 'Question 3')
		]);

		// Math.random() -> 0 makes the Fisher-Yates shuffle deterministic.
		vi.spyOn(Math, 'random').mockReturnValue(0);
		store.randomizeQuestion.set(true);

		const ids = get(store.activeItems).map((i) => i.id);
		expect(ids[0]).toBe('inst');
		expect([...ids].sort()).toEqual(['inst', 'q1', 'q2', 'q3']);
		expect(ids).not.toEqual(['inst', 'q1', 'q2', 'q3']); // actually shuffled
	});

	test('turning randomize off restores the original order', async () => {
		const store = await freshStore();
		loadExam(store);

		vi.spyOn(Math, 'random').mockReturnValue(0);
		store.randomizeQuestion.set(true);
		store.randomizeQuestion.set(false);

		expect(get(store.activeItems).map((i) => i.id)).toEqual(['q1', 'q2', 'q3']);
	});

	test('questionMapping maps shuffled positions back to original 1-based indices', async () => {
		const store = await freshStore();
		loadExam(store);

		vi.spyOn(Math, 'random').mockReturnValue(0);
		store.randomizeQuestion.set(true);

		const mapping = get(store.questionMapping);
		expect(mapping).toHaveLength(3);
		for (const entry of mapping) {
			const original = get(store.activeItems)[entry.currentIndex - 1];
			expect(entry.title).toBe(original.title);
		}
		// currentIndex is sequential and 1-based.
		expect(mapping.map((m) => m.currentIndex)).toEqual([1, 2, 3]);
		// originalIndex is a permutation of 1..3.
		expect([...mapping.map((m) => m.originalIndex)].sort()).toEqual([1, 2, 3]);
	});

	test('questionMapping is empty when nothing is randomized', async () => {
		const store = await freshStore();
		loadExam(store);
		expect(get(store.questionMapping)).toEqual([]);
	});
});

describe('randomizeAnswer', () => {
	test('shuffles options of single-choice items and restores them on toggle off', async () => {
		const store = await freshStore();
		loadExam(store);

		vi.spyOn(Math, 'random').mockReturnValue(0);
		store.randomizeAnswer.set(true);

		const q1 = get(store.activeItems).find((i) => i.id === 'q1')!;
		const shuffled = q1.responses![0].options!.map((o) => o.id);
		expect([...shuffled].sort()).toEqual(['a', 'b', 'c']);
		expect(shuffled).not.toEqual(['a', 'b', 'c']);

		store.randomizeAnswer.set(false);
		const restored = get(store.activeItems).find((i) => i.id === 'q1')!;
		expect(restored.responses![0].options!.map((o) => o.id)).toEqual(['a', 'b', 'c']);
	});

	test('answerMapping lists per-question option mappings while randomized', async () => {
		const store = await freshStore();
		loadExam(store);

		vi.spyOn(Math, 'random').mockReturnValue(0);
		store.randomizeAnswer.set(true);

		const mapping = get(store.answerMapping);
		expect(mapping.map((m) => m.title)).toEqual(['Question 1', 'Question 2', 'Question 3']);
		for (const entry of mapping) {
			expect(entry.mapping.map((m) => m.currentIndex)).toEqual([1, 2, 3]);
			expect([...entry.mapping.map((m) => m.originalIndex)].sort()).toEqual([1, 2, 3]);
		}

		store.randomizeAnswer.set(false);
		expect(get(store.answerMapping)).toEqual([]);
	});

	test('items without options are left untouched', async () => {
		const store = await freshStore();
		loadExam(store, [item('inst', 'Instructions', 'instruction'), item('txt', 'Free text', 'text')]);

		store.randomizeAnswer.set(true);
		expect(get(store.activeItems).map((i) => i.id)).toEqual(['inst', 'txt']);
	});
});

describe('merge', () => {
	test('merge=true concatenates the items of every assessment', async () => {
		const store = await freshStore();
		store.assessments.set([
			assessment('e1', 'First', [item('q1', 'Question 1')]),
			assessment('e2', 'Second', [item('q2', 'Question 2')])
		]);
		store.examsIndex.set(0);

		store.merge.set(true);
		expect(get(store.activeItems).map((i) => i.id)).toEqual(['q1', 'q2']);

		store.merge.set(false);
		expect(get(store.activeItems).map((i) => i.id)).toEqual(['q1']);
	});
});

describe('multiple / compareMode', () => {
	test('enabling compareMode with multiple exams selects both exams and the compare page', async () => {
		const store = await freshStore();
		store.assessments.set([
			assessment('e1', 'First', [item('q1', 'Question 1')]),
			assessment('e2', 'Second', [item('q2', 'Question 2')])
		]);
		store.examsIndex.set(0);
		store.multiple.set(true);

		store.compareMode.set(true);
		expect(get(store.compareExamIndex1)).toBe(0);
		expect(get(store.compareExamIndex2)).toBe(1);
		expect(get(store.currentPage)).toBe('compare');

		store.compareMode.set(false);
		expect(get(store.compareExamIndex1)).toBe(-1);
		expect(get(store.compareExamIndex2)).toBe(-1);
		expect(get(store.currentPage)).toBe('questions');
	});

	test('disabling multiple cascades compare state off', async () => {
		const store = await freshStore();
		store.assessments.set([
			assessment('e1', 'First', [item('q1', 'Question 1')]),
			assessment('e2', 'Second', [item('q2', 'Question 2')])
		]);
		store.examsIndex.set(0);
		store.multiple.set(true);
		store.compareMode.set(true);

		store.multiple.set(false);
		expect(get(store.compareMode)).toBe(false);
		expect(get(store.compareExamIndex1)).toBe(-1);
		expect(get(store.compareExamIndex2)).toBe(-1);
		expect(get(store.currentPage)).toBe('questions');
	});
});

describe('settings', () => {
	test('resetSettings restores the defaults', async () => {
		const store = await freshStore();
		store.showAnswer.set(false);
		store.showInstruction.set(false);
		store.showLetter.set(true);
		store.inzage.set(true);

		store.resetSettings();
		expect(get(store.settings)).toEqual({
			showAnswer: true,
			showInstruction: true,
			showLetter: false,
			inzage: false,
			sort: false
		});
	});
});

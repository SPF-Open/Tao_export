import { describe, expect, test } from 'vitest';
import type { WorkSheet } from 'xlsx';
import { Question } from '../question';

/** A minimal xlsx cell — `parseSheet` only ever reads `.w` (text) off these. */
function cell(value: string) {
	return { v: value, w: value, r: value, t: 's', h: value };
}

/** Build a plain object sheet from `{ "A1": "text", "B1": "text", ... }`. */
function buildSheet(cells: Record<string, string>): WorkSheet {
	const sheet: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(cells)) {
		sheet[key] = cell(value);
	}
	return sheet as WorkSheet;
}

const column = {
	title: 'A',
	prompt: 'B',
	correct: '',
	competency: '',
	indicator: '',
	competencyDescr: '',
	masteryDescr: ''
};
const row = { offset: 1, alternative: 2, skipRow: 0 };

describe('Question.parseSheet — default template with no "correct" column', () => {
	test('marks the first alternative correct for every question, including the last one', () => {
		const sheet = buildSheet({
			A1: 'Q1',
			B1: 'Question 1?',
			B2: 'Q1 Answer A',
			B3: 'Q1 Answer B',
			A4: 'Q2',
			B4: 'Question 2?',
			B5: 'Q2 Answer A',
			B6: 'Q2 Answer B'
		});

		const questions = Question.parseSheet(sheet, column, row);

		expect(questions).toHaveLength(2);

		expect(questions[0].answers).toHaveLength(2);
		expect(questions[0].answers[0].correct).toBe(true);
		expect(questions[0].answers[1].correct).toBe(false);

		// Regression: the last question used to never get its first answer marked correct.
		expect(questions[1].answers).toHaveLength(2);
		expect(questions[1].answers[0].correct).toBe(true);
		expect(questions[1].answers[1].correct).toBe(false);
	});

	test('still works when there is only a single question', () => {
		const sheet = buildSheet({
			A1: 'Q1',
			B1: 'Question 1?',
			B2: 'Q1 Answer A',
			B3: 'Q1 Answer B'
		});

		const questions = Question.parseSheet(sheet, column, row);

		expect(questions).toHaveLength(1);
		expect(questions[0].answers[0].correct).toBe(true);
	});
});

describe('Question.parseSheet — template with an explicit "correct" column', () => {
	test('reads correctness per-row and is unaffected by the last-question fix', () => {
		const sheet = buildSheet({
			A1: 'Q1',
			B1: 'Question 1?',
			B2: 'Q1 Answer A',
			C2: 'x',
			B3: 'Q1 Answer B',
			A4: 'Q2',
			B4: 'Question 2?',
			B5: 'Q2 Answer A',
			B6: 'Q2 Answer B',
			C6: 'x'
		});

		const questions = Question.parseSheet(sheet, { ...column, correct: 'C' }, row);

		expect(questions).toHaveLength(2);
		expect(questions[0].answers[0].correct).toBe(true);
		expect(questions[0].answers[1].correct).toBe(false);

		// Last question's own marker column already worked before the fix.
		expect(questions[1].answers[0].correct).toBe(false);
		expect(questions[1].answers[1].correct).toBe(true);
	});
});

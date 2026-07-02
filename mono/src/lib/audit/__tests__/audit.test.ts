import { describe, expect, it } from 'vitest';
import { matchPositional } from '../matcher';
import { compare } from '../comparator';
import { buildReport } from '../classifier';
import type { QTIQuestion } from '../types';

function q(
	prompt: string,
	answers: Array<[string, boolean]>,
	extra: Partial<QTIQuestion> = {}
): QTIQuestion {
	return {
		id: extra.id ?? prompt,
		title: extra.title,
		prompt,
		answers: answers.map(([text, correct], i) => ({ text, correct, id: `a${i}` })),
		type: extra.type ?? 'QCM',
		metadata: extra.metadata ?? {}
	};
}

describe('matchPositional', () => {
	it('pairs questions by index when counts are equal', () => {
		const excel = [q('Q1', [['a', true], ['b', false]]), q('Q2', [['c', true], ['d', false]])];
		const qti = [q('Q1', [['a', true], ['b', false]]), q('Q2', [['c', true], ['d', false]])];

		const { pairs, unmatchedExcel, unmatchedQTI } = matchPositional(excel, qti);

		expect(pairs).toHaveLength(2);
		expect(pairs[0].excel).toBe(excel[0]);
		expect(pairs[0].qti).toBe(qti[0]);
		expect(unmatchedExcel).toHaveLength(0);
		expect(unmatchedQTI).toHaveLength(0);
	});

	it('reports leftovers when the Excel side is longer', () => {
		const excel = [q('Q1', [['a', true]]), q('Q2', [['b', true]]), q('Q3', [['c', true]])];
		const qti = [q('Q1', [['a', true]]), q('Q2', [['b', true]])];

		const { pairs, unmatchedExcel, unmatchedQTI } = matchPositional(excel, qti);

		expect(pairs).toHaveLength(2);
		expect(unmatchedExcel).toHaveLength(1);
		expect(unmatchedExcel[0].question).toBe(excel[2]);
		expect(unmatchedQTI).toHaveLength(0);
	});
});

describe('compare (QTIQuestion vs QTIQuestion)', () => {
	it('flags answer count mismatch as BLOQUANT', () => {
		const pair = {
			excel: q('Q', [['a', true], ['b', false]]),
			qti: q('Q', [['a', true], ['b', false], ['c', false]]),
			score: 1
		};
		const errors = compare(pair);
		const countErr = errors.find((e) => e.type === 'answer_count_mismatch');
		expect(countErr?.severity).toBe('BLOQUANT');
	});

	it('flags correct-answer position mismatch as MAJEUR', () => {
		const pair = {
			excel: q('Q', [['a', true], ['b', false]]),
			qti: q('Q', [['a', false], ['b', true]]),
			score: 1
		};
		const errors = compare(pair);
		const posErr = errors.find((e) => e.type === 'correct_answer_position_mismatch');
		expect(posErr?.severity).toBe('MAJEUR');
	});

	it('reports no errors for identical questions', () => {
		const pair = {
			excel: q('Same prompt', [['a', true], ['b', false]]),
			qti: q('Same prompt', [['a', true], ['b', false]]),
			score: 1
		};
		expect(compare(pair, { ignoreTitleMismatch: true })).toHaveLength(0);
	});
});

describe('buildReport', () => {
	it('folds unmatched questions into the critical (bloquant) count', () => {
		const pair = {
			excel: q('Q1', [['a', true], ['b', false]]),
			qti: q('Q1', [['a', true], ['b', false]]),
			score: 1
		};
		const report = buildReport(
			[pair],
			[{ pair, errors: [] }],
			[{ question: q('Lonely excel', [['x', true]]), closeMatches: [] }],
			[]
		);

		expect(report.summary.unmatched).toBe(1);
		expect(report.summary.bloquants).toBeGreaterThanOrEqual(1);
	});
});

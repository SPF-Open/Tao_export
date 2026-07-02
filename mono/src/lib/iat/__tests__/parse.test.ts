import { describe, expect, test } from 'vitest';
import { utils, write } from 'xlsx';
import { IatParseError, parseIatWorkbook } from '../parse.js';

type Row = Record<string, string | number | boolean>;

function workbookBuffer(sheets: Record<string, Row[]>): ArrayBuffer {
	const wb = utils.book_new();
	for (const [name, rows] of Object.entries(sheets)) {
		utils.book_append_sheet(wb, utils.json_to_sheet(rows), name);
	}
	return write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

const speedPageRow = (page: number, extra: Row = {}): Row => ({
	Page: page,
	Instruction: 'FALSE',
	duration_mean: 30.5,
	duration_sd: 4.2,
	duration_Q10: 20,
	duration_Q25: 25,
	duration_Q50: 30,
	duration_Q75: 35,
	duration_Q90: 40,
	...extra
});

const questionRow = (page: number, itemRank: number, extra: Row = {}): Row => ({
	TestCode: 'TEST-A',
	Diplome: 'DIP-1',
	nCandidates: 100,
	nProcedures: 1,
	Page: page,
	ItemRank: itemRank,
	correct_pct: 61.5,
	incorrect_pct: 30,
	empty_pct: 5,
	not_seen_pct: 3.5,
	answered_pct: 96.5,
	difficulty: 0.62,
	discr_comp: 0.31,
	discr_test: 0.28,
	d_index_comp: 0.4,
	d_index_test: 0.35,
	alpha_drop_test: 0.8,
	...extra
});

const alternativeRow = (page: number, itemRank: number, choiceId: string, correct: boolean, extra: Row = {}): Row => ({
	TestCode: 'TEST-A',
	Diplome: 'DIP-1',
	nCandidates: 100,
	Page: page,
	ItemRank: itemRank,
	Inter_type: 'choice',
	cardinality: 'single',
	answer_Id: choiceId,
	Answer: `Answer ${choiceId}`,
	correct: correct ? 'TRUE' : 'FALSE',
	chosen_pct: correct ? 60 : 10,
	nAnswers: 100,
	chosen_n: correct ? 60 : 10,
	discr_comp: 0.2,
	discr_test: 0.2,
	...extra
});

describe('parseIatWorkbook', () => {
	test('parses pages, questions and alternatives into the page map', () => {
		const buffer = workbookBuffer({
			Speed_Pages: [speedPageRow(1), speedPageRow(2, { Instruction: 'TRUE' })],
			Questions: [questionRow(1, 1), questionRow(2, 2)],
			Alternatives: ['a', 'b', 'c', 'd'].map((id, i) => alternativeRow(1, 1, id, i === 3))
		});

		const { pages } = parseIatWorkbook(buffer);

		expect(Object.keys(pages)).toEqual(['1', '2']);
		expect(pages[1].duration.mean).toBeCloseTo(30.5);
		expect(pages[2].instruction).toBe(true);
		expect(pages[1].questions).toHaveLength(1);

		const question = pages[1].questions[0];
		expect(question.testCode).toBe('TEST-A');
		expect(question.correct_pct).toBeCloseTo(61.5);
		expect(question.alternatives).toHaveLength(4);
		// Once complete, alternatives are sorted correct-first.
		expect(question.alternatives[0].isCorrect).toBe(true);
		expect(question.alternatives[0].choiceId).toBe('d');
	});

	test('builds per-test summaries with diploma counts', () => {
		const buffer = workbookBuffer({
			Speed_Pages: [speedPageRow(1)],
			Questions: [
				questionRow(1, 1),
				questionRow(1, 2, { Diplome: 'DIP-2', nCandidates: 50 }),
				questionRow(1, 3, { Diplome: 'DIP-2', nCandidates: 50 })
			],
			Alternatives: []
		});

		const { testInfo } = parseIatWorkbook(buffer);

		expect(testInfo).toHaveLength(1);
		expect(testInfo[0].name).toBe('TEST-A');
		expect(testInfo[0].diplome).toEqual([
			{ name: 'DIP-1', candidateNb: 100, questionNb: 1 },
			{ name: 'DIP-2', candidateNb: 50, questionNb: 2 }
		]);
	});

	test('ignores questions and alternatives on unknown pages', () => {
		const buffer = workbookBuffer({
			Speed_Pages: [speedPageRow(1)],
			Questions: [questionRow(9, 1)],
			Alternatives: [alternativeRow(9, 1, 'a', true)]
		});

		const { pages } = parseIatWorkbook(buffer);
		expect(pages[1].questions).toHaveLength(0);
		expect(pages[9]).toBeUndefined();
	});

	test('throws a typed error when required sheets are missing', () => {
		const buffer = workbookBuffer({ Questions: [questionRow(1, 1)] });

		expect(() => parseIatWorkbook(buffer)).toThrow(IatParseError);
		expect(() => parseIatWorkbook(buffer)).toThrow(/Speed_Pages.*Alternatives/);
	});

	test('throws on data that is not a workbook at all', () => {
		expect(() => parseIatWorkbook(new Uint8Array([1, 2, 3]).buffer)).toThrow();
	});
});

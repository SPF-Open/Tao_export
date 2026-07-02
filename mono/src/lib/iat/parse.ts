import { read, utils } from 'xlsx';
import type { Alternative, PageInfo, Question, TestInfo } from './types.js';

/** Raised when the workbook does not look like an IAT stats export. */
export class IatParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'IatParseError';
	}
}

/** Row shape of the `Speed_Pages` sheet (columns actually consumed). */
interface SpeedPageRow {
	Page: number;
	Instruction?: string;
	duration_mean: number;
	duration_sd: number;
	duration_Q10: number;
	duration_Q25: number;
	duration_Q50: number;
	duration_Q75: number;
	duration_Q90: number;
}

/** Row shape of the `Questions` sheet. */
interface QuestionRow {
	TestCode: string;
	Diplome: string;
	nCandidates: number;
	nProcedures: number;
	Page: number;
	ItemRank: number;
	correct_pct: number;
	incorrect_pct: number;
	empty_pct: number;
	not_seen_pct: number;
	answered_pct: number;
	difficulty: number;
	discr_comp: number;
	discr_test: number;
	d_index_comp: number;
	d_index_test: number;
	alpha_drop_test: number;
}

/** Row shape of the `Alternatives` sheet. */
interface AlternativeRow {
	TestCode: string;
	Diplome: string;
	nCandidates: number;
	Page: number;
	ItemRank: number;
	Inter_type: string;
	cardinality: string;
	answer_Id: string;
	Answer: string;
	correct?: string;
	chosen_pct: number;
	nAnswers: number;
	chosen_n: number;
	discr_comp: number;
	discr_test: number;
}

export interface IatParseResult {
	pages: Record<number, PageInfo>;
	testInfo: TestInfo[];
}

const REQUIRED_SHEETS = ['Speed_Pages', 'Questions', 'Alternatives'] as const;

/**
 * Parses an IAT statistics workbook (`Speed_Pages` / `Questions` /
 * `Alternatives` sheets) into per-page question stats and per-test summaries.
 * Throws {@link IatParseError} when a required sheet is missing.
 */
export function parseIatWorkbook(data: ArrayBuffer): IatParseResult {
	const workbook = read(data, { type: 'array' });

	const missing = REQUIRED_SHEETS.filter((name) => !workbook.Sheets[name]);
	if (missing.length > 0) {
		throw new IatParseError(`Missing sheet${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`);
	}

	const speedPagesData = utils.sheet_to_json<SpeedPageRow>(workbook.Sheets['Speed_Pages']);
	const questionsData = utils.sheet_to_json<QuestionRow>(workbook.Sheets['Questions']);
	const alternativesData = utils.sheet_to_json<AlternativeRow>(workbook.Sheets['Alternatives']);

	const pages: Record<number, PageInfo> = {};

	for (const row of speedPagesData) {
		const page = row.Page;
		if (!pages[page]) {
			pages[page] = {
				page,
				instruction: row.Instruction === 'TRUE',
				duration: {
					mean: row.duration_mean,
					sd: row.duration_sd,
					q10: row.duration_Q10,
					q25: row.duration_Q25,
					q50: row.duration_Q50,
					q75: row.duration_Q75,
					q90: row.duration_Q90
				},
				questions: []
			};
		}
	}

	for (const row of questionsData) {
		const page = row.Page;
		if (!pages[page]) continue;

		const question: Question = {
			testCode: row.TestCode,
			diplome: row.Diplome,
			nCandidates: row.nCandidates,
			nProcedures: row.nProcedures,
			page: row.Page,
			itemRank: row.ItemRank,
			correct_pct: row.correct_pct,
			incorrect_pct: row.incorrect_pct,
			empty_pct: row.empty_pct,
			not_seen_pct: row.not_seen_pct,
			answered_pct: row.answered_pct,
			difficulty: row.difficulty,
			discr_comp: row.discr_comp,
			discr_test: row.discr_test,
			d_index_comp: row.d_index_comp,
			d_index_test: row.d_index_test,
			alpha_drop_test: row.alpha_drop_test,
			alternatives: []
		};

		pages[page].questions.push(question);
	}

	for (const row of alternativesData) {
		const page = row.Page;
		if (!pages[page]) continue;

		let question = pages[page].questions.find(
			(q) => q.itemRank === row.ItemRank && q.diplome === row.Diplome
		);
		if (!question) continue;

		// The same item can appear once per diploma; once the first copy has its
		// four alternatives, attach further rows to the last matching copy.
		if (question.alternatives.length > 3) {
			question = pages[page].questions.findLast(
				(q) => q.itemRank === row.ItemRank && q.diplome === row.Diplome
			);
		}
		if (!question) continue;

		const alternative: Alternative = {
			testCode: row.TestCode,
			diplome: row.Diplome,
			nCandidates: row.nCandidates,
			page: row.Page,
			itemRank: row.ItemRank,
			interactionType: row.Inter_type,
			interactionMode: row.cardinality,
			choiceId: row.answer_Id,
			text: row.Answer,
			isCorrect: row.correct === 'TRUE',
			pct: row.chosen_pct,
			nAnswers: row.nAnswers,
			chosen: row.chosen_n,
			discr_comp: row.discr_comp,
			discr_test: row.discr_test
		};

		question.alternatives.push(alternative);
		if (question.alternatives.length === 4) {
			question.alternatives.sort((a, b) =>
				a.isCorrect === b.isCorrect ? 0 : a.isCorrect ? -1 : 1
			);
		}
	}

	return { pages, testInfo: buildTestInfo(questionsData) };
}

function buildTestInfo(questionsData: QuestionRow[]): TestInfo[] {
	const testMap = new Map<
		string,
		{
			name: string;
			diplomeMap: Map<string, { name: string; candidateNb: number; questionNb: number }>;
			page: number;
			question: number;
		}
	>();

	for (const row of questionsData) {
		const testCode = row.TestCode;
		if (!testMap.has(testCode)) {
			testMap.set(testCode, {
				name: testCode,
				diplomeMap: new Map(),
				page: row.Page,
				question: row.ItemRank
			});
		}
		const entry = testMap.get(testCode)!;
		if (!entry.diplomeMap.has(row.Diplome)) {
			entry.diplomeMap.set(row.Diplome, {
				name: row.Diplome,
				candidateNb: row.nCandidates,
				questionNb: 0
			});
		}
		entry.diplomeMap.get(row.Diplome)!.questionNb += 1;

		if (row.Page < entry.page) entry.page = row.Page;
		if (row.ItemRank < entry.question) entry.question = row.ItemRank;
	}

	return Array.from(testMap.values()).map((entry) => ({
		name: entry.name,
		diplome: Array.from(entry.diplomeMap.values()),
		page: entry.page,
		question: entry.question
	}));
}

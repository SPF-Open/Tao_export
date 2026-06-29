import type { ExcelConfig, ExcelQuestion } from '$lib/audit/types.js';
import type { IngestPayload, LibraryCompetency } from '../types.js';

/**
 * Enriches a ZIP-derived {@link IngestPayload} with competency data from
 * matched Excel rows.
 *
 * Matching is intentionally simple: normalize + exact title match, then
 * fall back to normalized prompt-prefix match. No fuzzy scoring to avoid
 * false positives in the merge path.
 *
 * The input `zipPayload` is never mutated — a new payload object is returned
 * so the caller's `lastPayload` cache remains intact.
 */
export function mergeExcelIntoPayload(
	zipPayload: IngestPayload,
	excelQuestions: ExcelQuestion[],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_config: ExcelConfig
): IngestPayload {
	const titleMap = new Map<string, ExcelQuestion>();
	const promptMap = new Map<string, ExcelQuestion>();

	for (const q of excelQuestions) {
		if (q.title) titleMap.set(normalizeForMatch(q.title), q);
		const normPrompt = normalizeForMatch(q.prompt).slice(0, 120);
		if (normPrompt) promptMap.set(normPrompt, q);
	}

	const questions = zipPayload.questions.map((q) => {
		const normTitle = normalizeForMatch(q.title);
		const normPrompt = normalizeForMatch(q.promptText).slice(0, 120);

		const match = titleMap.get(normTitle) ?? promptMap.get(normPrompt);
		if (!match) return { ...q };

		const competencies = toCompetencies(match);
		return { ...q, competencies };
	});

	return { ...zipPayload, questions };
}

function normalizeForMatch(text: string): string {
	return text
		.toLowerCase()
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function toCompetencies(q: ExcelQuestion): LibraryCompetency[] {
	const code = q.competency?.trim() ?? '';
	const indicator = q.indicator?.trim() ?? '';
	const dimension = q.dimension?.trim() ?? '';
	if (!code && !indicator && !dimension) return [];
	return [
		{
			code: code || indicator,
			label: dimension,
			description: '',
			indicator
		}
	];
}

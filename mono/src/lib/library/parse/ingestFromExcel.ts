import { getExcelSheets, parseExcel } from '$lib/audit/excel-parser.js';
import type { ExcelConfig, ExcelQuestion } from '$lib/audit/types.js';
import type { IngestPayload, IngestQuestion, LibraryAnswer, LibraryCompetency } from '../types.js';
import { sha256Hex } from './hash.js';

/**
 * Main-thread entry point: converts an uploaded Excel `File` + `ExcelConfig`
 * into a normalized, plain-serializable {@link IngestPayload} that the worker
 * can write to SQLite via the existing `test:ingestZip` command.
 *
 * Runs on the main thread (same as `ingestFromZip.ts`) because `parseExcel`
 * uses the XLSX library which expects an ArrayBuffer from the main thread.
 */
export async function buildIngestPayloadFromExcel(
	file: File,
	config: ExcelConfig,
	sheetName?: string
): Promise<IngestPayload> {
	const bytes = await file.arrayBuffer();
	const sourceHash = await sha256Hex(bytes);

	const sheetNames = getExcelSheets(bytes);
	if (sheetNames.length === 0) throw new Error('No sheets found in Excel file');

	const resolvedSheet = sheetName && sheetNames.includes(sheetName) ? sheetName : sheetNames[0];
	const excelQuestions = await parseExcel(bytes, config, resolvedSheet);

	const questions: IngestQuestion[] = excelQuestions.map((q) =>
		toIngestQuestion(q, resolvedSheet)
	);

	return {
		filename: file.name,
		sourceHash,
		assessmentId: `excel-${sourceHash.slice(0, 8)}`,
		title: file.name.replace(/\.[^.]+$/, ''),
		language: '',
		metadata: { source: 'excel', config } as Record<string, unknown>,
		questions,
		assets: []
	};
}

function toIngestQuestion(q: ExcelQuestion, sheetName: string): IngestQuestion {
	const answers: LibraryAnswer[] = q.answers.map((text, i) => ({
		identifier: `choice-${i}`,
		position: i,
		textHtml: `<p>${escapeHtml(text)}</p>`,
		textText: text,
		score: i === q.correctAnswerIndex ? 1 : 0,
		correct: i === q.correctAnswerIndex
	}));

	const competencies = toCompetencies(q);
	const promptHtml = `<p>${escapeHtml(q.prompt)}</p>`;

	return {
		qtiIdentifier: `excel-row-${q.rowIndex}`,
		title: q.title ? q.title.slice(0, 200) : q.prompt.slice(0, 80),
		type: 'single-choice',
		promptHtml,
		promptText: q.prompt,
		answerText: q.answers.join(' • '),
		language: '',
		rawXml: '',
		metadata: { excelRow: q.rowIndex + 1, sheetName } as Record<string, unknown>,
		answers,
		competencies,
		assetRefs: []
	};
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

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

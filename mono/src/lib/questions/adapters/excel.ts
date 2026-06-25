import * as XLSX from 'xlsx';
import { parseExcel } from '$lib/export/audit/excel-parser.js';
import type { ExcelConfig, ExcelQuestion } from '$lib/export/audit/types.js';
import type { Assessment, AssessmentItem, Section } from '../types.js';
import type { AssessmentAdapter, AdapterReadOptions, AdapterWriteOptions } from './base.js';
import { DEFAULT_CONFIG } from '$lib/export/audit/config.js';

const DEFAULT_WRITE_CONFIG: ExcelConfig = DEFAULT_CONFIG;

export class ExcelAdapter implements AssessmentAdapter {
	readonly name = 'Excel';

	async read(source: File | ArrayBuffer, options?: AdapterReadOptions): Promise<Assessment> {
		const buffer =
			source instanceof File ? await source.arrayBuffer() : (source as ArrayBuffer);

		const config: ExcelConfig = DEFAULT_WRITE_CONFIG;
		const excelQuestions = await parseExcel(buffer, config, options?.sheetName);

		const items = excelQuestions.map(excelQuestionToItem);

		const section: Section = {
			id: 'main',
			title: 'Questions',
			items
		};

		return {
			id: options?.assessmentId ?? 'excel-import',
			title: options?.assessmentTitle ?? 'Excel Import',
			metadata: { tools: {} },
			sections: [section],
			assets: {}
		};
	}

	async write(assessment: Assessment, options?: AdapterWriteOptions): Promise<Blob> {
		const config: ExcelConfig = options?.excelConfig ?? DEFAULT_WRITE_CONFIG;
		const items = assessment.sections.flatMap((s) => s.items).filter((i) => i.type !== 'instruction');

		const wb = XLSX.utils.book_new();
		const rows: (string | number | undefined)[][] = [];

		// Header row
		const headerRow: string[] = [];
		if (config.columns.title) headerRow[colIndex(config.columns.title)] = 'Titre';
		headerRow[colIndex(config.columns.prompt)] = 'Question';
		if (config.answerLayout === 'spread_columns' && Array.isArray(config.columns.answers)) {
			for (let i = 0; i < config.columns.answers.length; i++) {
				headerRow[colIndex(config.columns.answers[i])] = `Réponse ${i + 1}`;
			}
		} else if (config.answerLayout === 'same_column' && typeof config.columns.answers === 'string') {
			headerRow[colIndex(config.columns.answers)] = 'Réponse';
			if (config.columns.answerMarker) headerRow[colIndex(config.columns.answerMarker)] = 'Correct';
		}
		if (config.columns.competency) headerRow[colIndex(config.columns.competency)] = 'Compétence';
		if (config.columns.indicator) headerRow[colIndex(config.columns.indicator)] = 'Indicateur';

		// Pad rows to rowOffset
		for (let i = 0; i < config.rowOffset; i++) {
			rows.push(i === 0 ? headerRow : []);
		}

		for (const item of items) {
			const options = item.responses?.[0]?.options ?? [];
			const promptText = stripHtml(item.content.html ?? '');
			const titleText = item.title;

			if (config.answerLayout === 'spread_columns') {
				const row: (string | undefined)[] = [];
				if (config.columns.title) row[colIndex(config.columns.title)] = titleText;
				row[colIndex(config.columns.prompt)] = promptText;
				if (Array.isArray(config.columns.answers)) {
					for (let i = 0; i < config.columns.answers.length; i++) {
						row[colIndex(config.columns.answers[i])] = stripHtml(options[i]?.content?.html ?? '');
					}
				}
				if (config.columns.competency)
					row[colIndex(config.columns.competency)] = item.metadata?.competency ?? '';
				if (config.columns.indicator)
					row[colIndex(config.columns.indicator)] = item.metadata?.indicator ?? '';
				rows.push(row);
				for (let s = 0; s < config.skipRows; s++) rows.push([]);
			} else {
				// same_column: prompt row + answer rows
				const promptRow: (string | undefined)[] = [];
				if (config.columns.title) promptRow[colIndex(config.columns.title)] = titleText;
				promptRow[colIndex(config.columns.prompt)] = promptText;
				if (config.columns.competency)
					promptRow[colIndex(config.columns.competency)] = item.metadata?.competency ?? '';
				if (config.columns.indicator)
					promptRow[colIndex(config.columns.indicator)] = item.metadata?.indicator ?? '';
				rows.push(promptRow);

				for (const opt of options) {
					const ansRow: (string | undefined)[] = [];
					if (typeof config.columns.answers === 'string') {
						ansRow[colIndex(config.columns.answers)] = stripHtml(opt.content?.html ?? '');
					}
					if (config.columns.answerMarker) {
						ansRow[colIndex(config.columns.answerMarker)] = opt.correct ? 'X' : '';
					}
					rows.push(ansRow);
				}
				for (let s = 0; s < config.skipRows; s++) rows.push([]);
			}
		}

		const ws = XLSX.utils.aoa_to_sheet(rows);
		XLSX.utils.book_append_sheet(wb, ws, 'Questions');
		const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
		return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
	}
}

function excelQuestionToItem(eq: ExcelQuestion): AssessmentItem {
	const options = eq.answers.map((text, i) => ({
		id: `choice_${i + 1}`,
		content: { html: text, text },
		correct: i === eq.correctAnswerIndex
	}));

	const correctId = `choice_${eq.correctAnswerIndex + 1}`;
	const rules = eq.answers.map((_, i) => ({
		answerId: `choice_${i + 1}`,
		score: i === eq.correctAnswerIndex ? 3 : -1
	}));

	return {
		id: `row_${eq.rowIndex}`,
		title: eq.title ?? '',
		type: 'single-choice',
		content: { html: eq.prompt, text: eq.prompt },
		responses: [
			{
				id: 'RESPONSE',
				cardinality: 'single',
				baseType: 'identifier',
				correctAnswers: [correctId],
				options,
				mapping: Object.fromEntries(rules.map((r) => [r.answerId, r.score]))
			}
		],
		scoring: {
			maxScore: 3,
			rules
		},
		metadata: {
			sourceRow: eq.rowIndex,
			competency: eq.competency,
			indicator: eq.indicator
		}
	};
}

function colIndex(col: string): number {
	let n = 0;
	for (const ch of col.toUpperCase()) {
		n = n * 26 + (ch.charCodeAt(0) - 64);
	}
	return n - 1;
}

function stripHtml(html: string): string {
	return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

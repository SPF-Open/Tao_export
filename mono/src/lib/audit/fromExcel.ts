import * as XLSX from 'xlsx';
import type { AssessmentItem } from '$lib/questions/types.js';
import { Question } from '$lib/import/helper/question';
import { qcmsToAssessmentItems } from '$lib/import/helper/toQuestionType';
import { bindingTemplate, type TemplateColumn } from '$lib/import/helper/store';

/**
 * Column/row binding accepted by the import parser `Question.parseSheet`.
 * Mirrors the shape used by the Import route (`lib/import/helper/store.ts`
 * `bindingTemplate`) so the audit parses Excel with the exact same pipeline.
 */
export interface ExcelBinding {
	column: {
		title: string;
		prompt: string;
		correct: string;
		competency: string;
		indicator: string;
		competencyDescr: string;
		masteryDescr: string;
	};
	row: { offset: number; alternative: number; skipRow: number };
}

/**
 * Resolve a full {@link ExcelBinding} (all fields as strings) from one of the
 * Import route's templates (`bindingTemplate`). The same templates power the
 * Import sidebar, so the audit and import stay in lock-step.
 */
export function bindingFromTemplate(template: TemplateColumn): ExcelBinding {
	const b = bindingTemplate[template];
	return {
		column: {
			title: b.column.title ?? '',
			prompt: b.column.prompt ?? '',
			correct: b.column.correct ?? '',
			competency: b.column.competency ?? '',
			indicator: b.column.indicator ?? '',
			competencyDescr: b.column.competencyDescr ?? '',
			masteryDescr: b.column.masteryDescr ?? ''
		},
		row: { ...b.row }
	};
}

/**
 * Build an {@link ExcelBinding} from manually entered column letters/row
 * layout (the audit-side equivalent of Import's `TemplateColumn.OTHER`).
 */
export function customBinding(
	columns: ExcelBinding['column'],
	row: ExcelBinding['row']
): ExcelBinding {
	return { column: { ...columns }, row: { ...row } };
}

/** Matches leading example/instruction questions ("Voorbeeld" / "Exemple"). */
const EXAMPLE_RE = /^\s*(voorbeeld|exemple)/i;

/**
 * Parse an uploaded Excel workbook into normalized {@link AssessmentItem}s using
 * the **same** functions as the Import route (`Question.parseSheet` +
 * `qcmsToAssessmentItems`). This is the single point of reuse — no parsing logic
 * is duplicated from the import flow.
 *
 * Leading example rows ("Voorbeeld"/"Exemple") are dropped so the question
 * sequence lines up positionally with the TAO QTI export (which filters
 * instruction items on its side).
 */
export function parseExcelToAssessmentItems(
	buffer: ArrayBuffer,
	binding: ExcelBinding,
	sheetName?: string
): AssessmentItem[] {
	const wb = XLSX.read(buffer);
	const selectedSheet = sheetName && wb.SheetNames.includes(sheetName) ? sheetName : wb.SheetNames[0];
	if (!selectedSheet) throw new Error('No sheets found in Excel file');

	const sheet = wb.Sheets[selectedSheet];
	const qcms = Question.parseSheet(sheet, binding.column, binding.row);
	const items = qcmsToAssessmentItems(qcms);

	return items.filter((item) => {
		const title = item.title ?? '';
		const prompt = item.content.text ?? item.content.html ?? '';
		return !EXAMPLE_RE.test(title) && !EXAMPLE_RE.test(prompt);
	});
}

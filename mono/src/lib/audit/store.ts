import { writable } from 'svelte/store';
import type { AssessmentItem } from '$lib/questions/types.js';
import type { AuditReport } from './types';
import { TemplateColumn } from '$lib/import/helper/store';

/**
 * State for the standalone /audit route. The audit compares the QTI questions
 * parsed from a TAO ZIP (`auditItems`) against an uploaded Excel workbook, which
 * is parsed with the same Import-route templates (`auditTemplate`).
 */

/** QTI questions parsed from the uploaded TAO export. */
export const auditItems = writable<AssessmentItem[]>([]);
/** Filename of the loaded TAO ZIP (for the sidebar badge). */
export const auditZipName = writable<string>('');

export const auditLoading = writable<boolean>(false);
export const auditReport = writable<AuditReport | null>(null);

/** Import-route template used to parse the Excel source (FIN by default). */
export const auditTemplate = writable<TemplateColumn>(TemplateColumn.FIN);
/** Skip question-title mismatch checks (titles are real in Import output). */
export const auditIgnoreTitle = writable<boolean>(false);

/** Manual column letters used when `auditTemplate` is `TemplateColumn.OTHER`. */
export const auditCustomColumns = writable({
	title: '',
	prompt: '',
	correct: '',
	competency: '',
	indicator: '',
	competencyDescr: '',
	masteryDescr: '',
});
/** Manual row layout used when `auditTemplate` is `TemplateColumn.OTHER`. */
export const auditCustomRow = writable({ offset: 0, alternative: 4, skipRow: 0 });

/** Filename of the loaded Excel workbook. */
export const auditFilename = writable<string>('');
export const auditError = writable<string | null>(null);

/** Clears the run state (report/config/excel) but keeps the loaded ZIP. */
export function resetAudit(): void {
	auditLoading.set(false);
	auditReport.set(null);
	auditFilename.set('');
	auditError.set(null);
	auditTemplate.set(TemplateColumn.FIN);
	auditIgnoreTitle.set(false);
	auditCustomColumns.set({
		title: '',
		prompt: '',
		correct: '',
		competency: '',
		indicator: '',
		competencyDescr: '',
		masteryDescr: '',
	});
	auditCustomRow.set({ offset: 0, alternative: 4, skipRow: 0 });
}

/** Clears everything, including the parsed QTI questions and ZIP name. */
export function resetAuditAll(): void {
	resetAudit();
	auditItems.set([]);
	auditZipName.set('');
}

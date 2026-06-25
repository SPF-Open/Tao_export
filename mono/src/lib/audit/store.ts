import { writable } from 'svelte/store';
import type { AssessmentItem } from '$lib/questions/types.js';
import type { AuditReport, ExcelConfig } from './types';
import { DEFAULT_CONFIG } from './config';

/**
 * State for the standalone /audit route. The audit compares the QTI questions
 * parsed from a TAO ZIP (`auditItems`) against an uploaded Excel workbook.
 */

/** QTI questions parsed from the uploaded TAO export. */
export const auditItems = writable<AssessmentItem[]>([]);
/** Filename of the loaded TAO ZIP (for the sidebar badge). */
export const auditZipName = writable<string>('');

export const auditLoading = writable<boolean>(false);
export const auditReport = writable<AuditReport | null>(null);
export const auditConfig = writable<ExcelConfig>(DEFAULT_CONFIG);
/** Filename of the loaded Excel workbook. */
export const auditFilename = writable<string>('');
export const auditError = writable<string | null>(null);

/** Clears the run state (report/config/excel) but keeps the loaded ZIP. */
export function resetAudit(): void {
	auditLoading.set(false);
	auditReport.set(null);
	auditFilename.set('');
	auditError.set(null);
	auditConfig.set(DEFAULT_CONFIG);
}

/** Clears everything, including the parsed QTI questions and ZIP name. */
export function resetAuditAll(): void {
	resetAudit();
	auditItems.set([]);
	auditZipName.set('');
}

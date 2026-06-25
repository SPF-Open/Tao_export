import type { Assessment } from '../types.js';
import type { ExcelConfig } from '$lib/export/audit/types.js';

export interface AdapterReadOptions {
	sheetName?: string;
	assessmentId?: string;
	assessmentTitle?: string;
}

export interface AdapterWriteOptions {
	filename?: string;
	lang?: string;
	excelConfig?: ExcelConfig;
}

export interface AssessmentAdapter {
	readonly name: string;
	read(source: ArrayBuffer | File, options?: AdapterReadOptions): Promise<Assessment>;
	write(assessment: Assessment, options?: AdapterWriteOptions): Promise<Blob>;
}

export class AdapterWriteNotSupportedError extends Error {
	constructor(adapterName: string) {
		super(
			`The ${adapterName} adapter does not support writing. ` +
				`Export to Excel, CSV, or JSON instead.`
		);
		this.name = 'AdapterWriteNotSupportedError';
	}
}

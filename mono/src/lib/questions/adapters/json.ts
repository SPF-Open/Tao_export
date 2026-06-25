import type { Assessment } from '../types.js';
import type { AssessmentAdapter, AdapterReadOptions, AdapterWriteOptions } from './base.js';

export class JsonAdapter implements AssessmentAdapter {
	readonly name = 'JSON';

	async read(source: File | ArrayBuffer, options?: AdapterReadOptions): Promise<Assessment> {
		const text =
			source instanceof File
				? await source.text()
				: new TextDecoder().decode(source instanceof ArrayBuffer ? source : source);

		const data = JSON.parse(text) as Assessment;

		if (options?.assessmentId) data.id = options.assessmentId;
		if (options?.assessmentTitle) data.title = options.assessmentTitle;

		return data;
	}

	async write(assessment: Assessment, _options?: AdapterWriteOptions): Promise<Blob> {
		const serializable = {
			...assessment,
			assets: Object.fromEntries(
				Object.entries(assessment.assets).map(([k, v]) => [k, { ...v, blob: undefined }])
			)
		};
		const json = JSON.stringify(serializable, null, 2);
		return new Blob([json], { type: 'application/json' });
	}
}

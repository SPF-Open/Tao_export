import type { IngestPayload, IngestQuestion } from '../types.js';

/**
 * Hand-built ingest payloads used by the DB behaviour tests. These mirror what
 * `parse/ingestFromZip.ts` produces from a TAO ZIP, but without needing a DOM
 * (unavailable under `bun test`). QTI/XML parsing itself is covered by the
 * browser smoke test.
 */

function qcm(
	id: string,
	prompt: string,
	choices: { id: string; text: string; correct: boolean; score?: number }[]
): IngestQuestion {
	return {
		qtiIdentifier: id,
		title: `Question ${id}`,
		type: 'single-choice',
		promptHtml: `<p>${prompt}</p>`,
		promptText: prompt,
		answerText: choices.map((c) => c.text).join(' • '),
		language: 'fr',
		rawXml: `<assessmentItem identifier="${id}"/>`,
		metadata: { source: 'fixture' },
		answers: choices.map((c, i) => ({
			identifier: c.id,
			position: i,
			textHtml: `<p>${c.text}</p>`,
			textText: c.text,
			score: c.score ?? null,
			correct: c.correct
		})),
		competencies: [],
		assetRefs: []
	};
}

export function qcmPayload(): IngestPayload {
	const capital = qcm('i-capital', 'What is the capital of France?', [
		{ id: 'A', text: 'Paris', correct: true, score: 1 },
		{ id: 'B', text: 'Lyon', correct: false, score: 0 },
		{ id: 'C', text: 'Marseille', correct: false, score: 0 }
	]);
	capital.competencies = [
		{ code: 'GEO.1', label: 'Geography', description: 'World capitals', indicator: 'IND.42' }
	];

	const open: IngestQuestion = {
		qtiIdentifier: 'i-essay',
		title: 'Essay on photosynthesis',
		type: 'text',
		promptHtml: '<p>Explain photosynthesis in your own words.</p>',
		promptText: 'Explain photosynthesis in your own words.',
		answerText: '',
		language: 'fr',
		rawXml: '<assessmentItem identifier="i-essay"/>',
		metadata: {},
		answers: [],
		competencies: [
			{ code: 'BIO.3', label: 'Biology', description: 'Plant processes', indicator: 'IND.7' }
		],
		assetRefs: []
	};

	const instruction: IngestQuestion = {
		qtiIdentifier: 'i-intro',
		title: 'Read carefully',
		type: 'instruction',
		promptHtml: '<p>Read each question carefully before answering.</p>',
		promptText: 'Read each question carefully before answering.',
		answerText: '',
		language: 'fr',
		rawXml: '<assessmentItem identifier="i-intro"/>',
		metadata: {},
		answers: [],
		competencies: [],
		assetRefs: []
	};

	return {
		filename: 'biology-exam.zip',
		sourceHash: 'hash-aaa',
		assessmentId: 'TEST-001',
		title: 'Biology Exam',
		language: 'fr',
		metadata: { toolName: 'tao' },
		questions: [capital, open, instruction],
		assets: []
	};
}

/** Same title as {@link qcmPayload} but a different source hash → new version. */
export function changedPayload(): IngestPayload {
	const base = qcmPayload();
	base.sourceHash = 'hash-bbb';
	base.questions = base.questions.slice(0, 1);
	return base;
}

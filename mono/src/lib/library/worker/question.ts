import type { Database } from '@sqlite.org/sqlite-wasm';
import type { ItemType } from '$lib/questions/types.js';
import type {
	LibraryAnswer,
	LibraryAssetBlob,
	LibraryCompetency,
	LibraryQuestion
} from '../types.js';

/** Hydrates a single question with its answers, competencies and asset refs. */
export function getQuestion(db: Database, id: number): LibraryQuestion {
	const row = db.selectObject(
		`SELECT q.*, t.title AS test_title FROM questions q
			JOIN tests t ON t.id = q.test_id
			WHERE q.id = ?`,
		[id]
	);
	if (!row) throw new Error(`Question ${id} not found`);

	const answers: LibraryAnswer[] = db
		.selectObjects(
			`SELECT identifier, position, text_html, text_text, score, is_correct
				FROM answers WHERE question_id = ? ORDER BY position`,
			[id]
		)
		.map((a) => ({
			identifier: String(a.identifier ?? ''),
			position: Number(a.position ?? 0),
			textHtml: String(a.text_html ?? ''),
			textText: String(a.text_text ?? ''),
			score: a.score == null ? null : Number(a.score),
			correct: Number(a.is_correct ?? 0) === 1
		}));

	const competencies: LibraryCompetency[] = db
		.selectObjects(
			`SELECT c.code, c.label, c.description, qc.indicator
				FROM question_competencies qc
				JOIN competencies c ON c.id = qc.competency_id
				WHERE qc.question_id = ?`,
			[id]
		)
		.map((c) => ({
			code: String(c.code ?? ''),
			label: String(c.label ?? ''),
			description: String(c.description ?? ''),
			indicator: String(c.indicator ?? '')
		}));

	const assetRefs = db
		.selectValues('SELECT path FROM assets WHERE question_id = ?', [id])
		.map((v) => String(v));

	let metadata: Record<string, unknown> = {};
	try {
		metadata = JSON.parse(String(row.metadata_json ?? '{}'));
	} catch {
		metadata = {};
	}

	return {
		id: Number(row.id),
		testId: Number(row.test_id),
		testTitle: String(row.test_title ?? ''),
		qtiIdentifier: String(row.qti_identifier ?? ''),
		title: String(row.title ?? ''),
		type: String(row.type ?? 'unknown') as ItemType,
		promptHtml: String(row.prompt_html ?? ''),
		promptText: String(row.prompt_text ?? ''),
		answerText: String(row.answer_text ?? ''),
		language: String(row.language ?? ''),
		rawXml: String(row.raw_xml ?? ''),
		metadata,
		answers,
		competencies,
		assetRefs
	};
}

/** Returns the raw bytes of every asset attached to a question. */
export function getQuestionAssets(db: Database, id: number): LibraryAssetBlob[] {
	const rows = db.selectObjects(
		'SELECT path, mime, bytes FROM assets WHERE question_id = ?',
		[id]
	);
	return rows.map((r) => ({
		path: String(r.path ?? ''),
		mime: String(r.mime ?? 'application/octet-stream'),
		bytes: r.bytes instanceof Uint8Array ? r.bytes : new Uint8Array()
	}));
}

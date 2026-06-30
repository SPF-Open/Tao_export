import type { Database } from '@sqlite.org/sqlite-wasm';
import type { ItemType } from '$lib/questions/types.js';
import type {
	LibraryAnswer,
	LibraryAssetBlob,
	LibraryFakeExam,
	LibraryFakeExamItem,
	LibraryFakeExamSummary
} from '../types.js';

/**
 * CRUD for hand-built "fake exams" — exams assembled in the library UI from
 * existing questions, kept in their own tables (`fake_exams`,
 * `fake_exam_items`, `fake_exam_assets`) entirely separate from the imported
 * `tests`/`questions` data. Items snapshot question content (and copy asset
 * bytes) at add-time, so a fake exam stays intact even if its source question
 * or test is later deleted or re-imported.
 */

function nowIso(): string {
	return new Date().toISOString();
}

export function listFakeExams(db: Database): LibraryFakeExamSummary[] {
	return db
		.selectObjects(
			`SELECT e.id, e.title, e.language, e.created_at, e.updated_at,
				(SELECT COUNT(*) FROM fake_exam_items i WHERE i.fake_exam_id = e.id) AS item_count
				FROM fake_exams e ORDER BY e.updated_at DESC`
		)
		.map((r) => ({
			id: Number(r.id),
			title: String(r.title ?? ''),
			language: String(r.language ?? ''),
			itemCount: Number(r.item_count ?? 0),
			createdAt: String(r.created_at ?? ''),
			updatedAt: String(r.updated_at ?? '')
		}));
}

function getItems(db: Database, examId: number): LibraryFakeExamItem[] {
	const rows = db.selectObjects(
		`SELECT id, position, source_question_id, title, type, prompt_html, prompt_text, answers_json, metadata_json
			FROM fake_exam_items WHERE fake_exam_id = ? ORDER BY position`,
		[examId]
	);
	return rows.map((r) => {
		let answers: LibraryAnswer[] = [];
		try {
			answers = JSON.parse(String(r.answers_json ?? '[]'));
		} catch {
			answers = [];
		}
		let metadata: Record<string, unknown> = {};
		try {
			metadata = JSON.parse(String(r.metadata_json ?? '{}'));
		} catch {
			metadata = {};
		}
		const assetRefs = db
			.selectValues('SELECT path FROM fake_exam_assets WHERE fake_exam_item_id = ?', [r.id])
			.map((v) => String(v));
		return {
			id: Number(r.id),
			position: Number(r.position ?? 0),
			sourceQuestionId: r.source_question_id == null ? null : Number(r.source_question_id),
			title: String(r.title ?? ''),
			type: String(r.type ?? 'unknown') as ItemType,
			promptHtml: String(r.prompt_html ?? ''),
			promptText: String(r.prompt_text ?? ''),
			answers,
			metadata,
			assetRefs
		};
	});
}

export function getFakeExam(db: Database, id: number): LibraryFakeExam {
	const row = db.selectObject('SELECT * FROM fake_exams WHERE id = ?', [id]);
	if (!row) throw new Error(`Fake exam ${id} not found`);
	return {
		id: Number(row.id),
		title: String(row.title ?? ''),
		language: String(row.language ?? ''),
		createdAt: String(row.created_at ?? ''),
		updatedAt: String(row.updated_at ?? ''),
		items: getItems(db, id)
	};
}

export function createFakeExam(
	db: Database,
	opts: { title: string; language?: string }
): LibraryFakeExam {
	const ts = nowIso();
	db.exec({
		sql: `INSERT INTO fake_exams (title, language, created_at, updated_at) VALUES (?, ?, ?, ?)`,
		bind: [opts.title, opts.language ?? '', ts, ts]
	});
	const id = Number(db.selectValue('SELECT last_insert_rowid()'));
	return getFakeExam(db, id);
}

function touchExam(db: Database, id: number): void {
	db.exec({ sql: 'UPDATE fake_exams SET updated_at = ? WHERE id = ?', bind: [nowIso(), id] });
}

export function renameFakeExam(db: Database, id: number, title: string): LibraryFakeExam {
	db.exec({
		sql: 'UPDATE fake_exams SET title = ?, updated_at = ? WHERE id = ?',
		bind: [title, nowIso(), id]
	});
	return getFakeExam(db, id);
}

export function deleteFakeExam(db: Database, id: number): void {
	db.exec({ sql: 'DELETE FROM fake_exams WHERE id = ?', bind: [id] });
}

/**
 * Snapshots each question (and its assets) into the exam at the next
 * available position, in one transaction.
 */
export function addItemsToFakeExam(
	db: Database,
	examId: number,
	questionIds: number[]
): LibraryFakeExam {
	const nextPos =
		Number(db.selectValue('SELECT COALESCE(MAX(position), -1) FROM fake_exam_items WHERE fake_exam_id = ?', [
			examId
		])) + 1;

	db.exec('BEGIN');
	try {
		let pos = nextPos;
		for (const questionId of questionIds) {
			const q = db.selectObject(
				'SELECT title, type, prompt_html, prompt_text, metadata_json FROM questions WHERE id = ?',
				[questionId]
			);
			if (!q) continue;

			const answers: LibraryAnswer[] = db
				.selectObjects(
					`SELECT identifier, position, text_html, text_text, score, is_correct
						FROM answers WHERE question_id = ? ORDER BY position`,
					[questionId]
				)
				.map((a) => ({
					identifier: String(a.identifier ?? ''),
					position: Number(a.position ?? 0),
					textHtml: String(a.text_html ?? ''),
					textText: String(a.text_text ?? ''),
					score: a.score == null ? null : Number(a.score),
					correct: Number(a.is_correct ?? 0) === 1
				}));

			db.exec({
				sql: `INSERT INTO fake_exam_items
					(fake_exam_id, position, source_question_id, title, type, prompt_html, prompt_text, answers_json, metadata_json)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				bind: [
					examId,
					pos,
					questionId,
					String(q.title ?? ''),
					String(q.type ?? 'unknown'),
					String(q.prompt_html ?? ''),
					String(q.prompt_text ?? ''),
					JSON.stringify(answers),
					String(q.metadata_json ?? '{}')
				]
			});
			const itemId = Number(db.selectValue('SELECT last_insert_rowid()'));

			const assets = db.selectObjects('SELECT path, mime, bytes FROM assets WHERE question_id = ?', [
				questionId
			]);
			for (const a of assets) {
				db.exec({
					sql: 'INSERT INTO fake_exam_assets (fake_exam_item_id, path, mime, bytes) VALUES (?, ?, ?, ?)',
					bind: [itemId, String(a.path ?? ''), String(a.mime ?? ''), a.bytes ?? null]
				});
			}

			pos++;
		}
		db.exec({ sql: 'UPDATE fake_exams SET updated_at = ? WHERE id = ?', bind: [nowIso(), examId] });
		db.exec('COMMIT');
	} catch (err) {
		db.exec('ROLLBACK');
		throw err;
	}

	return getFakeExam(db, examId);
}

export function removeFakeExamItem(db: Database, itemId: number): LibraryFakeExam {
	const examId = Number(db.selectValue('SELECT fake_exam_id FROM fake_exam_items WHERE id = ?', [itemId]));
	db.exec({ sql: 'DELETE FROM fake_exam_items WHERE id = ?', bind: [itemId] });
	touchExam(db, examId);
	return getFakeExam(db, examId);
}

export function reorderFakeExamItems(
	db: Database,
	examId: number,
	orderedItemIds: number[]
): LibraryFakeExam {
	db.exec('BEGIN');
	try {
		orderedItemIds.forEach((itemId, i) => {
			db.exec({
				sql: 'UPDATE fake_exam_items SET position = ? WHERE id = ? AND fake_exam_id = ?',
				bind: [i, itemId, examId]
			});
		});
		db.exec({ sql: 'UPDATE fake_exams SET updated_at = ? WHERE id = ?', bind: [nowIso(), examId] });
		db.exec('COMMIT');
	} catch (err) {
		db.exec('ROLLBACK');
		throw err;
	}
	return getFakeExam(db, examId);
}

/** Returns the raw bytes of every asset attached to a fake exam item. */
export function getFakeExamItemAssets(db: Database, itemId: number): LibraryAssetBlob[] {
	const rows = db.selectObjects('SELECT path, mime, bytes FROM fake_exam_assets WHERE fake_exam_item_id = ?', [
		itemId
	]);
	return rows.map((r) => ({
		path: String(r.path ?? ''),
		mime: String(r.mime ?? 'application/octet-stream'),
		bytes: r.bytes instanceof Uint8Array ? r.bytes : new Uint8Array()
	}));
}

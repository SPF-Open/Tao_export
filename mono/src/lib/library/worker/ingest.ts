import type { Database } from '@sqlite.org/sqlite-wasm';
import type { IngestPayload, IngestQuestion, LibraryTestImportSummary } from '../types.js';
import { bumpContent } from './meta.js';

/**
 * Ingest pipeline: turns a normalized {@link IngestPayload} (produced on the
 * main thread by `parse/ingestFromZip.ts`) into SQLite rows.
 *
 * Duplicate policy:
 * - exact `source_hash` already present  → `duplicate` (skipped).
 * - same title, different hash           → `new-version` (new tests row).
 * - otherwise                            → `new`.
 */

type DuplicateStatus = LibraryTestImportSummary['duplicateStatus'];

function classify(db: Database, payload: IngestPayload): DuplicateStatus {
	const sameHash = db.selectValue('SELECT 1 FROM tests WHERE source_hash = ? LIMIT 1', [
		payload.sourceHash
	]);
	if (sameHash) return 'duplicate';
	const sameTitle = db.selectValue('SELECT 1 FROM tests WHERE title = ? LIMIT 1', [payload.title]);
	return sameTitle ? 'new-version' : 'new';
}

function baseSummary(
	payload: IngestPayload,
	duplicateStatus: DuplicateStatus,
	durationMs: number
): LibraryTestImportSummary {
	return {
		filename: payload.filename,
		sourceHash: payload.sourceHash,
		title: payload.title,
		assessmentId: payload.assessmentId,
		questionCount: payload.questions.length,
		parseErrors: [],
		duplicateStatus,
		imported: false,
		durationMs,
		skippedCount: 0
	};
}

/** Analyzes a payload without writing — used for the import preview. */
export function analyze(db: Database, payload: IngestPayload): LibraryTestImportSummary {
	const start = performance.now();
	const duplicateStatus = classify(db, payload);
	return baseSummary(payload, duplicateStatus, performance.now() - start);
}

function competencyText(q: IngestQuestion): string {
	return q.competencies
		.map((c) => [c.code, c.label, c.description].filter(Boolean).join(' '))
		.join(' ')
		.trim();
}

function indicatorText(q: IngestQuestion): string {
	return q.competencies
		.map((c) => c.indicator)
		.filter(Boolean)
		.join(' ')
		.trim();
}

function metadataText(q: IngestQuestion): string {
	const parts: string[] = [];
	for (const value of Object.values(q.metadata)) {
		if (value == null) continue;
		if (typeof value === 'object') parts.push(JSON.stringify(value));
		else parts.push(String(value));
	}
	return parts.join(' ').trim();
}

/** Resolves a competency code to its id, inserting it if needed. */
function upsertCompetency(
	db: Database,
	c: { code: string; label: string; description: string }
): number {
	const existing = db.selectValue('SELECT id FROM competencies WHERE code = ?', [c.code]);
	if (existing != null) {
		// Backfill label/description if they were empty before.
		db.exec({
			sql: `UPDATE competencies
				SET label = CASE WHEN label = '' THEN ? ELSE label END,
				    description = CASE WHEN description = '' THEN ? ELSE description END
				WHERE id = ?`,
			bind: [c.label, c.description, existing]
		});
		return Number(existing);
	}
	db.exec({
		sql: 'INSERT INTO competencies (code, label, description) VALUES (?, ?, ?)',
		bind: [c.code, c.label, c.description]
	});
	return Number(db.selectValue('SELECT last_insert_rowid()'));
}

/**
 * Ingests a payload in a single transaction. Returns a summary describing what
 * happened (including skips for duplicates).
 */
export function ingest(db: Database, payload: IngestPayload): LibraryTestImportSummary {
	const start = performance.now();
	const duplicateStatus = classify(db, payload);

	if (duplicateStatus === 'duplicate') {
		const summary = baseSummary(payload, duplicateStatus, performance.now() - start);
		summary.skippedCount = payload.questions.length;
		return summary;
	}

	// Reused prepared statements — these run once per row, so preparing them a
	// single time (instead of re-parsing the SQL on every db.exec) keeps large
	// imports fast.
	const lastId = db.prepare('SELECT last_insert_rowid()');
	const rowid = (): number => {
		lastId.reset();
		lastId.step();
		return lastId.getInt(0) ?? 0;
	};
	const insQuestion = db.prepare(
		`INSERT INTO questions
			(test_id, qti_identifier, title, type, prompt_html, prompt_text, answer_text, language, raw_xml, metadata_json)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	);
	const insAnswer = db.prepare(
		`INSERT INTO answers
			(question_id, identifier, position, text_html, text_text, score, is_correct)
			VALUES (?, ?, ?, ?, ?, ?, ?)`
	);
	const insFts = db.prepare(
		`INSERT INTO questions_fts
			(rowid, title, prompt_text, answer_text, competency_text, indicator, metadata_text)
			VALUES (?, ?, ?, ?, ?, ?, ?)`
	);
	const insQc = db.prepare(
		`INSERT OR IGNORE INTO question_competencies (question_id, competency_id, indicator) VALUES (?, ?, ?)`
	);
	const insAsset = db.prepare(
		'INSERT INTO assets (test_id, question_id, path, mime, bytes) VALUES (?, ?, ?, ?, ?)'
	);

	db.exec('BEGIN');
	try {
		db.exec({
			sql: `INSERT INTO tests
				(filename, source_hash, title, assessment_id, imported_at, question_count, metadata_json)
				VALUES (?, ?, ?, ?, ?, ?, ?)`,
			bind: [
				payload.filename,
				payload.sourceHash,
				payload.title,
				payload.assessmentId,
				new Date().toISOString(),
				payload.questions.length,
				JSON.stringify(payload.metadata ?? {})
			]
		});
		const testId = rowid();

		for (const q of payload.questions) {
			insQuestion
				.bind([
					testId,
					q.qtiIdentifier,
					q.title,
					q.type,
					q.promptHtml,
					q.promptText,
					q.answerText,
					q.language,
					q.rawXml,
					JSON.stringify(q.metadata ?? {})
				])
				.stepReset();
			const questionId = rowid();

			for (const a of q.answers) {
				insAnswer
					.bind([questionId, a.identifier, a.position, a.textHtml, a.textText, a.score, a.correct ? 1 : 0])
					.stepReset();
			}

			for (const c of q.competencies) {
				if (!c.code) continue;
				const competencyId = upsertCompetency(db, c);
				insQc.bind([questionId, competencyId, c.indicator]).stepReset();
			}

			// Keep the FTS index in sync (rowid == questions.id).
			insFts
				.bind([
					questionId,
					q.title,
					q.promptText,
					q.answerText,
					competencyText(q),
					indicatorText(q),
					metadataText(q)
				])
				.stepReset();
		}

		// Persist assets, resolving question identifiers to ids.
		for (const asset of payload.assets) {
			let questionId: number | null = null;
			if (asset.questionIdentifier) {
				const found = db.selectValue(
					'SELECT id FROM questions WHERE test_id = ? AND qti_identifier = ? LIMIT 1',
					[testId, asset.questionIdentifier]
				);
				questionId = found == null ? null : Number(found);
			}
			insAsset.bind([testId, questionId, asset.path, asset.mime, asset.bytes]).stepReset();
		}

		bumpContent(db);
		db.exec('COMMIT');
	} catch (err) {
		db.exec('ROLLBACK');
		throw err;
	} finally {
		for (const stmt of [lastId, insQuestion, insAnswer, insFts, insQc, insAsset]) stmt.finalize();
	}

	const summary = baseSummary(payload, duplicateStatus, performance.now() - start);
	summary.imported = true;
	return summary;
}

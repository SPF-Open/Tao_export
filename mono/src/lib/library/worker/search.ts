import type { Database, SqlValue } from '@sqlite.org/sqlite-wasm';
import type {
	ItemType
} from '$lib/questions/types.js';
import type {
	LibraryFacets,
	LibrarySearchFilters,
	LibrarySearchResponse,
	LibrarySearchResult
} from '../types.js';

/**
 * Search over the question library. When the user supplies query text we use
 * the FTS5 index (BM25 ranking + snippet highlighting); otherwise we fall back
 * to a plain filtered listing ordered by most-recent. Structured filters
 * (test, type, competency, indicator) apply to both paths via EXISTS subqueries
 * so a question with multiple competencies is never duplicated.
 */

/**
 * Builds a safe FTS5 MATCH expression from free user input: each whitespace
 * token becomes a quoted prefix term, combined with implicit AND. Quoting
 * neutralizes FTS operators so arbitrary input cannot raise a syntax error.
 */
export function buildMatchQuery(text: string): string {
	const tokens = text
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.map((t) => '"' + t.replace(/"/g, '""') + '"*');
	return tokens.join(' ');
}

interface WhereParts {
	clauses: string[];
	binds: SqlValue[];
}

function structuredFilters(filters: LibrarySearchFilters): WhereParts {
	const clauses: string[] = [];
	const binds: SqlValue[] = [];
	if (filters.testId != null) {
		clauses.push('q.test_id = ?');
		binds.push(filters.testId);
	}
	if (filters.type) {
		clauses.push('q.type = ?');
		binds.push(filters.type);
	}
	if (filters.competency) {
		clauses.push(
			`EXISTS (SELECT 1 FROM question_competencies qc
				JOIN competencies c ON c.id = qc.competency_id
				WHERE qc.question_id = q.id AND c.code = ?)`
		);
		binds.push(filters.competency);
	}
	if (filters.indicator) {
		clauses.push(
			`EXISTS (SELECT 1 FROM question_competencies qc
				WHERE qc.question_id = q.id AND qc.indicator = ?)`
		);
		binds.push(filters.indicator);
	}
	return { clauses, binds };
}

export function search(db: Database, filters: LibrarySearchFilters): LibrarySearchResponse {
	const start = performance.now();
	const hasText = filters.text.trim().length > 0;
	const { clauses, binds } = structuredFilters(filters);

	let fromWhere: string;
	const whereBinds: SqlValue[] = [];
	let selectExtra: string;
	let orderBy: string;

	if (hasText) {
		const match = buildMatchQuery(filters.text);
		selectExtra = `bm25(questions_fts) AS rank,
			snippet(questions_fts, 1, '<mark>', '</mark>', '…', 12) AS snippet`;
		fromWhere = `FROM questions_fts
			JOIN questions q ON q.id = questions_fts.rowid
			JOIN tests t ON t.id = q.test_id
			WHERE questions_fts MATCH ?`;
		whereBinds.push(match);
		orderBy = 'ORDER BY rank';
	} else {
		selectExtra = `NULL AS rank, substr(q.prompt_text, 1, 200) AS snippet`;
		fromWhere = `FROM questions q
			JOIN tests t ON t.id = q.test_id
			WHERE 1 = 1`;
		orderBy = 'ORDER BY q.id DESC';
	}

	const filterSql = clauses.length ? ' AND ' + clauses.join(' AND ') : '';
	const allBinds = [...whereBinds, ...binds];

	const total = Number(
		db.selectValue(
			`SELECT COUNT(*) ${fromWhere}${filterSql}`,
			// Passing an empty bind array to a parameterless statement throws.
			allBinds.length ? allBinds : undefined
		) ?? 0
	);

	const rows = db.selectObjects(
		`SELECT q.id, q.test_id AS testId, q.title, q.type, t.title AS testTitle, ${selectExtra}
			${fromWhere}${filterSql}
			${orderBy}
			LIMIT ? OFFSET ?`,
		[...allBinds, filters.limit, filters.offset]
	);

	const results: LibrarySearchResult[] = rows.map((r) => ({
		id: Number(r.id),
		testId: Number(r.testId),
		testTitle: String(r.testTitle ?? ''),
		title: String(r.title ?? ''),
		type: String(r.type ?? 'unknown') as ItemType,
		rank: r.rank == null ? null : Number(r.rank),
		snippet: String(r.snippet ?? '')
	}));

	return { results, total, durationMs: performance.now() - start };
}

/** Distinct filter values for the search comboboxes. */
export function facets(db: Database): LibraryFacets {
	const tests = db
		.selectObjects('SELECT id, title FROM tests ORDER BY title')
		.map((r) => ({ id: Number(r.id), title: String(r.title ?? '') }));

	const types = db
		.selectValues('SELECT DISTINCT type FROM questions ORDER BY type')
		.map((v) => String(v) as ItemType);

	const competencies = db
		.selectObjects(
			`SELECT DISTINCT c.code, c.label FROM competencies c
				JOIN question_competencies qc ON qc.competency_id = c.id
				ORDER BY c.code`
		)
		.map((r) => ({ code: String(r.code ?? ''), label: String(r.label ?? '') }));

	return { tests, types, competencies };
}

import type { Database, SqlValue } from '@sqlite.org/sqlite-wasm';
import type { LibrarySqlResult } from '../types.js';

/** Default cap on rows returned to the UI; the full count is still reported. */
const DEFAULT_LIMIT = 500;

/**
 * Rejects anything that isn't a single read-only statement. This is a
 * convenience guard against accidental destructive edits in the query console
 * (it's the user's own local DB), not a hard security boundary.
 */
function assertReadOnly(sql: string): void {
	const cleaned = sql
		.replace(/--[^\n]*/g, ' ')
		.replace(/\/\*[\s\S]*?\*\//g, ' ')
		.trim()
		.replace(/;\s*$/, '');

	if (!cleaned) throw new Error('Enter a query to run.');
	if (cleaned.includes(';')) throw new Error('Only a single statement can be run at a time.');
	if (!/^(select|with|explain|pragma)\b/i.test(cleaned)) {
		throw new Error('Only read-only queries are allowed (SELECT, WITH, EXPLAIN, PRAGMA).');
	}
	if (/\b(insert|update|delete|drop|alter|create|attach|detach|replace|reindex|vacuum)\b/i.test(cleaned)) {
		throw new Error('Write statements are not allowed in the query console.');
	}
}

/** Renders a single SQLite value for display (BLOBs become a short label). */
function renderCell(value: SqlValue): string | number | null {
	if (value === null || value === undefined) return null;
	if (typeof value === 'bigint') return Number(value);
	if (value instanceof Uint8Array) return `‹blob ${value.length} B›`;
	return value as string | number;
}

/** Runs a read-only SQL query and returns up to `limit` rows plus timing. */
export function runQuery(db: Database, sql: string, limit = DEFAULT_LIMIT): LibrarySqlResult {
	assertReadOnly(sql);
	const start = performance.now();
	const columns: string[] = [];
	const rows: (string | number | null)[][] = [];
	let rowCount = 0;

	db.exec({
		sql,
		rowMode: 'array',
		columnNames: columns,
		callback: (row: SqlValue[]) => {
			rowCount++;
			if (rows.length < limit) rows.push(row.map(renderCell));
		}
	});

	return {
		columns,
		rows,
		rowCount,
		truncated: rowCount > rows.length,
		durationMs: performance.now() - start
	};
}

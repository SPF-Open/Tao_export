import { beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import sqlite3InitModule, { type Database, type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { migrate } from '../worker/schema.js';
import { initMeta } from '../worker/meta.js';
import { ingest } from '../worker/ingest.js';
import { runQuery } from '../worker/sql.js';
import { qcmPayload } from './fixtures.js';

let sqlite3: Sqlite3Static;
beforeAll(async () => {
	sqlite3 = await sqlite3InitModule();
});

let db: Database;
beforeEach(() => {
	db = new sqlite3.oo1.DB(':memory:', 'c');
	db.exec('PRAGMA foreign_keys = ON');
	migrate(db);
	initMeta(db, { databaseId: 'sql', appVersion: '0' });
	ingest(db, qcmPayload());
});

describe('runQuery (read-only console)', () => {
	test('returns columns and rows for a SELECT', () => {
		const res = runQuery(db, 'SELECT id, title, type FROM questions ORDER BY id');
		expect(res.columns).toEqual(['id', 'title', 'type']);
		expect(res.rowCount).toBe(3);
		expect(res.rows.length).toBe(3);
		expect(res.truncated).toBe(false);
	});

	test('honors the row limit and reports truncation', () => {
		const res = runQuery(db, 'SELECT id FROM questions', 2);
		expect(res.rowCount).toBe(3);
		expect(res.rows.length).toBe(2);
		expect(res.truncated).toBe(true);
	});

	test('allows WITH and PRAGMA, rejects writes', () => {
		expect(runQuery(db, 'WITH x AS (SELECT 1 AS n) SELECT n FROM x').rows[0][0]).toBe(1);
		expect(() => runQuery(db, 'DELETE FROM questions')).toThrow();
		expect(() => runQuery(db, 'UPDATE questions SET title = ?')).toThrow();
		expect(() => runQuery(db, 'DROP TABLE questions')).toThrow();
	});

	test('rejects multiple statements', () => {
		expect(() => runQuery(db, 'SELECT 1; SELECT 2')).toThrow('single statement');
	});
});

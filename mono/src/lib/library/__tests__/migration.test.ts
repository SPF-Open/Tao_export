import { beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import sqlite3InitModule, { type Database, type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { migrate, getUserVersion, MIGRATIONS, type Migration } from '../worker/schema.js';
import { initMeta } from '../worker/meta.js';
import { ingest } from '../worker/ingest.js';
import { qcmPayload } from './fixtures.js';

let sqlite3: Sqlite3Static;
beforeAll(async () => {
	sqlite3 = await sqlite3InitModule();
});

let db: Database;
beforeEach(() => {
	db = new sqlite3.oo1.DB(':memory:', 'c');
	db.exec('PRAGMA foreign_keys = ON');
});

describe('migration runner', () => {
	test('builds a v1 schema from scratch', () => {
		expect(migrate(db)).toBe(1);
		expect(getUserVersion(db)).toBe(1);
	});

	test('upgrades a populated v1 DB to v2 without data loss', () => {
		// Start at v1 with real content.
		migrate(db);
		initMeta(db, { databaseId: 'mig', appVersion: '0' });
		ingest(db, qcmPayload());
		const before = Number(db.selectValue('SELECT COUNT(*) FROM questions'));
		expect(before).toBe(3);

		// A synthetic v2 step that adds a column, mirroring a future schema change.
		const v2: Migration = {
			version: 2,
			up: (d) => d.exec('ALTER TABLE questions ADD COLUMN difficulty INTEGER NOT NULL DEFAULT 0')
		};

		const result = migrate(db, [...MIGRATIONS, v2]);
		expect(result).toBe(2);
		expect(getUserVersion(db)).toBe(2);

		// Existing rows survive and the new column is queryable.
		expect(Number(db.selectValue('SELECT COUNT(*) FROM questions'))).toBe(before);
		expect(Number(db.selectValue('SELECT COUNT(*) FROM questions WHERE difficulty = 0'))).toBe(
			before
		);
	});

	test('rolls back and rethrows when a migration step fails', () => {
		migrate(db);
		const bad: Migration = {
			version: 2,
			up: () => {
				throw new Error('boom');
			}
		};
		expect(() => migrate(db, [...MIGRATIONS, bad])).toThrow('boom');
		// Version stays at 1 because the failed step rolled back.
		expect(getUserVersion(db)).toBe(1);
	});
});

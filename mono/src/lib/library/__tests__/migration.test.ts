import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
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
	const latestVersion = MIGRATIONS[MIGRATIONS.length - 1].version;

	test('builds the latest schema from scratch', () => {
		expect(migrate(db)).toBe(latestVersion);
		expect(getUserVersion(db)).toBe(latestVersion);
	});

	test('upgrades a populated DB to the next version without data loss', () => {
		// Start at the current schema with real content.
		migrate(db);
		initMeta(db, { databaseId: 'mig', appVersion: '0' });
		ingest(db, qcmPayload());
		const before = Number(db.selectValue('SELECT COUNT(*) FROM questions'));
		expect(before).toBe(3);

		// A synthetic next step that adds a column, mirroring a future schema change.
		const next: Migration = {
			version: latestVersion + 1,
			up: (d) => d.exec('ALTER TABLE questions ADD COLUMN difficulty INTEGER NOT NULL DEFAULT 0')
		};

		const result = migrate(db, [...MIGRATIONS, next]);
		expect(result).toBe(latestVersion + 1);
		expect(getUserVersion(db)).toBe(latestVersion + 1);

		// Existing rows survive and the new column is queryable.
		expect(Number(db.selectValue('SELECT COUNT(*) FROM questions'))).toBe(before);
		expect(Number(db.selectValue('SELECT COUNT(*) FROM questions WHERE difficulty = 0'))).toBe(
			before
		);
	});

	test('rolls back and rethrows when a migration step fails', () => {
		migrate(db);
		const bad: Migration = {
			version: latestVersion + 1,
			up: () => {
				throw new Error('boom');
			}
		};
		expect(() => migrate(db, [...MIGRATIONS, bad])).toThrow('boom');
		// Version is unchanged because the failed step rolled back.
		expect(getUserVersion(db)).toBe(latestVersion);
	});
});

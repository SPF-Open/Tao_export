import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import sqlite3InitModule, { type Database, type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { migrate, getUserVersion, MIGRATIONS } from '../worker/schema.js';
import { initMeta, getInfo } from '../worker/meta.js';
import { ingest, analyze } from '../worker/ingest.js';
import { search, facets } from '../worker/search.js';
import { getQuestion } from '../worker/question.js';
import { qcmPayload, changedPayload } from './fixtures.js';

let sqlite3: Sqlite3Static;

function freshDb(): Database {
	const db = new sqlite3.oo1.DB(':memory:', 'c');
	db.exec('PRAGMA foreign_keys = ON');
	migrate(db);
	initMeta(db, { databaseId: 'test-db', appVersion: '0.0.0' });
	return db;
}

beforeAll(async () => {
	sqlite3 = await sqlite3InitModule();
});

let db: Database;
beforeEach(() => {
	db = freshDb();
});

describe('schema & migration', () => {
	const latestVersion = MIGRATIONS[MIGRATIONS.length - 1].version;

	test('migrate sets user_version to the latest migration and is idempotent', () => {
		expect(getUserVersion(db)).toBe(latestVersion);
		expect(migrate(db)).toBe(latestVersion); // running again is a no-op
		expect(getUserVersion(db)).toBe(latestVersion);
	});

	test('fresh info reports zero counts and content_version 0', () => {
		const info = getInfo(db, 'memory');
		expect(info.schemaVersion).toBe(latestVersion);
		expect(info.contentVersion).toBe(0);
		expect(info.counts).toEqual({ tests: 0, questions: 0, competencies: 0 });
	});
});

describe('ingest', () => {
	test('imports a test and bumps content_version', () => {
		const summary = ingest(db, qcmPayload());
		expect(summary.imported).toBe(true);
		expect(summary.duplicateStatus).toBe('new');
		expect(summary.questionCount).toBe(3);

		const info = getInfo(db, 'memory');
		expect(info.counts.tests).toBe(1);
		expect(info.counts.questions).toBe(3);
		expect(info.counts.competencies).toBe(2);
		expect(info.contentVersion).toBe(1);
		expect(info.contentHash).not.toBe('');
	});

	test('duplicate ZIP hash is skipped', () => {
		ingest(db, qcmPayload());
		const second = ingest(db, qcmPayload());
		expect(second.imported).toBe(false);
		expect(second.duplicateStatus).toBe('duplicate');
		expect(second.skippedCount).toBe(3);
		expect(getInfo(db, 'memory').counts.tests).toBe(1);
	});

	test('analyze does not write', () => {
		const a = analyze(db, qcmPayload());
		expect(a.duplicateStatus).toBe('new');
		expect(a.imported).toBe(false);
		expect(getInfo(db, 'memory').counts.tests).toBe(0);
	});

	test('same title, different hash creates a new version', () => {
		ingest(db, qcmPayload());
		const changed = ingest(db, changedPayload());
		expect(changed.duplicateStatus).toBe('new-version');
		expect(changed.imported).toBe(true);
		expect(getInfo(db, 'memory').counts.tests).toBe(2);
	});
});

describe('search', () => {
	beforeEach(() => {
		ingest(db, qcmPayload());
	});

	const filters = (over: Partial<Parameters<typeof search>[1]>) => ({
		text: '',
		limit: 20,
		offset: 0,
		...over
	});

	test('matches prompt text with a highlighted snippet', () => {
		const res = search(db, filters({ text: 'capital' }));
		expect(res.total).toBe(1);
		expect(res.results[0].title).toContain('i-capital');
		expect(res.results[0].snippet).toContain('<mark>');
		expect(res.results[0].rank).not.toBeNull();
	});

	test('matches answer text', () => {
		const res = search(db, filters({ text: 'Marseille' }));
		expect(res.total).toBe(1);
		expect(res.results[0].title).toContain('i-capital');
	});

	test('matches competency and indicator text', () => {
		expect(search(db, filters({ text: 'Geography' })).total).toBe(1);
		expect(search(db, filters({ text: 'IND.7' })).total).toBe(1);
	});

	test('filters by competency code and indicator', () => {
		expect(search(db, filters({ competency: 'GEO.1' })).total).toBe(1);
		expect(search(db, filters({ indicator: 'IND.42' })).total).toBe(1);
		expect(search(db, filters({ indicator: 'NOPE' })).total).toBe(0);
	});

	test('combines text query with structured filters', () => {
		const res = search(db, filters({ text: 'photosynthesis', type: 'text' }));
		expect(res.total).toBe(1);
		expect(res.results[0].title).toContain('Essay');

		// Type mismatch yields nothing even though the text matches.
		expect(search(db, filters({ text: 'photosynthesis', type: 'single-choice' })).total).toBe(0);
	});

	test('no-text listing returns all questions filtered by type', () => {
		expect(search(db, filters({})).total).toBe(3);
		expect(search(db, filters({ type: 'instruction' })).total).toBe(1);
	});

	test('facets expose tests, types and competencies', () => {
		const f = facets(db);
		expect(f.tests).toHaveLength(1);
		expect(f.types.sort()).toEqual(['instruction', 'single-choice', 'text']);
		expect(f.competencies.map((c) => c.code).sort()).toEqual(['BIO.3', 'GEO.1']);
	});
});

describe('question:get', () => {
	test('hydrates answers, correct flags and competencies', () => {
		ingest(db, qcmPayload());
		const id = Number(db.selectValue("SELECT id FROM questions WHERE qti_identifier = 'i-capital'"));
		const q = getQuestion(db, id);
		expect(q.answers).toHaveLength(3);
		expect(q.answers.find((a) => a.textText === 'Paris')?.correct).toBe(true);
		expect(q.answers.find((a) => a.textText === 'Lyon')?.correct).toBe(false);
		expect(q.competencies[0].code).toBe('GEO.1');
		expect(q.competencies[0].indicator).toBe('IND.42');
		expect(q.testTitle).toBe('Biology Exam');
	});
});

describe('export round-trip', () => {
	test('exported bytes reopen with counts and version preserved', () => {
		ingest(db, qcmPayload());
		const before = getInfo(db, 'memory');
		const bytes = sqlite3.capi.sqlite3_js_db_export(db.pointer!);

		const reopened = new sqlite3.oo1.DB(':memory:', 'c');
		const p = sqlite3.wasm.allocFromTypedArray(bytes);
		const rc = sqlite3.capi.sqlite3_deserialize(
			reopened.pointer!,
			'main',
			p,
			bytes.length,
			bytes.length,
			sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE
		);
		expect(rc).toBe(0);

		const after = getInfo(reopened, 'memory');
		expect(after.counts).toEqual(before.counts);
		expect(after.contentVersion).toBe(before.contentVersion);
		expect(after.databaseId).toBe(before.databaseId);
		// FTS index survives the round-trip.
		expect(search(reopened, { text: 'capital', limit: 20, offset: 0 }).total).toBe(1);
		reopened.close();
	});
});

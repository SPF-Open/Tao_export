/// <reference lib="webworker" />
import sqlite3InitModule, {
	type Database,
	type SAHPoolUtil,
	type Sqlite3Static
} from '@sqlite.org/sqlite-wasm';
import type {
	LibraryCommand,
	LibraryDbInfo,
	LibraryRequest,
	LibraryResponse,
	LibraryStorageMode
} from '../types.js';
import { migrate } from './schema.js';
import { bumpContent, getInfo, initMeta, syncSchemaVersion } from './meta.js';
import { analyze, ingest } from './ingest.js';
import { facets, search } from './search.js';
import { getQuestion, getQuestionAssets } from './question.js';
import { runQuery } from './sql.js';
import {
	addItemsToFakeExam,
	createFakeExam,
	deleteFakeExam,
	getFakeExam,
	getFakeExamItemAssets,
	listFakeExams,
	removeFakeExamItem,
	renameFakeExam,
	reorderFakeExamItems
} from './fakeExam.js';

/**
 * Owns the SQLite WASM instance and serves all library commands. Persistence
 * uses the OPFS SAHPool VFS when available (survives reloads, no COOP/COEP
 * needed); otherwise it falls back to an in-memory database and the user must
 * export to keep changes.
 */

const DB_FILENAME = '/library.taodb';

let sqlite3: Sqlite3Static | null = null;
let poolUtil: SAHPoolUtil | null = null;
let db: Database | null = null;
let storageMode: LibraryStorageMode = 'memory';

async function ensureSqlite(): Promise<Sqlite3Static> {
	if (sqlite3) return sqlite3;
	sqlite3 = await sqlite3InitModule();
	try {
		poolUtil = await sqlite3.installOpfsSAHPoolVfs({ name: 'tao-library' });
		storageMode = 'opfs';
	} catch {
		poolUtil = null;
		storageMode = 'memory';
	}
	return sqlite3;
}

function requireDb(): Database {
	if (!db) throw new Error('No database is open. Create or open one first.');
	return db;
}

function closeDb(): void {
	if (db) {
		db.close();
		db = null;
	}
}

function openHandle(): Database {
	const s = sqlite3!;
	if (storageMode === 'opfs' && poolUtil) {
		return new poolUtil.OpfsSAHPoolDb(DB_FILENAME);
	}
	return new s.oo1.DB(':memory:', 'c');
}

async function createDatabase(appVersion: string) {
	await ensureSqlite();
	closeDb();
	if (storageMode === 'opfs' && poolUtil) {
		await poolUtil.wipeFiles();
	}
	db = openHandle();
	db.exec('PRAGMA foreign_keys = ON');
	migrate(db);
	initMeta(db, { databaseId: crypto.randomUUID(), appVersion });
	return getInfo(db, storageMode);
}

/**
 * Reopens the OPFS-backed database left behind by a previous session, if one
 * exists. Returns null when storage is in-memory (nothing persisted) or no
 * library file is present, so the UI shows the create/open state. Without this,
 * a refresh leaves the persisted file on disk but never reattaches to it.
 */
async function restoreDatabase(): Promise<LibraryDbInfo | null> {
	await ensureSqlite();
	if (storageMode !== 'opfs' || !poolUtil) return null;
	if (!poolUtil.getFileNames().includes(DB_FILENAME)) return null;

	closeDb();
	db = new poolUtil.OpfsSAHPoolDb(DB_FILENAME);
	db.exec('PRAGMA foreign_keys = ON');

	// Make sure it's actually one of our libraries before reporting it.
	const hasMeta = db.selectValue(
		"SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'db_meta'"
	);
	if (!hasMeta) {
		closeDb();
		return null;
	}

	migrate(db);
	syncSchemaVersion(db);
	return getInfo(db, storageMode);
}

async function openDatabase(bytes: Uint8Array) {
	const s = await ensureSqlite();
	closeDb();
	if (storageMode === 'opfs' && poolUtil) {
		await poolUtil.importDb(DB_FILENAME, bytes);
		db = new poolUtil.OpfsSAHPoolDb(DB_FILENAME);
	} else {
		db = new s.oo1.DB(':memory:', 'c');
		const p = s.wasm.allocFromTypedArray(bytes);
		const rc = s.capi.sqlite3_deserialize(
			db.pointer!,
			'main',
			p,
			bytes.length,
			bytes.length,
			s.capi.SQLITE_DESERIALIZE_FREEONCLOSE | s.capi.SQLITE_DESERIALIZE_RESIZEABLE
		);
		if (rc) throw new Error(`Failed to load database (code ${rc})`);
	}
	db.exec('PRAGMA foreign_keys = ON');
	// Apply any pending migrations to bring an older file up to date.
	migrate(db);
	syncSchemaVersion(db);
	bumpContent(db); // refresh content hash for the loaded content
	return getInfo(db, storageMode);
}

function exportDatabase(): Uint8Array {
	const active = requireDb();
	// sqlite3_js_db_export serializes the currently-open database to a byte
	// array; it works for both the in-memory and OPFS-backed handles.
	return sqlite3!.capi.sqlite3_js_db_export(active.pointer!);
}

async function handle<C extends LibraryCommand>(
	command: C,
	data: LibraryRequest<C>['data']
): Promise<LibraryResponse<C>['ok'] extends true ? unknown : never> {
	switch (command) {
		case 'db:create':
			return createDatabase((data as { appVersion?: string }).appVersion ?? '') as never;
		case 'db:restore':
			return (await restoreDatabase()) as never;
		case 'db:open':
			return openDatabase((data as { bytes: Uint8Array }).bytes) as never;
		case 'db:export':
			return { bytes: exportDatabase() } as never;
		case 'db:getInfo':
			return getInfo(requireDb(), storageMode) as never;
		case 'db:migrate': {
			const active = requireDb();
			migrate(active);
			syncSchemaVersion(active);
			return getInfo(active, storageMode) as never;
		}
		case 'test:analyzeZip':
			return analyze(requireDb(), (data as { payload: import('../types.js').IngestPayload }).payload) as never;
		case 'test:ingestZip':
			return ingest(requireDb(), (data as { payload: import('../types.js').IngestPayload }).payload) as never;
		case 'search:questions':
			return search(
				requireDb(),
				(data as { filters: import('../types.js').LibrarySearchFilters }).filters
			) as never;
		case 'search:facets':
			return facets(requireDb()) as never;
		case 'question:get':
			return getQuestion(requireDb(), (data as { id: number }).id) as never;
		case 'question:getAssets':
			return getQuestionAssets(requireDb(), (data as { id: number }).id) as never;
		case 'sql:query': {
			const q = data as { sql: string; limit?: number };
			return runQuery(requireDb(), q.sql, q.limit) as never;
		}
		case 'fakeExam:list':
			return listFakeExams(requireDb()) as never;
		case 'fakeExam:get':
			return getFakeExam(requireDb(), (data as { id: number }).id) as never;
		case 'fakeExam:create':
			return createFakeExam(requireDb(), data as { title: string; language?: string }) as never;
		case 'fakeExam:rename': {
			const r = data as { id: number; title: string };
			return renameFakeExam(requireDb(), r.id, r.title) as never;
		}
		case 'fakeExam:delete':
			deleteFakeExam(requireDb(), (data as { id: number }).id);
			return {} as never;
		case 'fakeExam:addItems': {
			const a = data as { examId: number; questionIds: number[] };
			return addItemsToFakeExam(requireDb(), a.examId, a.questionIds) as never;
		}
		case 'fakeExam:removeItem':
			return removeFakeExamItem(requireDb(), (data as { itemId: number }).itemId) as never;
		case 'fakeExam:reorderItems': {
			const r = data as { examId: number; orderedItemIds: number[] };
			return reorderFakeExamItems(requireDb(), r.examId, r.orderedItemIds) as never;
		}
		case 'fakeExam:getItemAssets':
			return getFakeExamItemAssets(requireDb(), (data as { itemId: number }).itemId) as never;
		default:
			throw new Error(`Unknown command: ${command}`);
	}
}

self.onmessage = async (event: MessageEvent<LibraryRequest>) => {
	const { id, command, data } = event.data;
	try {
		const result = await handle(command, data);
		const response: LibraryResponse = { id, ok: true, data: result as never };
		// Transfer the exported buffer to avoid a copy.
		const transfer =
			command === 'db:export' && result && (result as { bytes?: Uint8Array }).bytes
				? [(result as { bytes: Uint8Array }).bytes.buffer]
				: [];
		(self as DedicatedWorkerGlobalScope).postMessage(response, transfer);
	} catch (err) {
		const response: LibraryResponse = {
			id,
			ok: false,
			error: err instanceof Error ? err.message : String(err)
		};
		(self as DedicatedWorkerGlobalScope).postMessage(response);
	}
};

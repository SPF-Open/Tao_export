import type { Database } from '@sqlite.org/sqlite-wasm';
import type { LibraryDbInfo, LibraryStorageMode } from '../types.js';
import { fnv1aHex } from '../hashUtil.js';
import { getUserVersion } from './schema.js';

/**
 * Helpers for the single-row `db_meta` table: database identity, schema/content
 * versions, and content hashing. Every successful mutation calls
 * {@link bumpContent} to advance `content_version` and recompute `content_hash`.
 */

function nowIso(): string {
	return new Date().toISOString();
}

/** Initializes db_meta for a freshly-created database. */
export function initMeta(
	db: Database,
	opts: { databaseId: string; appVersion: string }
): void {
	const ts = nowIso();
	db.exec({
		sql: `INSERT INTO db_meta
			(id, database_id, schema_version, content_version, content_hash, created_at, updated_at, app_version)
			VALUES (1, ?, ?, 0, '', ?, ?, ?)`,
		bind: [opts.databaseId, getUserVersion(db), ts, ts, opts.appVersion]
	});
}

/**
 * Content hash is a deterministic fingerprint of the imported tests (their
 * source hashes), so two DB files with the same imports hash identically
 * regardless of import order.
 */
function computeContentHash(db: Database): string {
	const hashes = db
		.selectValues('SELECT source_hash FROM tests ORDER BY source_hash')
		.map((v) => String(v));
	return fnv1aHex(hashes.join('|'));
}

/** Advances content_version, refreshes content_hash + updated_at. */
export function bumpContent(db: Database): void {
	db.exec({
		sql: `UPDATE db_meta
			SET content_version = content_version + 1,
			    content_hash = ?,
			    updated_at = ?
			WHERE id = 1`,
		bind: [computeContentHash(db), nowIso()]
	});
}

/** Keeps schema_version in db_meta aligned with PRAGMA user_version. */
export function syncSchemaVersion(db: Database): void {
	db.exec({
		sql: 'UPDATE db_meta SET schema_version = ?, updated_at = ? WHERE id = 1',
		bind: [getUserVersion(db), nowIso()]
	});
}

/** Builds the LibraryDbInfo snapshot for the UI. */
export function getInfo(db: Database, storageMode: LibraryStorageMode): LibraryDbInfo {
	const row = db.selectObject('SELECT * FROM db_meta WHERE id = 1') ?? {};
	const count = (table: string): number =>
		Number(db.selectValue(`SELECT COUNT(*) FROM ${table}`) ?? 0);
	return {
		databaseId: String(row.database_id ?? ''),
		schemaVersion: Number(row.schema_version ?? getUserVersion(db)),
		contentVersion: Number(row.content_version ?? 0),
		contentHash: String(row.content_hash ?? ''),
		storageMode,
		createdAt: String(row.created_at ?? ''),
		updatedAt: String(row.updated_at ?? ''),
		appVersion: String(row.app_version ?? ''),
		counts: {
			tests: count('tests'),
			questions: count('questions'),
			competencies: count('competencies')
		}
	};
}

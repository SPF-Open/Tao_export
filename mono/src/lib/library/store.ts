import { get, writable } from 'svelte/store';
import { libraryClient } from './client.js';
import { buildIngestPayload } from './parse/ingestFromZip.js';
import { buildIngestPayloadFromExcel } from './parse/ingestFromExcel.js';
import { mergeExcelIntoPayload } from './parse/mergeExcel.js';
import { parseExcel } from '$lib/audit/excel-parser.js';
import type { ExcelConfig } from '$lib/audit/types.js';
import { decryptDb, encryptDb, isEncryptedBytes } from './crypto.js';
import { pushError } from '$lib/ui/notifications';
import { downloadBlob } from '$lib/utils/download.js';
import type {
	IngestPayload,
	LibraryDbInfo,
	LibraryFacets,
	LibraryQuestion,
	LibrarySearchFilters,
	LibrarySearchResponse,
	LibrarySqlResult,
	LibraryTestImportSummary
} from './types.js';

declare const PKG: { version: string };

/** Active database info (null until created/opened). */
export const dbInfo = writable<LibraryDbInfo | null>(null);
/** Whether a long-running operation is in flight. */
export const busy = writable<boolean>(false);
/** Last error message, surfaced in the UI. */
export const lastError = writable<string>('');
/** Facets for the search filter comboboxes. */
export const facets = writable<LibraryFacets>({
	tests: [],
	types: [],
	competencies: [],
	indicators: [],
	languages: []
});

/* ------------------------------------------------------------------ */
/* Database password (encrypts the exported .taodb file)                */
/* ------------------------------------------------------------------ */

/**
 * Session password used to encrypt exports and decrypt opened files. Held only
 * in memory — never written to the DB, OPFS, or localStorage. Cleared on
 * refresh, create, or when the user opens/removes it.
 */
let sessionPassword: string | null = null;
/** Whether a password is currently set — drives the lock UI in the DB panel. */
export const dbHasPassword = writable<boolean>(false);

/** Sets (or changes) the session password used to encrypt exports. */
export function setDbPassword(pw: string): void {
	sessionPassword = pw;
	dbHasPassword.set(true);
}

/** Removes the session password — subsequent exports are written in plaintext. */
export function removeDbPassword(): void {
	sessionPassword = null;
	dbHasPassword.set(false);
}

/* ------------------------------------------------------------------ */
/* Shared search state (sidebar filters ↔ main results)                 */
/* ------------------------------------------------------------------ */

/** Results shown per page in the search results list. */
export const SEARCH_LIMIT = 20;

export const searchText = writable('');
export const searchTestId = writable('');
export const searchType = writable('');
export const searchCompetency = writable('');
export const searchIndicator = writable('');
export const searchLanguage = writable('');
export const searchPage = writable(0);

/* ------------------------------------------------------------------ */
/* SQL query console                                                    */
/* ------------------------------------------------------------------ */

export const sqlResult = writable<LibrarySqlResult | null>(null);
export const sqlError = writable<string>('');
export const sqlRunning = writable(false);

/** Runs a read-only SQL query and stores the result (or error) for the modal. */
export async function runSqlQuery(sql: string): Promise<void> {
	sqlRunning.set(true);
	sqlError.set('');
	try {
		sqlResult.set(await libraryClient.call('sql:query', { sql }));
	} catch (err) {
		sqlError.set(err instanceof Error ? err.message : String(err));
		sqlResult.set(null);
	} finally {
		sqlRunning.set(false);
	}
}
/** Most recent analysis preview (before import). */
export const importPreview = writable<LibraryTestImportSummary | null>(null);
/** Most recent search response. */
export const searchResponse = writable<LibrarySearchResponse | null>(null);

function appVersion(): string {
	try {
		return PKG.version;
	} catch {
		return '';
	}
}

async function run<T>(fn: () => Promise<T>): Promise<T | null> {
	busy.set(true);
	lastError.set('');
	try {
		return await fn();
	} catch (err) {
		lastError.set(err instanceof Error ? err.message : String(err));
		return null;
	} finally {
		busy.set(false);
	}
}

export async function createDb(): Promise<void> {
	const info = await run(() => libraryClient.call('db:create', { appVersion: appVersion() }));
	if (info) {
		// A fresh library has no password until the user sets one.
		removeDbPassword();
		dbInfo.set(info);
		await refreshFacets();
	}
}

/**
 * Reattaches to a previously-persisted OPFS library on startup. No-op (leaves
 * `dbInfo` null) when nothing is persisted or storage is in-memory.
 */
export async function restoreDb(): Promise<void> {
	const info = await run(() => libraryClient.call('db:restore', {}));
	if (info) {
		dbInfo.set(info);
		await refreshFacets();
	}
}

/**
 * Opens a `.taodb` file. Encrypted files (detected by their container magic)
 * are decrypted on the main thread with `password` before the plaintext image
 * is handed to the worker; plaintext files open directly. On a successful
 * encrypted open the password becomes the session password so a later export
 * re-encrypts with it automatically.
 *
 * Throws a friendly error (caught by the panel) on a wrong/missing password.
 */
export async function openDb(file: File, password?: string): Promise<boolean> {
	let wasEncrypted = false;
	const info = await run(async () => {
		let bytes = new Uint8Array(await file.arrayBuffer());
		if (isEncryptedBytes(bytes)) {
			wasEncrypted = true;
			if (!password) throw new Error('This library is encrypted. Enter its password to open it.');
			bytes = await decryptDb(bytes, password);
		}
		return libraryClient.call('db:open', { bytes }, [bytes.buffer]);
	});
	if (!info) return false;
	// Reflect the opened file's encryption state in the session so a later
	// export re-encrypts with the same password (or stays plaintext).
	if (wasEncrypted && password) setDbPassword(password);
	else removeDbPassword();
	dbInfo.set(info);
	await refreshFacets();
	return true;
}

/**
 * Exports the database. When a session password is set the SQLite image is
 * encrypted (PBKDF2 → AES-GCM) before download, so the `.taodb` file on disk is
 * unreadable without the password. Without a password it exports plaintext.
 */
export async function exportDb(filename = 'library.taodb'): Promise<void> {
	await run(async () => {
		const { bytes } = await libraryClient.call('db:export', {});
		const out = sessionPassword ? await encryptDb(bytes, sessionPassword) : bytes;
		downloadBytes(out, filename);
	});
}

/** Parses a ZIP (main thread) and asks the worker for a non-writing preview. */
export async function analyzeZip(file: File): Promise<void> {
	const summary = await run(async () => {
		const payload = await buildIngestPayload(file);
		// Stash the parsed payload so a subsequent import skips re-parsing.
		lastPayload = payload;
		return libraryClient.call('test:analyzeZip', { payload });
	});
	importPreview.set(summary);
}

let lastPayload: IngestPayload | null = null;

/** Imports the previously-analyzed ZIP (or re-parses if needed). */
export async function ingestZip(file: File): Promise<void> {
	const summary = await run(async () => {
		const payload =
			lastPayload && lastPayload.filename === file.name
				? lastPayload
				: await buildIngestPayload(file);
		const result = await libraryClient.call('test:ingestZip', { payload });
		const info = await libraryClient.call('db:getInfo', {});
		dbInfo.set(info);
		return result;
	});
	importPreview.set(summary);
	lastPayload = null;
	await refreshFacets();
}

/* ------------------------------------------------------------------ */
/* Batch ingest queue                                                   */
/* ------------------------------------------------------------------ */

/** Maximum number of ZIPs that can sit in the ingest queue at once. */
export const MAX_INGEST_FILES = 100;

export type IngestJobStatus =
	| 'queued'
	| 'parsing'
	| 'importing'
	| 'success'
	| 'skipped'
	| 'failed';

/** One file's lifecycle through the ingest queue. */
export interface IngestJob {
	id: string;
	filename: string;
	size: number;
	status: IngestJobStatus;
	/** 0..1 progress for this file (phase-based). */
	progress: number;
	questionCount: number;
	skippedCount: number;
	duplicateStatus?: LibraryTestImportSummary['duplicateStatus'];
	durationMs: number;
	error: string;
	source?: 'zip' | 'excel' | 'merged';
}

/** Reactive list of all jobs (queued, running and finished). */
export const ingestJobs = writable<IngestJob[]>([]);
/** True while the queue is being drained. */
export const ingestRunning = writable<boolean>(false);

type PendingItem = { id: string; build: () => Promise<IngestPayload> };
const pendingQueue: PendingItem[] = [];
let draining = false;

function patchJob(id: string, patch: Partial<IngestJob>): void {
	ingestJobs.update((jobs) => jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)));
}

/**
 * Adds files to the queue (capped at {@link MAX_INGEST_FILES} total) and starts
 * draining it if not already running. Returns the number actually queued.
 */
export function enqueueIngest(files: File[]): number {
	if (!files.length) return 0;
	const current = get(ingestJobs).length;
	const room = Math.max(0, MAX_INGEST_FILES - current);
	if (room === 0) {
		pushError('Queue full', `The ingest queue is limited to ${MAX_INGEST_FILES} files.`);
		return 0;
	}

	const accepted = files.slice(0, room);
	if (files.length > room) {
		pushError(
			'Too many files',
			`Only ${room} of ${files.length} file(s) were queued (max ${MAX_INGEST_FILES}).`
		);
	}

	const newJobs: IngestJob[] = accepted.map((file) => {
		const id = crypto.randomUUID();
		pendingQueue.push({ id, build: () => buildIngestPayload(file) });
		return {
			id,
			filename: file.name,
			size: file.size,
			status: 'queued',
			progress: 0,
			questionCount: 0,
			skippedCount: 0,
			durationMs: 0,
			error: '',
			source: 'zip' as const
		};
	});
	ingestJobs.update((jobs) => [...jobs, ...newJobs]);

	void drainQueue();
	return accepted.length;
}

/** Removes all finished (success/skipped/failed) jobs from the list. */
export function clearFinishedJobs(): void {
	ingestJobs.update((jobs) =>
		jobs.filter((j) => j.status === 'queued' || j.status === 'parsing' || j.status === 'importing')
	);
}

async function drainQueue(): Promise<void> {
	if (draining) return;
	draining = true;
	ingestRunning.set(true);
	try {
		let item: PendingItem | undefined;
		while ((item = pendingQueue.shift())) {
			const { id, build } = item;
			try {
				patchJob(id, { status: 'parsing', progress: 0.15 });
				const payload = await build();
				patchJob(id, { status: 'importing', progress: 0.65 });
				const summary = await libraryClient.call('test:ingestZip', { payload });

				const status: IngestJobStatus =
					summary.duplicateStatus === 'duplicate' ? 'skipped' : 'success';
				patchJob(id, {
					status,
					progress: 1,
					questionCount: summary.questionCount,
					skippedCount: summary.skippedCount,
					duplicateStatus: summary.duplicateStatus,
					durationMs: summary.durationMs
				});

				// Keep the DB panel counts live as the queue progresses.
				dbInfo.set(await libraryClient.call('db:getInfo', {}));
			} catch (err) {
				patchJob(id, {
					status: 'failed',
					progress: 1,
					error: err instanceof Error ? err.message : String(err)
				});
			}
		}
	} finally {
		draining = false;
		ingestRunning.set(false);
		await refreshFacets();
	}
}

/**
 * Queues an Excel-only import. The file is converted to an {@link IngestPayload}
 * using the audit Excel parser and ingested via the existing worker pipeline.
 */
export function enqueueIngestFromExcel(
	file: File,
	config: ExcelConfig,
	sheetName?: string
): number {
	const current = get(ingestJobs).length;
	const room = Math.max(0, MAX_INGEST_FILES - current);
	if (room === 0) {
		pushError('Queue full', `The ingest queue is limited to ${MAX_INGEST_FILES} files.`);
		return 0;
	}
	const id = crypto.randomUUID();
	pendingQueue.push({ id, build: () => buildIngestPayloadFromExcel(file, config, sheetName) });
	ingestJobs.update((jobs) => [
		...jobs,
		{
			id,
			filename: file.name,
			size: file.size,
			status: 'queued',
			progress: 0,
			questionCount: 0,
			skippedCount: 0,
			durationMs: 0,
			error: '',
			source: 'excel' as const
		}
	]);
	void drainQueue();
	return 1;
}

/**
 * Queues a ZIP + Excel merged import. The ZIP provides QTI structure; the
 * Excel file enriches matched questions with competency/indicator data.
 */
export function enqueueIngestMerged(
	zipFile: File,
	excelFile: File,
	config: ExcelConfig,
	sheetName?: string
): number {
	const current = get(ingestJobs).length;
	const room = Math.max(0, MAX_INGEST_FILES - current);
	if (room === 0) {
		pushError('Queue full', `The ingest queue is limited to ${MAX_INGEST_FILES} files.`);
		return 0;
	}
	const id = crypto.randomUUID();
	pendingQueue.push({
		id,
		build: async () => {
			const zipPayload = await buildIngestPayload(zipFile);
			const buf = await excelFile.arrayBuffer();
			const excelQs = await parseExcel(buf, config, sheetName);
			return mergeExcelIntoPayload(zipPayload, excelQs, config);
		}
	});
	ingestJobs.update((jobs) => [
		...jobs,
		{
			id,
			filename: zipFile.name,
			size: zipFile.size + excelFile.size,
			status: 'queued',
			progress: 0,
			questionCount: 0,
			skippedCount: 0,
			durationMs: 0,
			error: '',
			source: 'merged' as const
		}
	]);
	void drainQueue();
	return 1;
}

export async function runSearch(filters: LibrarySearchFilters): Promise<void> {
	const response = await run(() => libraryClient.call('search:questions', { filters }));
	if (response) searchResponse.set(response);
}

export async function getQuestion(id: number): Promise<LibraryQuestion | null> {
	return run(() => libraryClient.call('question:get', { id }));
}

/**
 * Loads a question's assets and returns a map of `asset:<filename>` marker →
 * object URL for rendering its images. Caller is responsible for revoking the
 * returned URLs when done.
 */
export async function loadQuestionAssetUrls(id: number): Promise<Map<string, string>> {
	const urls = new Map<string, string>();
	try {
		const assets = await libraryClient.call('question:getAssets', { id });
		for (const a of assets) {
			const blob = new Blob([a.bytes.slice()], { type: a.mime });
			urls.set(`asset:${a.path}`, URL.createObjectURL(blob));
		}
	} catch {
		// Assets are optional; render without images on failure.
	}
	return urls;
}

async function refreshFacets(): Promise<void> {
	try {
		facets.set(await libraryClient.call('search:facets', {}));
	} catch {
		// Facets are non-critical; leave previous values.
	}
}

function downloadBytes(bytes: Uint8Array, filename: string): void {
	// Copy into a fresh Uint8Array (backed by a plain ArrayBuffer) so the type
	// satisfies BlobPart regardless of the worker's buffer kind.
	downloadBlob(new Blob([bytes.slice()], { type: 'application/octet-stream' }), filename);
}

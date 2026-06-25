import { get, writable } from 'svelte/store';
import { libraryClient } from './client.js';
import { buildIngestPayload } from './parse/ingestFromZip.js';
import { pushError } from '$lib/ui/notifications';
import type {
	IngestPayload,
	LibraryDbInfo,
	LibraryFacets,
	LibraryQuestion,
	LibrarySearchFilters,
	LibrarySearchResponse,
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
export const facets = writable<LibraryFacets>({ tests: [], types: [], competencies: [] });
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
		dbInfo.set(info);
		await refreshFacets();
	}
}

export async function openDb(file: File): Promise<void> {
	const info = await run(async () => {
		const bytes = new Uint8Array(await file.arrayBuffer());
		return libraryClient.call('db:open', { bytes }, [bytes.buffer]);
	});
	if (info) {
		dbInfo.set(info);
		await refreshFacets();
	}
}

export async function exportDb(filename = 'library.taodb'): Promise<void> {
	await run(async () => {
		const { bytes } = await libraryClient.call('db:export', {});
		downloadBytes(bytes, filename);
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
}

/** Reactive list of all jobs (queued, running and finished). */
export const ingestJobs = writable<IngestJob[]>([]);
/** True while the queue is being drained. */
export const ingestRunning = writable<boolean>(false);

const pendingQueue: { id: string; file: File }[] = [];
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
		pendingQueue.push({ id, file });
		return {
			id,
			filename: file.name,
			size: file.size,
			status: 'queued',
			progress: 0,
			questionCount: 0,
			skippedCount: 0,
			durationMs: 0,
			error: ''
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
		let item: { id: string; file: File } | undefined;
		while ((item = pendingQueue.shift())) {
			const { id, file } = item;
			try {
				patchJob(id, { status: 'parsing', progress: 0.15 });
				const payload = await buildIngestPayload(file);
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
	const blob = new Blob([bytes.slice()], { type: 'application/octet-stream' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

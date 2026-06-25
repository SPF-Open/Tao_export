import { writable } from 'svelte/store';
import { libraryClient } from './client.js';
import { buildIngestPayload } from './parse/ingestFromZip.js';
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

export async function runSearch(filters: LibrarySearchFilters): Promise<void> {
	const response = await run(() => libraryClient.call('search:questions', { filters }));
	if (response) searchResponse.set(response);
}

export async function getQuestion(id: number): Promise<LibraryQuestion | null> {
	return run(() => libraryClient.call('question:get', { id }));
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

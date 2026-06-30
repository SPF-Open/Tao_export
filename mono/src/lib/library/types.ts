import type { ItemType } from '$lib/questions/types.js';

/**
 * Public TypeScript interfaces for the TAO Question Library module.
 *
 * The library stores TAO QTI exports in a portable, client-only SQLite database
 * (a `.taodb` file). All heavy work (SQLite I/O, ingest transactions, FTS5
 * search) happens in a Web Worker; these types are the contract shared between
 * the main thread (`client.ts`, UI) and the worker (`worker/*`).
 */

/** Current application schema version. Bump when a migration is added. */
export const APP_LIBRARY_SCHEMA_VERSION = 2;

/** How the active database is persisted. */
export type LibraryStorageMode =
	/** Backed by OPFS via the SAHPool VFS — survives reloads. */
	| 'opfs'
	/** In-memory only — changes are lost unless exported/downloaded. */
	| 'memory';

/** Snapshot of the active database, surfaced to the DB panel. */
export interface LibraryDbInfo {
	databaseId: string;
	schemaVersion: number;
	contentVersion: number;
	contentHash: string;
	storageMode: LibraryStorageMode;
	createdAt: string;
	updatedAt: string;
	appVersion: string;
	counts: {
		tests: number;
		questions: number;
		competencies: number;
	};
}

/** Result of analyzing (or importing) a single TAO ZIP export. */
export interface LibraryTestImportSummary {
	filename: string;
	sourceHash: string;
	title: string;
	assessmentId: string;
	questionCount: number;
	/** Per-item parse errors that did not abort the import. */
	parseErrors: string[];
	/**
	 * - `new`: not present, will be / was imported.
	 * - `duplicate`: exact same ZIP hash already imported (skipped).
	 * - `new-version`: same title, different hash → stored as a new test version.
	 */
	duplicateStatus: 'new' | 'duplicate' | 'new-version';
	/** True once the rows have actually been written to the DB. */
	imported: boolean;
	/** Wall-clock time spent (parse for analyze, parse+write for ingest). */
	durationMs: number;
	/** Number of questions skipped (e.g. on duplicate import). */
	skippedCount: number;
}

/** A normalized answer/choice row attached to a question. */
export interface LibraryAnswer {
	identifier: string;
	position: number;
	textHtml: string;
	textText: string;
	score: number | null;
	correct: boolean;
}

/** A competency/indicator pair attached to a question. */
export interface LibraryCompetency {
	code: string;
	label: string;
	description: string;
	indicator: string;
}

/** A fully hydrated question, returned by `question:get`. */
export interface LibraryQuestion {
	id: number;
	testId: number;
	testTitle: string;
	qtiIdentifier: string;
	title: string;
	type: ItemType;
	promptHtml: string;
	promptText: string;
	answerText: string;
	language: string;
	rawXml: string;
	metadata: Record<string, unknown>;
	answers: LibraryAnswer[];
	competencies: LibraryCompetency[];
	assetRefs: string[];
}

/** Filters for a search query. */
export interface LibrarySearchFilters {
	text: string;
	testId?: number;
	competency?: string;
	indicator?: string;
	language?: string;
	type?: ItemType;
	limit: number;
	offset: number;
}

/** Result of a raw, read-only SQL query (the query console). */
export interface LibrarySqlResult {
	columns: string[];
	/** Row values, BLOBs rendered as a short placeholder string. */
	rows: (string | number | null)[][];
	/** Total rows produced (may exceed `rows.length` when truncated). */
	rowCount: number;
	/** True when more rows existed than the display limit. */
	truncated: boolean;
	durationMs: number;
}

/** A single search hit (summary form). */
export interface LibrarySearchResult {
	id: number;
	testId: number;
	testTitle: string;
	title: string;
	type: ItemType;
	/** BM25 rank (lower = more relevant); null when no text query. */
	rank: number | null;
	/** Highlighted snippet (may contain <mark> tags from FTS5 snippet()). */
	snippet: string;
}

/** Paged search response with timing for the perf instrumentation. */
export interface LibrarySearchResponse {
	results: LibrarySearchResult[];
	total: number;
	durationMs: number;
}

/** Distinct filter values to populate the search comboboxes. */
export interface LibraryFacets {
	tests: { id: number; title: string }[];
	types: ItemType[];
	competencies: { code: string; label: string }[];
	indicators: string[];
	languages: string[];
}

/* ------------------------------------------------------------------ */
/* Fake exams — hand-built exams assembled from library questions      */
/* ------------------------------------------------------------------ */

/** Summary row for the fake exams list. */
export interface LibraryFakeExamSummary {
	id: number;
	title: string;
	language: string;
	itemCount: number;
	createdAt: string;
	updatedAt: string;
}

/** A single question snapshot inside a fake exam. */
export interface LibraryFakeExamItem {
	id: number;
	position: number;
	/** Back-reference only; may point at a question that no longer exists. */
	sourceQuestionId: number | null;
	title: string;
	type: ItemType;
	promptHtml: string;
	promptText: string;
	answers: LibraryAnswer[];
	metadata: Record<string, unknown>;
	assetRefs: string[];
}

/** A fully hydrated fake exam, returned by `fakeExam:get` and mutating commands. */
export interface LibraryFakeExam {
	id: number;
	title: string;
	language: string;
	createdAt: string;
	updatedAt: string;
	items: LibraryFakeExamItem[];
}

/* ------------------------------------------------------------------ */
/* Worker RPC protocol                                                  */
/* ------------------------------------------------------------------ */

/**
 * Normalized, plain-serializable payload produced on the main thread by
 * `parse/ingestFromZip.ts` and handed to the worker for the SQLite transaction.
 * (Parsing must run on the main thread because `QtiAdapter` needs `DOMParser`.)
 */
export interface IngestPayload {
	filename: string;
	sourceHash: string;
	assessmentId: string;
	title: string;
	language: string;
	metadata: Record<string, unknown>;
	questions: IngestQuestion[];
	assets: IngestAsset[];
}

export interface IngestQuestion {
	qtiIdentifier: string;
	title: string;
	type: ItemType;
	promptHtml: string;
	promptText: string;
	answerText: string;
	language: string;
	rawXml: string;
	metadata: Record<string, unknown>;
	answers: LibraryAnswer[];
	competencies: LibraryCompetency[];
	assetRefs: string[];
}

export interface IngestAsset {
	questionIdentifier: string | null;
	path: string;
	mime: string;
	bytes: Uint8Array;
}

/** Map of command name → { request payload, response data }. */
export interface LibraryCommandMap {
	'db:create': { req: { appVersion?: string }; res: LibraryDbInfo };
	'db:restore': { req: Record<string, never>; res: LibraryDbInfo | null };
	'db:open': { req: { bytes: Uint8Array; name?: string }; res: LibraryDbInfo };
	'db:export': { req: Record<string, never>; res: { bytes: Uint8Array } };
	'db:getInfo': { req: Record<string, never>; res: LibraryDbInfo };
	'db:migrate': { req: Record<string, never>; res: LibraryDbInfo };
	'test:analyzeZip': { req: { payload: IngestPayload }; res: LibraryTestImportSummary };
	'test:ingestZip': { req: { payload: IngestPayload }; res: LibraryTestImportSummary };
	'search:questions': { req: { filters: LibrarySearchFilters }; res: LibrarySearchResponse };
	'search:facets': { req: Record<string, never>; res: LibraryFacets };
	'question:get': { req: { id: number }; res: LibraryQuestion };
	'question:getAssets': { req: { id: number }; res: LibraryAssetBlob[] };
	'sql:query': { req: { sql: string; limit?: number }; res: LibrarySqlResult };
	'fakeExam:list': { req: Record<string, never>; res: LibraryFakeExamSummary[] };
	'fakeExam:get': { req: { id: number }; res: LibraryFakeExam };
	'fakeExam:create': { req: { title: string; language?: string }; res: LibraryFakeExam };
	'fakeExam:rename': { req: { id: number; title: string }; res: LibraryFakeExam };
	'fakeExam:delete': { req: { id: number }; res: Record<string, never> };
	'fakeExam:addItems': { req: { examId: number; questionIds: number[] }; res: LibraryFakeExam };
	'fakeExam:removeItem': { req: { itemId: number }; res: LibraryFakeExam };
	'fakeExam:reorderItems': { req: { examId: number; orderedItemIds: number[] }; res: LibraryFakeExam };
	'fakeExam:getItemAssets': { req: { itemId: number }; res: LibraryAssetBlob[] };
}

/** An asset's raw bytes, returned for rendering question images. */
export interface LibraryAssetBlob {
	path: string;
	mime: string;
	bytes: Uint8Array;
}

export type LibraryCommand = keyof LibraryCommandMap;

/** Request envelope (main thread → worker). */
export interface LibraryRequest<C extends LibraryCommand = LibraryCommand> {
	id: number;
	command: C;
	data: LibraryCommandMap[C]['req'];
}

/** Response envelope (worker → main thread). */
export type LibraryResponse<C extends LibraryCommand = LibraryCommand> =
	| { id: number; ok: true; data: LibraryCommandMap[C]['res'] }
	| { id: number; ok: false; error: string };

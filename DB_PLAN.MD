# TAO Question Library Database Plan

## Summary
Build a new `/library` module for a client-only, portable SQLite-backed question database. Users can create/open a `.taodb` SQLite file, upload TAO QTI ZIP exports, ingest them into the database, search questions quickly by text or metadata, and export the updated DB file.

Chosen defaults:
- Browser DB: SQLite WASM file, backed by OPFS when available.
- QTI scope: TAO ZIP exports first.
- Versioning: local schema + DB content version, no remote “latest” check.
- UI: new Library route/module.

## Key Changes
- Add a new Library route with three main surfaces:
  - DB panel: create/open `.taodb`, show schema/content version, export DB.
  - Ingest panel: upload TAO `.zip`, parse, preview summary, import.
  - Search panel: query text, filter by test, competency, indicator, type, and open question detail.
- Add `@sqlite.org/sqlite-wasm` and run all DB work in a Web Worker so import/search does not block the UI.
- Store the active working DB in OPFS when supported; otherwise use in-memory SQLite and require export/download to keep changes.
- Reuse the existing ZIP/QTI parsing logic, but split it into a normalized parser for database ingestion instead of storing DOM `Element[]`.
- Sanitize imported HTML before rendering previews. Store raw XML separately for audit/debug/export use.

## Data Model And Interfaces
SQLite schema v1:
- `db_meta`: `database_id`, `schema_version`, `content_version`, `content_hash`, `created_at`, `updated_at`, `app_version`.
- `tests`: one row per imported ZIP/test version, with filename, source hash, title, import date, question count, metadata JSON.
- `questions`: normalized question rows with stable ID, test ID, QTI identifier, title, type, prompt HTML/text, answer text, language, metadata JSON.
- `answers`: answer rows with question ID, identifier, position, text HTML/text, score, correct flag.
- `competencies`: normalized competency code/label/description.
- `question_competencies`: many-to-many relation.
- `assets`: optional images/media from the ZIP, keyed by test/question/path.
- `questions_fts`: SQLite FTS5 virtual table for title, prompt, answers, competency, indicator, metadata text.

Public TypeScript interfaces:
- `LibraryDbInfo`: database ID, schema version, content version, status, counts, timestamps.
- `LibraryTestImportSummary`: filename, hash, title, question count, parse errors, duplicate status.
- `LibraryQuestion`: normalized question, answers, competencies, metadata, optional asset refs.
- `LibrarySearchFilters`: text, testId, competency, indicator, type, limit, offset.
- `LibrarySearchResult`: question summary, test title, rank, highlighted snippet.

Worker commands:
- `db:create`
- `db:open`
- `db:export`
- `db:getInfo`
- `test:analyzeZip`
- `test:ingestZip`
- `search:questions`
- `question:get`
- `db:migrate`

## Ingest And Search Behavior
- Ingest pipeline: unzip → parse `imsmanifest.xml` and item XML → normalize text/HTML → extract answers/metadata/assets → compute hashes → write in one SQLite transaction.
- Duplicate policy: if the exact ZIP hash already exists, skip by default and show “already imported”; if same title but different hash, create a new test version.
- Version policy: every successful DB mutation increments `content_version` and updates `content_hash`. `schema_version` uses migrations and `PRAGMA user_version`.
- “Latest” means:
  - schema is latest if it matches the app’s `APP_LIBRARY_SCHEMA_VERSION`;
  - content is newer/older only when comparing two DB files with the same `database_id`;
  - different database IDs are shown as different libraries, not newer/older.
- Fast search:
  - use FTS5 `MATCH` with BM25 ranking and snippets;
  - use normal indexes for structured filters: `test_id`, `type`, competency code, indicator;
  - precompute searchable text during ingest;
  - execute search queries in the worker with pagination.

## Test Plan
- `bun run check` must pass with 0 errors and warnings.
- Add parser tests with small TAO XML fixtures:
  - QCM with correct answer mapping;
  - QO/open question;
  - instruction item;
  - competency/indicator metadata extraction;
  - invalid XML produces a parse error without crashing the full import.
- Add DB behavior tests or browser verification:
  - create DB → ingest ZIP → export → reopen → counts and version preserved;
  - duplicate ZIP is skipped;
  - changed ZIP creates a new test version;
  - search by prompt text, answer text, competency, indicator, and combined filters;
  - migration from schema v1 fixture works when schema later changes.
- Add performance instrumentation in the UI:
  - show import duration, parsed question count, skipped count, and search query time.
  - target search should remain effectively instant for normal local exam libraries; optimize from measured timings.

## Assumptions And References
- No server, login, cloud sync, or remote freshness check in v1.
- The user must export/download the `.taodb` file to carry the updated DB elsewhere; browsers cannot silently overwrite an uploaded local file.
- Generic IMS QTI compatibility is out of scope for v1; TAO exports are the supported import format.
- SQLite WASM/OPFS reference: https://sqlite.org/wasm
- SQLite FTS5 reference: https://sqlite.org/fts5.html

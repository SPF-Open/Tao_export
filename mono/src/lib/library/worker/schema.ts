import type { Database } from '@sqlite.org/sqlite-wasm';
import { APP_LIBRARY_SCHEMA_VERSION } from '../types.js';

/**
 * Schema definition and migration runner for the library database.
 *
 * Schema version is tracked with `PRAGMA user_version`. Migrations are an
 * ordered list; each step upgrades the DB from `version - 1` to `version`.
 * The v1 step creates the initial schema. New versions append a step here and
 * bump {@link APP_LIBRARY_SCHEMA_VERSION} in `types.ts`.
 */

const SCHEMA_V1 = /* sql */ `
CREATE TABLE db_meta (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  database_id     TEXT NOT NULL,
  schema_version  INTEGER NOT NULL,
  content_version INTEGER NOT NULL DEFAULT 0,
  content_hash    TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  app_version     TEXT NOT NULL DEFAULT ''
);

CREATE TABLE tests (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  filename       TEXT NOT NULL,
  source_hash    TEXT NOT NULL UNIQUE,
  title          TEXT NOT NULL,
  assessment_id  TEXT NOT NULL,
  imported_at    TEXT NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 0,
  metadata_json  TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE questions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id        INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  qti_identifier TEXT NOT NULL,
  title          TEXT NOT NULL DEFAULT '',
  type           TEXT NOT NULL DEFAULT 'unknown',
  prompt_html    TEXT NOT NULL DEFAULT '',
  prompt_text    TEXT NOT NULL DEFAULT '',
  answer_text    TEXT NOT NULL DEFAULT '',
  language       TEXT NOT NULL DEFAULT '',
  raw_xml        TEXT NOT NULL DEFAULT '',
  metadata_json  TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE answers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  identifier  TEXT NOT NULL DEFAULT '',
  position    INTEGER NOT NULL DEFAULT 0,
  text_html   TEXT NOT NULL DEFAULT '',
  text_text   TEXT NOT NULL DEFAULT '',
  score       REAL,
  is_correct  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE competencies (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE question_competencies (
  question_id   INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  competency_id INTEGER NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  indicator     TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (question_id, competency_id, indicator)
);

CREATE TABLE assets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id     INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  path        TEXT NOT NULL,
  mime        TEXT NOT NULL DEFAULT '',
  bytes       BLOB
);

CREATE INDEX idx_questions_test ON questions(test_id);
CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_qc_question ON question_competencies(question_id);
CREATE INDEX idx_qc_competency ON question_competencies(competency_id);
CREATE INDEX idx_qc_indicator ON question_competencies(indicator);
CREATE INDEX idx_assets_test ON assets(test_id);
CREATE INDEX idx_assets_question ON assets(question_id);

-- FTS5 index over the searchable text of each question. It is a regular
-- (content-bearing) FTS table so that snippet()/highlight() work; rows share
-- the questions.id rowid and are written during ingest.
CREATE VIRTUAL TABLE questions_fts USING fts5(
  title,
  prompt_text,
  answer_text,
  competency_text,
  indicator,
  metadata_text,
  tokenize='unicode61 remove_diacritics 2'
);
`;

/** A single forward migration step. */
interface Migration {
	version: number;
	up: (db: Database) => void;
}

const MIGRATIONS: Migration[] = [
	{
		version: 1,
		up: (db) => {
			db.exec(SCHEMA_V1);
		}
	}
	// Future: { version: 2, up: (db) => db.exec('ALTER TABLE ...') }
];

/** Reads the current schema version from `PRAGMA user_version`. */
export function getUserVersion(db: Database): number {
	return Number(db.selectValue('PRAGMA user_version') ?? 0);
}

function setUserVersion(db: Database, version: number): void {
	// PRAGMA does not accept bound parameters; version is a trusted integer.
	db.exec(`PRAGMA user_version = ${Math.trunc(version)}`);
}

/**
 * Applies every migration whose version is greater than the DB's current
 * `user_version`, in order, each in its own transaction. Returns the resulting
 * schema version. Safe to call on every open.
 */
export function migrate(db: Database): number {
	let current = getUserVersion(db);
	for (const m of MIGRATIONS) {
		if (m.version <= current) continue;
		db.exec('BEGIN');
		try {
			m.up(db);
			setUserVersion(db, m.version);
			db.exec('COMMIT');
			current = m.version;
		} catch (err) {
			db.exec('ROLLBACK');
			throw err;
		}
	}
	return current;
}

/** The schema version this build of the app targets. */
export const TARGET_SCHEMA_VERSION = APP_LIBRARY_SCHEMA_VERSION;

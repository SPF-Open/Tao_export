/**
 * Human-facing documentation of the library SQLite schema, used by the query
 * console modal to draw an ER diagram, explain each table/column, and offer
 * example queries that highlight the tables/columns they touch.
 *
 * Coordinates are in the diagram's fixed pixel stage (see {@link STAGE}); the
 * SVG edge layer shares the same coordinate system so connectors line up.
 */

export interface ColumnDoc {
	name: string;
	desc: string;
	/** Primary key marker. */
	pk?: boolean;
	/** Table this column references (foreign key), shown as a link. */
	ref?: string;
}

export interface TableDoc {
	name: string;
	desc: string;
	/** Top-left position of the card in the diagram stage. */
	x: number;
	y: number;
	columns: ColumnDoc[];
}

export interface EdgeDoc {
	from: string;
	to: string;
	label: string;
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

export interface ExampleDoc {
	title: string;
	description: string;
	sql: string;
	/** Tables this example reads from (highlighted in the diagram). */
	tables: string[];
	/** Columns per table this example references (highlighted within cards). */
	columns: Record<string, string[]>;
}

/** Fixed pixel canvas the diagram is laid out in. */
export const STAGE = { width: 900, height: 540 };

export const SCHEMA_TABLES: TableDoc[] = [
	{
		name: 'db_meta',
		desc: 'Single-row metadata: identity, schema/content versions and hash.',
		x: 16,
		y: 16,
		columns: [
			{ name: 'database_id', desc: 'Stable id identifying this library.' },
			{ name: 'schema_version', desc: 'Schema version (PRAGMA user_version).' },
			{ name: 'content_version', desc: 'Bumps on every successful mutation.' }
		]
	},
	{
		name: 'tests',
		desc: 'One row per imported TAO ZIP (a test/version).',
		x: 360,
		y: 16,
		columns: [
			{ name: 'id', desc: 'Primary key.', pk: true },
			{ name: 'title', desc: 'Test title from the QTI manifest.' },
			{ name: 'source_hash', desc: 'Hash of the ZIP (dedupe key).' },
			{ name: 'question_count', desc: 'Number of questions imported.' }
		]
	},
	{
		name: 'questions',
		desc: 'Normalized question rows.',
		x: 360,
		y: 196,
		columns: [
			{ name: 'id', desc: 'Primary key (also the FTS rowid).', pk: true },
			{ name: 'test_id', desc: 'Owning test.', ref: 'tests' },
			{ name: 'type', desc: 'single-choice, multiple-choice, text, …' },
			{ name: 'language', desc: 'Question language (e.g. fr, nl).' },
			{ name: 'prompt_text', desc: 'Plain-text prompt (searchable).' }
		]
	},
	{
		name: 'answers',
		desc: 'Answer/choice rows for a question.',
		x: 360,
		y: 404,
		columns: [
			{ name: 'id', desc: 'Primary key.', pk: true },
			{ name: 'question_id', desc: 'Owning question.', ref: 'questions' },
			{ name: 'is_correct', desc: '1 when this choice is correct.' },
			{ name: 'text_text', desc: 'Plain-text answer.' }
		]
	},
	{
		name: 'questions_fts',
		desc: 'FTS5 virtual table (BM25 + snippets). rowid = questions.id.',
		x: 690,
		y: 196,
		columns: [
			{ name: 'rowid', desc: 'Matches questions.id.', ref: 'questions' },
			{ name: 'prompt_text', desc: 'Indexed prompt text.' },
			{ name: 'answer_text', desc: 'Indexed answer text.' }
		]
	},
	{
		name: 'assets',
		desc: 'Images/media bytes extracted from the ZIP.',
		x: 690,
		y: 388,
		columns: [
			{ name: 'id', desc: 'Primary key.', pk: true },
			{ name: 'test_id', desc: 'Owning test.', ref: 'tests' },
			{ name: 'question_id', desc: 'Owning question (nullable).', ref: 'questions' },
			{ name: 'mime', desc: 'Asset MIME type.' }
		]
	},
	{
		name: 'question_competencies',
		desc: 'Many-to-many link between questions and competencies.',
		x: 96,
		y: 212,
		columns: [
			{ name: 'question_id', desc: 'Linked question.', ref: 'questions' },
			{ name: 'competency_id', desc: 'Linked competency.', ref: 'competencies' },
			{ name: 'indicator', desc: 'Indicator code for the pairing.' }
		]
	},
	{
		name: 'competencies',
		desc: 'Distinct competency code/label/description.',
		x: 16,
		y: 404,
		columns: [
			{ name: 'id', desc: 'Primary key.', pk: true },
			{ name: 'code', desc: 'Competency code (unique).' },
			{ name: 'label', desc: 'Human-readable label.' }
		]
	}
];

export const SCHEMA_EDGES: EdgeDoc[] = [
	{ from: 'tests', to: 'questions', label: '1:N', x1: 444, y1: 140, x2: 444, y2: 196 },
	{ from: 'questions', to: 'answers', label: '1:N', x1: 444, y1: 340, x2: 444, y2: 404 },
	{ from: 'questions', to: 'questions_fts', label: '1:1', x1: 528, y1: 248, x2: 690, y2: 248 },
	{ from: 'questions', to: 'question_competencies', label: '1:N', x1: 360, y1: 268, x2: 276, y2: 268 },
	{ from: 'competencies', to: 'question_competencies', label: '1:N', x1: 100, y1: 404, x2: 176, y2: 316 },
	{ from: 'tests', to: 'assets', label: '1:N', x1: 528, y1: 72, x2: 720, y2: 388 },
	{ from: 'questions', to: 'assets', label: '1:N', x1: 528, y1: 300, x2: 690, y2: 430 }
];

export const QUERY_EXAMPLES: ExampleDoc[] = [
	{
		title: 'Imported tests',
		description: 'List every imported test, newest first.',
		sql: 'SELECT title, question_count, imported_at\nFROM tests\nORDER BY imported_at DESC;',
		tables: ['tests'],
		columns: { tests: ['title', 'question_count'] }
	},
	{
		title: 'Questions in a test',
		description: 'All question titles and types for test #1.',
		sql: 'SELECT q.title, q.type\nFROM questions q\nWHERE q.test_id = 1;',
		tables: ['questions', 'tests'],
		columns: { questions: ['test_id', 'type'] }
	},
	{
		title: 'Correct answers',
		description: 'Join answers to their question and keep only correct ones.',
		sql: 'SELECT q.title, a.text_text\nFROM questions q\nJOIN answers a ON a.question_id = q.id\nWHERE a.is_correct = 1;',
		tables: ['questions', 'answers'],
		columns: { questions: ['id'], answers: ['question_id', 'is_correct', 'text_text'] }
	},
	{
		title: 'Questions per competency',
		description: 'Count questions linked to each competency.',
		sql: 'SELECT c.code, c.label, COUNT(*) AS questions\nFROM competencies c\nJOIN question_competencies qc ON qc.competency_id = c.id\nGROUP BY c.code, c.label\nORDER BY questions DESC;',
		tables: ['competencies', 'question_competencies'],
		columns: { competencies: ['code', 'label'], question_competencies: ['competency_id'] }
	},
	{
		title: 'Full-text search',
		description: 'Rank questions by an FTS5 MATCH with a highlighted snippet.',
		sql: "SELECT q.title,\n       snippet(questions_fts, 1, '[', ']', '…', 8) AS match\nFROM questions_fts\nJOIN questions q ON q.id = questions_fts.rowid\nWHERE questions_fts MATCH 'cell*'\nORDER BY bm25(questions_fts);",
		tables: ['questions_fts', 'questions'],
		columns: { questions_fts: ['prompt_text'], questions: ['title'] }
	}
];

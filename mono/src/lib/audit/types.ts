/**
 * Audit types and interfaces
 */

export interface ExcelConfig {
  rowOffset: number; // Starting row index (0-based, e.g. 17 means row 18)
  alternativeCount: number; // Number of answer options (typically 4)
  skipRows: number; // Skip rows between questions (e.g. 1 for blank row separator)
  answerLayout: 'same_column' | 'spread_columns'; // Whether answers are in same column as prompt or spread across columns
  ignoreTitleMismatch?: boolean; // Skip title mismatch checks (default: false)
  columns: {
    title?: string; // Column letter for question title (e.g. 'E')
    prompt: string; // Column letter for question body (e.g. 'F')
    answers?: string | string[]; // Single column letter (same_column) or array of columns (spread_columns)
    answerMarker?: string; // Column letter with X/x to mark correct answer (e.g. 'G')
    competency?: string; // Column letter for competency
    dimension?: string; // Column letter for dimension
    indicator?: string; // Column letter for indicator
  };
}

export interface ExcelQuestion {
  rowIndex: number;
  title?: string;
  prompt: string;
  answers: string[];
  correctAnswerIndex: number; // 0-based index of the correct answer
  competency?: string;
  dimension?: string;
  indicator?: string;
  metadata: Record<string, any>;
}

export interface QTIQuestion {
  id?: string;
  title?: string;
  prompt: string;
  answers: QTIAnswer[];
  type?: 'QCM' | 'QO' | 'Instruction';
  points?: number;
  metadata: Record<string, any>;
}

export interface QTIAnswer {
  text: string;
  correct: boolean;
  id?: string;
}

export interface MatchedPair {
  excel: ExcelQuestion;
  qti: QTIQuestion;
  score: number;
}

export interface ComparisonError {
  type:
    | 'prompt_mismatch'
    | 'title_mismatch'
    | 'answer_count_mismatch'
    | 'answer_text_mismatch'
    | 'multiple_correct_answers'
    | 'no_correct_answer'
    | 'correct_answer_position_mismatch'
    | 'randomization_flag_mismatch'
    | 'question_order_mismatch'
    | 'type_mismatch';
  severity: 'BLOQUANT' | 'MAJEUR' | 'MINEUR';
  detail?: {
    field?: string;
    excel?: string | number;
    qti?: string | number;
    index?: number;
    excelDiff?: DiffChunk[];
    qtiDiff?: DiffChunk[];
  };
}

export interface AuditResult {
  pair: MatchedPair;
  errors: ComparisonError[];
  hasCriticalErrors: boolean;
}

export interface AuditReport {
  summary: {
    total: number;
    matched: number;
    unmatched: number;
    bloquants: number;
    majeurs: number;
    mineurs: number;
    duplicateTitles: number;
    potentialCopyPasteErrors: number;
  };
  results: AuditResult[];
  unmatched: {
    excel: UnmatchedItem[];
    qti: UnmatchedItem[];
  };
  timestamp: string;
}

export interface NormalizationOptions {
  normalize_html: boolean;
  ignore_case: boolean;
  ignore_punctuation: boolean;
  trim: boolean;
  ignoreTitleMismatch?: boolean;
}

/**
 * Represents a chunk of text in a diff
 * - type: 'equal' for unchanged text, 'added' for new text, 'removed' for deleted text
 * - text: the actual text content
 */
export interface DiffChunk {
  type: 'equal' | 'added' | 'removed';
  text: string;
}

/**
 * Scoring breakdown for a match attempt
 */
export interface ScoringDetails {
  titleScore: number;
  promptScore: number;
  answerScore: number;
  totalScore: number;
}

/**
 * Close match for an unmatched question (below threshold)
 * Shows why it didn't match and helps detect copy-paste errors
 */
export interface CloseMatch {
  question: QTIQuestion | ExcelQuestion;
  score: number;
  scoring: ScoringDetails;
  isCopyPasteError?: boolean;
  copyPasteReason?: string;
}

/**
 * Enhanced unmatched item with close matches and quality indicators
 */
export interface UnmatchedItem {
  question: ExcelQuestion | QTIQuestion;
  closeMatches: CloseMatch[];
  isDuplicate?: boolean;
  duplicateOf?: string | number;
}

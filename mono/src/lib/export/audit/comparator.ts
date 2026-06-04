import { normalize, generateDiff } from './normalize';
import type { MatchedPair, ComparisonError, NormalizationOptions } from './types';

const DEFAULT_NORM_OPTIONS: NormalizationOptions = {
  normalize_html: true,
  ignore_case: true,
  ignore_punctuation: false,
  trim: true,
};

/**
 * Compare Excel and QTI question within a matched pair
 * Returns array of errors found
 */
export function compare(
  pair: MatchedPair,
  options?: Partial<NormalizationOptions> & { ignoreTitleMismatch?: boolean }
): ComparisonError[] {
  const opts = { ...DEFAULT_NORM_OPTIONS, ...options };
  const errors: ComparisonError[] = [];

  // Compare titles (unless disabled)
  if (!options?.ignoreTitleMismatch && pair.excel.title && pair.qti.title) {
    const excelTitle = normalize(pair.excel.title, opts);
    const qtiTitle = normalize(pair.qti.title, opts);

    if (excelTitle !== qtiTitle) {
      errors.push({
        type: 'title_mismatch',
        severity: 'MINEUR',
        detail: {
          field: 'title',
          excel: excelTitle,
          qti: qtiTitle,
          excelDiff: generateDiff(excelTitle, qtiTitle),
          qtiDiff: generateDiff(qtiTitle, excelTitle),
        },
      });
    }
  }

  // Compare prompts
  const excelPrompt = normalize(pair.excel.prompt, opts);
  const qtiPrompt = normalize(pair.qti.prompt, opts);

  if (excelPrompt !== qtiPrompt) {
    errors.push({
      type: 'prompt_mismatch',
      severity: 'MINEUR',
      detail: {
        field: 'prompt',
        excel: excelPrompt,
        qti: qtiPrompt,
        excelDiff: generateDiff(excelPrompt, qtiPrompt),
        qtiDiff: generateDiff(qtiPrompt, excelPrompt),
      },
    });
  }

  // Compare answers
  const answerErrors = compareAnswers(pair, opts);
  errors.push(...answerErrors);

  // Check for multiple correct answers
  const correctCount = pair.qti.answers.filter((a) => a.correct).length;
  if (correctCount > 1) {
    errors.push({
      type: 'multiple_correct_answers',
      severity: 'BLOQUANT',
      detail: {
        field: 'correct_answers',
        qti: correctCount,
      },
    });
  } else if (correctCount === 0) {
    errors.push({
      type: 'correct_answer_position_mismatch',
      severity: 'BLOQUANT',
      detail: {
        field: 'correct_answers',
        qti: 0,
      },
    });
  }

  // Check question type mismatch
  if (pair.qti.type && pair.excel.metadata.type && pair.qti.type !== pair.excel.metadata.type) {
    errors.push({
      type: 'type_mismatch',
      severity: 'MAJEUR',
      detail: {
        field: 'type',
        excel: pair.excel.metadata.type,
        qti: pair.qti.type,
      },
    });
  }

  return errors;
}

/**
 * Compare answer arrays between Excel and QTI
 */
function compareAnswers(pair: MatchedPair, options: NormalizationOptions): ComparisonError[] {
  const errors: ComparisonError[] = [];
  const excelAnswers = pair.excel.answers;
  const qtiAnswers = pair.qti.answers;

  // Check answer count
  if (excelAnswers.length !== qtiAnswers.length) {
    errors.push({
      type: 'answer_count_mismatch',
      severity: 'BLOQUANT',
      detail: {
        field: 'answer_count',
        excel: excelAnswers.length,
        qti: qtiAnswers.length,
      },
    });
  }

  // Compare answer texts (position by position)
  const minLen = Math.min(excelAnswers.length, qtiAnswers.length);
  for (let i = 0; i < minLen; i++) {
    const excelText = normalize(excelAnswers[i], options);
    const qtiText = normalize(qtiAnswers[i].text, options);

    if (excelText !== qtiText) {
      errors.push({
        type: 'answer_text_mismatch',
        severity: 'MINEUR',
        detail: {
          field: 'answer',
          index: i,
          excel: excelText,
          qti: qtiText,
          excelDiff: generateDiff(excelText, qtiText),
          qtiDiff: generateDiff(qtiText, excelText),
        },
      });
    }
  }

  // Check if correct answer position matches
  // Excel's correctAnswerIndex points to the correct answer position
  const excelCorrectPos = pair.excel.correctAnswerIndex;
  const qtiCorrectPos = qtiAnswers.findIndex((a) => a.correct);

  if (excelCorrectPos !== qtiCorrectPos) {
    errors.push({
      type: 'correct_answer_position_mismatch',
      severity: 'MAJEUR',
      detail: {
        field: 'correct_position',
        excel: excelCorrectPos,
        qti: qtiCorrectPos,
      },
    });
  }

  // Check for multiple correct answers in QTI
  const correctCount = qtiAnswers.filter((a) => a.correct).length;
  if (correctCount === 0) {
    errors.push({
      type: 'no_correct_answer',
      severity: 'BLOQUANT',
      detail: {
        field: 'correct_answers',
        qti: 0,
      },
    });
  } else if (correctCount > 1) {
    errors.push({
      type: 'multiple_correct_answers',
      severity: 'BLOQUANT',
      detail: {
        field: 'correct_answers',
        qti: correctCount,
      },
    });
  }

  return errors;
}

/**
 * Compare sequences of matched pairs to detect order mismatches
 * Returns errors for each pair that has incorrect order
 */
export function compareSequence(
  pairs: MatchedPair[],
  excelOrder: number[],
  qtiOrder: number[]
): ComparisonError[] {
  const errors: ComparisonError[] = [];

  // Check if order is preserved or randomized
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const expectedIndex = excelOrder.indexOf(pair.excel.rowIndex);
    const actualIndex = qtiOrder.indexOf(i);

    if (expectedIndex !== actualIndex) {
      errors.push({
        type: 'question_order_mismatch',
        severity: 'MAJEUR',
        detail: {
          field: 'order',
          index: i,
          excel: expectedIndex,
          qti: actualIndex,
        },
      });
    }
  }

  return errors;
}

/**
 * Detect randomization flags in QTI
 * Compares if all randomizations are consistent
 */
export function detectRandomization(pair: MatchedPair): {
  isRandomized: boolean;
  flag?: string;
} {
  // Check metadata for shuffle flags
  const qtiMeta = pair.qti.metadata;

  if (qtiMeta?.shuffle === false || qtiMeta?.shuffle === 'false') {
    return { isRandomized: false, flag: 'fixed' };
  }

  if (qtiMeta?.shuffle === true || qtiMeta?.shuffle === 'true') {
    return { isRandomized: true, flag: 'shuffled' };
  }

  // Default: assume fixed (not randomized)
  return { isRandomized: false };
}

/**
 * Full audit comparison with all checks
 */
export function auditCompare(
  pair: MatchedPair,
  options?: Partial<NormalizationOptions>
): {
  errors: ComparisonError[];
  summary: {
    hasCriticalErrors: boolean;
    errorCount: Record<'BLOQUANT' | 'MAJEUR' | 'MINEUR', number>;
  };
} {
  const errors = compare(pair, options);

  const summary = {
    hasCriticalErrors: errors.some((e) => e.severity === 'BLOQUANT'),
    errorCount: {
      BLOQUANT: errors.filter((e) => e.severity === 'BLOQUANT').length,
      MAJEUR: errors.filter((e) => e.severity === 'MAJEUR').length,
      MINEUR: errors.filter((e) => e.severity === 'MINEUR').length,
    },
  };

  return { errors, summary };
}

import type { AuditReport, QTIQuestion } from './types';
import { parseExcelToAssessmentItems, type ExcelBinding } from './fromExcel';
import { assessmentItemsToQuestions } from './fromAssessment';
import { matchPositional } from './matcher';
import { compare } from './comparator';
import { buildReport } from './classifier';
import type { NormalizationOptions } from './types';

/**
 * Main audit orchestrator.
 * Runs the complete pipeline: parse → match → compare → classify → report.
 *
 * Both sides are parsed with the canonical app parsers: the Excel side via the
 * Import pipeline (`parseExcelToAssessmentItems`) and the QTI side via QtiAdapter
 * (already converted to `qtiQuestions` by the caller). Matching is positional —
 * the TAO export is generated from the Excel, so the two lists share order and
 * count, and any drift surfaces as critical unmatched items.
 */
export async function runAudit(
  excelBuffer: ArrayBuffer,
  qtiQuestions: QTIQuestion[],
  binding: ExcelBinding,
  options?: {
    normOptions?: Partial<NormalizationOptions>;
    sheetName?: string;
    ignoreTitleMismatch?: boolean;
  }
): Promise<{
  success: boolean;
  report?: AuditReport;
  error?: string;
  warnings?: string[];
}> {
  const warnings: string[] = [];

  try {
    // Step 1: Parse Excel with the Import pipeline, then normalize to QTIQuestion.
    console.log('[Audit] Step 1: Parsing Excel file (Import pipeline)...');
    let excelQuestions: QTIQuestion[];

    try {
      const excelItems = parseExcelToAssessmentItems(excelBuffer, binding, options?.sheetName);
      excelQuestions = assessmentItemsToQuestions(excelItems).map((q, i) => ({
        ...q,
        metadata: { ...q.metadata, excelRow: i + 1 },
      }));
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse Excel: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

    if (excelQuestions.length === 0) {
      return {
        success: false,
        error: 'No questions found in Excel file',
      };
    }

    console.log(`[Audit] Found ${excelQuestions.length} Excel questions, ${qtiQuestions.length} QTI questions`);

    // Step 2: Positional matching (order-based).
    console.log('[Audit] Step 2: Matching Excel questions to QTI (positional)...');
    const { pairs, unmatchedExcel, unmatchedQTI } = matchPositional(
      excelQuestions,
      qtiQuestions,
      options?.normOptions,
      { ignoreTitleMismatch: options?.ignoreTitleMismatch }
    );

    if (excelQuestions.length !== qtiQuestions.length) {
      warnings.push(
        `Question count mismatch — Excel: ${excelQuestions.length}, QTI: ${qtiQuestions.length}. ${unmatchedExcel.length + unmatchedQTI.length} question(s) could not be paired.`
      );
    }

    // Step 3: Compare each matched pair.
    console.log('[Audit] Step 3: Comparing matched pairs...');
    const results = pairs.map((pair) => ({
      pair,
      errors: compare(pair, {
        ...options?.normOptions,
        ignoreTitleMismatch: options?.ignoreTitleMismatch,
      }),
    }));

    // Step 4: Build report (unmatched items are folded into the critical count).
    console.log('[Audit] Step 4: Building report...');
    const report = buildReport(pairs, results, unmatchedExcel, unmatchedQTI);

    console.log('[Audit] Audit complete:', {
      matched: report.summary.matched,
      unmatched: report.summary.unmatched,
      bloquants: report.summary.bloquants,
      majeurs: report.summary.majeurs,
      mineurs: report.summary.mineurs,
    });

    return {
      success: true,
      report,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error during audit: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Lightweight audit for checking if QTI questions are valid
 * Used before full audit to validate structure
 */
export function validateQTIStructure(questions: QTIQuestion[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!questions || questions.length === 0) {
    errors.push('No questions provided');
    return { isValid: false, errors, warnings };
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    if (!q.prompt || q.prompt.trim().length === 0) {
      errors.push(`Question ${i + 1}: Missing prompt text`);
    }

    if (!q.answers || q.answers.length === 0) {
      errors.push(`Question ${i + 1}: No answers defined`);
    } else {
      const correctCount = q.answers.filter((a) => a.correct).length;

      if (correctCount === 0) {
        errors.push(`Question ${i + 1}: No correct answer marked`);
      } else if (correctCount > 1) {
        warnings.push(`Question ${i + 1}: Multiple correct answers (${correctCount})`);
      }

      if (q.answers.length > 10) {
        warnings.push(`Question ${i + 1}: Unusually many answers (${q.answers.length})`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get summary statistics about the audit progress
 */
export function getAuditProgress(
  totalExcel: number,
  matchedPairs: number,
  processedErrors: number
): {
  parseComplete: boolean;
  matchComplete: boolean;
  compareComplete: boolean;
  progress: number; // 0-1
} {
  return {
    parseComplete: totalExcel > 0,
    matchComplete: matchedPairs > 0,
    compareComplete: processedErrors > 0,
    progress: processedErrors > 0 ? 1 : matchedPairs > 0 ? 0.7 : totalExcel > 0 ? 0.3 : 0,
  };
}

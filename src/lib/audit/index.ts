import type { ExcelConfig, AuditReport, ExcelQuestion, QTIQuestion } from './types';
import { parseExcel } from './excel-parser';
import { matchQuestions } from './matcher';
import { compare } from './comparator';
import { buildReport } from './classifier';
import type { NormalizationOptions } from './types';

/**
 * Main audit orchestrator
 * Runs the complete pipeline: parse → match → compare → classify → report
 */
export async function runAudit(
  excelBuffer: ArrayBuffer,
  qtiQuestions: QTIQuestion[],
  config: ExcelConfig,
  options?: {
    threshold?: number;
    normOptions?: Partial<NormalizationOptions>;
    sheetName?: string;
  }
): Promise<{
  success: boolean;
  report?: AuditReport;
  error?: string;
  warnings?: string[];
}> {
  const warnings: string[] = [];

  try {
    // Step 1: Parse Excel
    console.log('[Audit] Step 1: Parsing Excel file...');
    let excelQuestions: ExcelQuestion[];

    try {
      excelQuestions = await parseExcel(excelBuffer, config, options?.sheetName);
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

    console.log(`[Audit] Found ${excelQuestions.length} questions in Excel`);

    // Step 2: Match questions
    console.log('[Audit] Step 2: Matching Excel questions to QTI...');
    const threshold = options?.threshold ?? 0.85;
    const { pairs, unmatchedExcel, unmatchedQTI } = matchQuestions(
      excelQuestions,
      qtiQuestions,
      threshold,
      options?.normOptions,
      { ignoreTitleMismatch: config.ignoreTitleMismatch }
    );

    console.log(`[Audit] Matched ${pairs.length} pairs`);
    if (unmatchedExcel.length > 0) {
      warnings.push(`${unmatchedExcel.length} Excel questions had no match (similarity < ${threshold})`);
    }
    if (unmatchedQTI.length > 0) {
      warnings.push(`${unmatchedQTI.length} QTI questions were not matched to Excel`);
    }

    // Step 3: Compare each pair
    console.log('[Audit] Step 3: Comparing matched pairs...');
    const results = pairs.map((pair) => ({
      pair,
      errors: compare(pair, {
        ...options?.normOptions,
        ignoreTitleMismatch: config.ignoreTitleMismatch,
      }),
    }));

    // Step 4: Build report
    console.log('[Audit] Step 4: Building report...');
    const report = buildReport(pairs, results, unmatchedExcel, unmatchedQTI);

    console.log('[Audit] Audit complete:', {
      matched: report.summary.matched,
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

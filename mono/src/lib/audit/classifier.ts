import type { ComparisonError, AuditResult, AuditReport, MatchedPair, UnmatchedItem, ExcelQuestion, QTIQuestion } from './types';

/**
 * Classify an individual error by severity
 * Already has severity assigned in comparator, but this allows recalibration
 */
export function classifyError(error: ComparisonError): 'BLOQUANT' | 'MAJEUR' | 'MINEUR' {
  // Already assigned in comparator, but this function allows override logic
  return error.severity;
}

/**
 * Build audit report from matched pairs and errors
 */
export function buildReport(
  pairs: MatchedPair[],
  results: Array<{ pair: MatchedPair; errors: ComparisonError[] }>,
  unmatchedExcel: UnmatchedItem[],
  unmatchedQTI: UnmatchedItem[]
): AuditReport {
  const errorCounts = {
    BLOQUANT: 0,
    MAJEUR: 0,
    MINEUR: 0,
  };

  const auditResults: AuditResult[] = results.map(({ pair, errors }) => {
    // Count errors
    errors.forEach((e) => {
      errorCounts[e.severity]++;
    });

    return {
      pair,
      errors,
      hasCriticalErrors: errors.some((e) => e.severity === 'BLOQUANT'),
    };
  });

  // Count data quality issues
  const copyPasteErrors = [...unmatchedExcel, ...unmatchedQTI].filter(
    (item) => item.closeMatches.some((m) => m.isCopyPasteError)
  ).length;

  // Count duplicate titles
  const allItems = [...unmatchedExcel, ...unmatchedQTI];
  const titleCounts: Record<string, number> = {};
  allItems.forEach((item) => {
    const title = (item.question as any).title || '';
    if (title) {
      titleCounts[title] = (titleCounts[title] || 0) + 1;
    }
  });
  const duplicateTitles = Object.values(titleCounts).filter((count) => count > 1).length;

  // An unmatched question (on either side) is a critical failure: these are
  // compliance-critical comparisons, so "no match" must never read as OK. Fold
  // the unmatched count into the BLOQUANT total so the audit fails.
  const unmatchedCount = unmatchedExcel.length + unmatchedQTI.length;

  return {
    summary: {
      total: pairs.length,
      matched: pairs.length,
      unmatched: unmatchedCount,
      bloquants: errorCounts.BLOQUANT + unmatchedCount,
      majeurs: errorCounts.MAJEUR,
      mineurs: errorCounts.MINEUR,
      duplicateTitles,
      potentialCopyPasteErrors: copyPasteErrors,
    },
    results: auditResults,
    unmatched: {
      excel: unmatchedExcel,
      qti: unmatchedQTI,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate statistics from audit report
 */
export function calculateStatistics(report: AuditReport): {
  matchRate: number;
  criticalIssueRate: number;
  averageIssuesPerQuestion: number;
  severityCounts: Record<'BLOQUANT' | 'MAJEUR' | 'MINEUR', number>;
  topErrorTypes: Array<{ type: string; count: number }>;
} {
  const total = report.summary.total;
  const matched = report.summary.matched;
  const withCritical = report.results.filter((r) => r.hasCriticalErrors).length;

  // Count error types
  const errorTypeCounts: Record<string, number> = {};
  let totalErrors = 0;

  for (const result of report.results) {
    for (const error of result.errors) {
      errorTypeCounts[error.type] = (errorTypeCounts[error.type] || 0) + 1;
      totalErrors++;
    }
  }

  const topErrorTypes = Object.entries(errorTypeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    matchRate: total > 0 ? matched / total : 0,
    criticalIssueRate: matched > 0 ? withCritical / matched : 0,
    averageIssuesPerQuestion: matched > 0 ? totalErrors / matched : 0,
    severityCounts: {
      BLOQUANT: report.summary.bloquants,
      MAJEUR: report.summary.majeurs,
      MINEUR: report.summary.mineurs,
    },
    topErrorTypes,
  };
}

/**
 * Generate summary for display/export
 */
export function generateSummary(report: AuditReport): string {
  const stats = calculateStatistics(report);

  const lines = [
    '# Audit TAO - Summary',
    '',
    '## Overview',
    `- **Timestamp**: ${new Date(report.timestamp).toLocaleString()}`,
    `- **Total Questions Compared**: ${report.summary.total}`,
    `- **Matched Pairs**: ${report.summary.matched}`,
    `- **Unmatched**: Excel: ${report.unmatched.excel.length}, QTI: ${report.unmatched.qti.length}`,
    '',
    '## Issues Found',
    `- **Bloquants (Critical)**: ${report.summary.bloquants}`,
    `- **Majeurs (Major)**: ${report.summary.majeurs}`,
    `- **Mineurs (Minor)**: ${report.summary.mineurs}`,
    '',
    '## Statistics',
    `- **Match Rate**: ${(stats.matchRate * 100).toFixed(1)}%`,
    `- **Critical Issue Rate**: ${(stats.criticalIssueRate * 100).toFixed(1)}% of matched pairs`,
    `- **Avg Issues/Question**: ${stats.averageIssuesPerQuestion.toFixed(2)}`,
    '',
  ];

  if (stats.topErrorTypes.length > 0) {
    lines.push('## Top Issues');
    for (const { type, count } of stats.topErrorTypes) {
      lines.push(`- ${type}: ${count} occurrences`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Filter results by severity
 */
export function filterBySeverity(
  results: AuditResult[],
  severity: 'BLOQUANT' | 'MAJEUR' | 'MINEUR'
): AuditResult[] {
  return results.filter((r) => r.errors.some((e) => e.severity === severity));
}

/**
 * Get questions with critical errors
 */
export function getCriticalQuestions(report: AuditReport): AuditResult[] {
  return report.results.filter((r) => r.hasCriticalErrors);
}

/**
 * Export report to JSON
 */
export function exportReportJSON(report: AuditReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Create a concise audit summary for quick review
 */
export function createQuickSummary(report: AuditReport): {
  status: 'PASS' | 'WARNING' | 'FAIL';
  issues: {
    critical: number;
    major: number;
    minor: number;
  };
  recommendation: string;
} {
  const bloquants = report.summary.bloquants;
  const majeurs = report.summary.majeurs;
  const unmatched = report.summary.unmatched;

  let status: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
  let recommendation = 'All checks passed. Data is consistent.';

  if (unmatched > 0) {
    status = 'FAIL';
    recommendation = `${unmatched} question(s) could not be matched (count/order mismatch between Excel and QTI). These are treated as critical and must be resolved.`;
  } else if (bloquants > 0) {
    status = 'FAIL';
    recommendation = `${bloquants} critical issue(s) found. Must be resolved before deployment.`;
  } else if (majeurs > 0) {
    status = 'WARNING';
    recommendation = `${majeurs} major issue(s) found. Review and address before going live.`;
  }

  return {
    status,
    issues: {
      critical: bloquants,
      major: majeurs,
      minor: report.summary.mineurs,
    },
    recommendation,
  };
}

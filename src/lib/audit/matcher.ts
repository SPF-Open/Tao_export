import { normalize, jaroWinkler } from './normalize';
import type { ExcelQuestion, QTIQuestion, MatchedPair, NormalizationOptions } from './types';

interface MatchScore {
  excelIdx: number;
  qtiIdx: number;
  score: number;
  details: {
    titleScore: number;
    promptScore: number;
    answerScore: number;
  };
}

/**
 * Match Excel questions to QTI questions using similarity scoring
 * Ensures 1:1 bidirectional mapping (each Excel matches max one QTI and vice versa)
 *
 * @param excelQs - Questions parsed from Excel
 * @param qtiQs - Questions from QTI
 * @param threshold - Similarity threshold (0-1, default 0.85)
 * @param normOptions - Text normalization options
 * @param options - Matching options (ignoreTitleMismatch)
 * @returns Matched pairs and unmatched items
 */
export function matchQuestions(
  excelQs: ExcelQuestion[],
  qtiQs: QTIQuestion[],
  threshold: number = 0.85,
  normOptions?: Partial<NormalizationOptions>,
  options?: { ignoreTitleMismatch?: boolean }
): {
  pairs: MatchedPair[];
  unmatchedExcel: ExcelQuestion[];
  unmatchedQTI: QTIQuestion[];
} {
  const pairs: MatchedPair[] = [];
  const matchedQTIIndices = new Set<number>();
  const matchedExcelIndices = new Set<number>();

  // Calculate all similarity scores
  const scores: MatchScore[] = [];

  for (let ei = 0; ei < excelQs.length; ei++) {
    for (let qi = 0; qi < qtiQs.length; qi++) {
      const score = calculateSimilarity(excelQs[ei], qtiQs[qi], normOptions, options?.ignoreTitleMismatch);

      scores.push({
        excelIdx: ei,
        qtiIdx: qi,
        score: score.total,
        details: score.details,
      });
    }
  }

  // Sort by score descending to process best matches first
  scores.sort((a, b) => b.score - a.score);

  // Greedy matching: assign best scores that haven't been matched yet
  for (const scoreEntry of scores) {
    if (scoreEntry.score >= threshold) {
      // Only match if both questions haven't been matched yet
      if (!matchedExcelIndices.has(scoreEntry.excelIdx) && !matchedQTIIndices.has(scoreEntry.qtiIdx)) {
        pairs.push({
          excel: excelQs[scoreEntry.excelIdx],
          qti: qtiQs[scoreEntry.qtiIdx],
          score: scoreEntry.score,
        });

        matchedExcelIndices.add(scoreEntry.excelIdx);
        matchedQTIIndices.add(scoreEntry.qtiIdx);
      }
    }
  }

  // Collect unmatched
  const unmatchedExcel = excelQs.filter((_, i) => !matchedExcelIndices.has(i));
  const unmatchedQTI = qtiQs.filter((_, i) => !matchedQTIIndices.has(i));

  return { pairs, unmatchedExcel, unmatchedQTI };
}

/**
 * Calculate similarity between Excel and QTI question
 * Returns weighted score and component scores
 */
function calculateSimilarity(
  excelQ: ExcelQuestion,
  qtiQ: QTIQuestion,
  normOptions?: Partial<NormalizationOptions>,
  ignoreTitleMismatch?: boolean
): {
  total: number;
  details: {
    titleScore: number;
    promptScore: number;
    answerScore: number;
  };
} {
  // If title mismatch is ignored, use neutral score for title (1.0)
  let titleScore = 1.0;
  if (!ignoreTitleMismatch && excelQ.title && qtiQ.title) {
    titleScore = scoreField(excelQ.title, qtiQ.title, normOptions);
  }

  const promptScore = scoreField(excelQ.prompt, qtiQ.prompt, normOptions);

  const answerScore = scoreAnswers(excelQ.answers, qtiQ.answers, normOptions);

  // Adjust weighting: when title is ignored, shift its weight to prompt importance
  // Normal weights: prompt 50%, answer 30%, title 20%
  // With title ignored: prompt 70%, answer 30%, title 0%
  const total = ignoreTitleMismatch
    ? promptScore * 0.7 + answerScore * 0.3
    : promptScore * 0.5 + answerScore * 0.3 + titleScore * 0.2;

  return {
    total,
    details: { titleScore, promptScore, answerScore },
  };
}

/**
 * Score a single text field
 */
function scoreField(
  text1: string,
  text2: string,
  normOptions?: Partial<NormalizationOptions>
): number {
  const n1 = normalize(text1, normOptions);
  const n2 = normalize(text2, normOptions);

  if (!n1 || !n2) return 0;

  return jaroWinkler(n1, n2);
}

/**
 * Score answer matching
 * Compares answer count and text similarity
 */
function scoreAnswers(
  excelAnswers: string[],
  qtiAnswers: any[],
  normOptions?: Partial<NormalizationOptions>
): number {
  // Normalize QTI answers to text format
  const qtiTexts = qtiAnswers.map((a) => (typeof a === 'string' ? a : a.text || ''));

  // If answer count mismatch, reduce score significantly
  if (excelAnswers.length !== qtiTexts.length) {
    // Still give partial credit for similar answer sets
    const minLen = Math.min(excelAnswers.length, qtiTexts.length);
    if (minLen === 0) return 0;

    // Score only the overlapping answers
    let matchScore = 0;
    for (let i = 0; i < minLen; i++) {
      matchScore += scoreField(excelAnswers[i], qtiTexts[i], normOptions);
    }

    // Penalize count mismatch
    const countDiff = Math.abs(excelAnswers.length - qtiTexts.length);
    const countPenalty = Math.min(1, countDiff * 0.15);

    return (matchScore / minLen) * (1 - countPenalty);
  }

  // Same number of answers - score each pair
  let totalScore = 0;
  for (let i = 0; i < excelAnswers.length; i++) {
    totalScore += scoreField(excelAnswers[i], qtiTexts[i], normOptions);
  }

  return totalScore / excelAnswers.length;
}

/**
 * Find best match for a single Excel question
 * Useful for incremental matching or debugging
 */
export function findBestMatch(
  excelQ: ExcelQuestion,
  qtiQs: QTIQuestion[],
  normOptions?: Partial<NormalizationOptions>
): {
  best: QTIQuestion | null;
  score: number;
  topMatches: Array<{ question: QTIQuestion; score: number }>;
} {
  const scores = qtiQs.map((q) => ({
    question: q,
    score: calculateSimilarity(excelQ, q, normOptions).total,
  }));

  scores.sort((a, b) => b.score - a.score);

  return {
    best: scores[0]?.question || null,
    score: scores[0]?.score || 0,
    topMatches: scores.slice(0, 5),
  };
}

/**
 * Batch matching with detailed match analysis
 */
export function analyzeMismatches(
  excelQs: ExcelQuestion[],
  qtiQs: QTIQuestion[],
  matchedPairs: MatchedPair[]
): {
  closeMatches: Array<{ excel: ExcelQuestion; best: QTIQuestion; score: number }>;
  noMatch: ExcelQuestion[];
  orphanedQTI: QTIQuestion[];
} {
  const matchedQTIIds = new Set(matchedPairs.map((p) => p.qti.id || p.qti.prompt));
  const matchedExcelIds = new Set(matchedPairs.map((p) => p.excel.rowIndex));

  const closeMatches: Array<{ excel: ExcelQuestion; best: QTIQuestion; score: number }> = [];
  const noMatch: ExcelQuestion[] = [];

  for (const excelQ of excelQs) {
    if (matchedExcelIds.has(excelQ.rowIndex)) continue; // Already matched

    const result = findBestMatch(excelQ, qtiQs);
    if (result.best && result.score > 0.7) {
      // Close but not matched
      closeMatches.push({
        excel: excelQ,
        best: result.best,
        score: result.score,
      });
    } else {
      noMatch.push(excelQ);
    }
  }

  const orphanedQTI = qtiQs.filter((q) => !matchedQTIIds.has(q.id || q.prompt));

  return { closeMatches, noMatch, orphanedQTI };
}

import { normalize, jaroWinkler, generateDiff } from './normalize';
import type { ExcelQuestion, QTIQuestion, MatchedPair, NormalizationOptions, CloseMatch, UnmatchedItem, ScoringDetails } from './types';

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
 * @returns Matched pairs and unmatched items with close matches
 */
export function matchQuestions(
  excelQs: ExcelQuestion[],
  qtiQs: QTIQuestion[],
  threshold: number = 0.85,
  normOptions?: Partial<NormalizationOptions>,
  options?: { ignoreTitleMismatch?: boolean }
): {
  pairs: MatchedPair[];
  unmatchedExcel: UnmatchedItem[];
  unmatchedQTI: UnmatchedItem[];
} {
  const pairs: MatchedPair[] = [];
  const matchedQTIIndices = new Set<number>();
  const matchedExcelIndices = new Set<number>();

  // Calculate all similarity scores
  const scores: MatchScore[] = [];

  for (let ei = 0; ei < excelQs.length; ei++) {
    for (let qi = 0; qi < qtiQs.length; qi++) {
      const similarity = calculateSimilarity(excelQs[ei], qtiQs[qi], normOptions, options?.ignoreTitleMismatch);

      scores.push({
        excelIdx: ei,
        qtiIdx: qi,
        score: similarity.total,
        details: similarity.details,
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

  // Collect unmatched and find close matches
  const unmatchedExcelIndices = excelQs
    .map((_, i) => i)
    .filter((i) => !matchedExcelIndices.has(i));
  const unmatchedQTIIndices = qtiQs
    .map((_, i) => i)
    .filter((i) => !matchedQTIIndices.has(i));

  // Debug: Log first question matching scores
  if (excelQs.length > 0) {
    console.log('[Matcher] First Excel question matching scores:');
    const firstExcel = excelQs[0];
    const topScores = qtiQs.map((qtiQ, idx) => {
      const sim = calculateSimilarity(firstExcel, qtiQ, normOptions, options?.ignoreTitleMismatch);
      return { qtiIdx: idx, score: sim.total, details: sim.details };
    }).sort((a, b) => b.score - a.score).slice(0, 3);
    
    topScores.forEach((s, i) => {
      console.log(`  ${i + 1}. QTI question ${s.qtiIdx}: ${(s.score * 100).toFixed(1)}% (Prompt: ${(s.details.promptScore * 100).toFixed(0)}%, Answers: ${(s.details.answerScore * 100).toFixed(0)}%)`);
    });
  }

  // Find close matches for unmatched Excel questions
  const unmatchedExcel: UnmatchedItem[] = unmatchedExcelIndices.map((excelIdx) => {
    const excelQ = excelQs[excelIdx];
    
    // Find all QTI scores for this Excel question to get top 3
    const closeMatches = unmatchedQTIIndices
      .map((qtiIdx) => {
        const qtiQ = qtiQs[qtiIdx];
        const similarity = calculateSimilarity(excelQ, qtiQ, normOptions, options?.ignoreTitleMismatch);
        return {
          qtiIdx,
          qtiQ,
          ...similarity,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
      .map((match) => {
        const isCopyPaste = detectCopyPasteError(match.details);
        return {
          question: match.qtiQ,
          score: match.total,
          scoring: match.details,
          isCopyPasteError: isCopyPaste.detected,
          copyPasteReason: isCopyPaste.reason,
        } as CloseMatch;
      });

    return {
      question: excelQ,
      closeMatches,
    } as UnmatchedItem;
  });

  // Find close matches for unmatched QTI questions
  const unmatchedQTI: UnmatchedItem[] = unmatchedQTIIndices.map((qtiIdx) => {
    const qtiQ = qtiQs[qtiIdx];
    
    const closeMatches = unmatchedExcelIndices
      .map((excelIdx) => {
        const excelQ = excelQs[excelIdx];
        const similarity = calculateSimilarity(excelQ, qtiQ, normOptions, options?.ignoreTitleMismatch);
        return {
          excelIdx,
          excelQ,
          ...similarity,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
      .map((match) => {
        const isCopyPaste = detectCopyPasteError(match.details);
        return {
          question: match.excelQ,
          score: match.total,
          scoring: match.details,
          isCopyPasteError: isCopyPaste.detected,
          copyPasteReason: isCopyPaste.reason,
        } as CloseMatch;
      });

    return {
      question: qtiQ,
      closeMatches,
    } as UnmatchedItem;
  });

  return { pairs, unmatchedExcel, unmatchedQTI };
}

/**
 * Calculate similarity between Excel and QTI question
 * Returns weighted score and component scores
 * NEW WEIGHTING: Title is ignored (0%), Prompt 60%, Answers 40%
 */
function calculateSimilarity(
  excelQ: ExcelQuestion,
  qtiQ: QTIQuestion,
  normOptions?: Partial<NormalizationOptions>,
  ignoreTitleMismatch?: boolean
): {
  total: number;
  details: ScoringDetails;
} {
  // Calculate component scores
  const titleScore = excelQ.title && qtiQ.title ? scoreField(excelQ.title, qtiQ.title, normOptions) : 1.0;
  const promptScore = scoreField(excelQ.prompt, qtiQ.prompt, normOptions);
  const answerScore = scoreAnswers(excelQ.answers, qtiQ.answers, normOptions);

  // NEW WEIGHTING: Title is no longer used for matching (0%)
  // Prompt 60%, Answers 40%
  const total = promptScore * 0.6 + answerScore * 0.4;

  return {
    total,
    details: { titleScore, promptScore, answerScore, totalScore: total },
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

/**
 * Detect potential copy-paste errors by analyzing score patterns
 * Copy-paste errors typically have:
 * - One strong component (e.g., prompt > 0.9)
 * - One weak component (e.g., title < 0.4)
 */
function detectCopyPasteError(scoring: ScoringDetails): { detected: boolean; reason?: string } {
  const { promptScore, answerScore, titleScore } = scoring;

  // Strong prompt, weak title → likely copied content with new title
  if (promptScore > 0.88 && titleScore < 0.4) {
    return {
      detected: true,
      reason: `Prompt matches well (${(promptScore * 100).toFixed(0)}%) but title differs significantly (${(titleScore * 100).toFixed(0)}%) - possible content copy with new title`,
    };
  }

  // Strong answers, weak prompt → questions might be reordered or re-explained
  if (answerScore > 0.88 && promptScore < 0.6) {
    return {
      detected: true,
      reason: `Answers match very well (${(answerScore * 100).toFixed(0)}%) but prompt differs (${(promptScore * 100).toFixed(0)}%) - possible reordering or re-explanation`,
    };
  }

  // Strong answers and title, weak prompt → another reordering pattern
  if (answerScore > 0.88 && titleScore > 0.85 && promptScore < 0.5) {
    return {
      detected: true,
      reason: `Answers (${(answerScore * 100).toFixed(0)}%) and Title (${(titleScore * 100).toFixed(0)}%) match but prompt differs - possible question reordering`,
    };
  }

  return { detected: false };
}

/**
 * Diagnostic tool: Analyze why a specific Excel question doesn't match
 * Returns detailed scoring breakdown for debugging
 */
export function analyzeQuestionMatching(
  excelQ: ExcelQuestion,
  qtiQs: QTIQuestion[],
  threshold: number = 0.85,
  normOptions?: Partial<NormalizationOptions>
): {
  excelRowIndex: number;
  excelTitle?: string;
  excelPrompt: string;
  topMatchesBelowThreshold: Array<{
    qtiIndex: number;
    qtiTitle?: string;
    totalScore: number;
    promptScore: number;
    answerScore: number;
    titleScore: number;
    whyBelow: string;
  }>;
  topMatchesAboveThreshold?: Array<{
    qtiIndex: number;
    qtiTitle?: string;
    totalScore: number;
  }>;
} {
  const scores = qtiQs.map((qtiQ, idx) => {
    const sim = calculateSimilarity(excelQ, qtiQ, normOptions);
    return { idx, qtiQ, ...sim };
  }).sort((a, b) => b.total - a.total);

  const belowThreshold = scores.filter((s) => s.total < threshold).slice(0, 5);
  const aboveThreshold = scores.filter((s) => s.total >= threshold).slice(0, 3);

  return {
    excelRowIndex: excelQ.rowIndex,
    excelTitle: excelQ.title,
    excelPrompt: excelQ.prompt.substring(0, 150),
    topMatchesBelowThreshold: belowThreshold.map((s) => {
      const gap = threshold - s.total;
      let reason = '';
      if (s.details.promptScore < 0.6) {
        reason = `Prompt too low: ${(s.details.promptScore * 100).toFixed(0)}%`;
      } else if (s.details.answerScore < 0.4) {
        reason = `Answers too low: ${(s.details.answerScore * 100).toFixed(0)}%`;
      } else {
        reason = `Combined score ${(s.total * 100).toFixed(1)}% (gap: ${(gap * 100).toFixed(1)}%)`;
      }
      return {
        qtiIndex: s.idx,
        qtiTitle: s.qtiQ.title,
        totalScore: s.total,
        promptScore: s.details.promptScore,
        answerScore: s.details.answerScore,
        titleScore: s.details.titleScore,
        whyBelow: reason,
      };
    }),
    topMatchesAboveThreshold: aboveThreshold.map((s) => ({
      qtiIndex: s.idx,
      qtiTitle: s.qtiQ.title,
      totalScore: s.total,
    })),
  };
}

import { normalize, jaroWinkler } from './normalize';
import type {
  QTIQuestion,
  QTIAnswer,
  MatchedPair,
  NormalizationOptions,
  CloseMatch,
  UnmatchedItem,
  ScoringDetails,
} from './types';

/**
 * Positional (order-based) matching.
 *
 * The TAO QTI export is generated from the Excel source via the Import route, so
 * the two question lists share the same order and count. We therefore pair them
 * by index (question #i ↔ question #i) instead of fuzzy similarity. This is
 * deterministic: every question pairs up, and any count/order drift surfaces as
 * leftover unmatched items (treated as critical downstream).
 *
 * The per-pair similarity score is still computed, but only as a confidence/
 * diagnostic value for display — it never gates the match.
 *
 * @param excelQs - Excel-derived questions (from the Import pipeline)
 * @param qtiQs - QTI questions (from QtiAdapter)
 * @param normOptions - Text normalization options
 * @param options - Matching options (ignoreTitleMismatch)
 */
export function matchPositional(
  excelQs: QTIQuestion[],
  qtiQs: QTIQuestion[],
  normOptions?: Partial<NormalizationOptions>,
  options?: { ignoreTitleMismatch?: boolean }
): {
  pairs: MatchedPair[];
  unmatchedExcel: UnmatchedItem[];
  unmatchedQTI: UnmatchedItem[];
} {
  const pairs: MatchedPair[] = [];
  const n = Math.min(excelQs.length, qtiQs.length);

  for (let i = 0; i < n; i++) {
    const similarity = calculateSimilarity(excelQs[i], qtiQs[i], normOptions, options?.ignoreTitleMismatch);
    pairs.push({ excel: excelQs[i], qti: qtiQs[i], score: similarity.total });
  }

  // Anything past the shorter list has no positional counterpart.
  const unmatchedExcel: UnmatchedItem[] = excelQs.slice(n).map((excelQ) => ({
    question: excelQ,
    closeMatches: buildCloseMatches(excelQ, qtiQs, normOptions, options?.ignoreTitleMismatch),
  }));

  const unmatchedQTI: UnmatchedItem[] = qtiQs.slice(n).map((qtiQ) => ({
    question: qtiQ,
    closeMatches: buildCloseMatches(qtiQ, excelQs, normOptions, options?.ignoreTitleMismatch),
  }));

  return { pairs, unmatchedExcel, unmatchedQTI };
}

/** Top-3 most similar candidates, annotated with copy-paste heuristics. */
function buildCloseMatches(
  target: QTIQuestion,
  candidates: QTIQuestion[],
  normOptions?: Partial<NormalizationOptions>,
  ignoreTitleMismatch?: boolean
): CloseMatch[] {
  return candidates
    .map((candidate) => {
      const similarity = calculateSimilarity(target, candidate, normOptions, ignoreTitleMismatch);
      return { candidate, ...similarity };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
    .map((match) => {
      const isCopyPaste = detectCopyPasteError(match.details);
      return {
        question: match.candidate,
        score: match.total,
        scoring: match.details,
        isCopyPasteError: isCopyPaste.detected,
        copyPasteReason: isCopyPaste.reason,
      } as CloseMatch;
    });
}

/**
 * Fuzzy similarity matching (greedy 1:1 above a threshold). Retained for
 * diagnostics/fallback; the primary audit path uses {@link matchPositional}.
 */
export function matchQuestions(
  excelQs: QTIQuestion[],
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

  const scores: Array<{ excelIdx: number; qtiIdx: number; score: number }> = [];
  for (let ei = 0; ei < excelQs.length; ei++) {
    for (let qi = 0; qi < qtiQs.length; qi++) {
      const similarity = calculateSimilarity(excelQs[ei], qtiQs[qi], normOptions, options?.ignoreTitleMismatch);
      scores.push({ excelIdx: ei, qtiIdx: qi, score: similarity.total });
    }
  }

  scores.sort((a, b) => b.score - a.score);

  for (const entry of scores) {
    if (entry.score < threshold) continue;
    if (matchedExcelIndices.has(entry.excelIdx) || matchedQTIIndices.has(entry.qtiIdx)) continue;
    pairs.push({ excel: excelQs[entry.excelIdx], qti: qtiQs[entry.qtiIdx], score: entry.score });
    matchedExcelIndices.add(entry.excelIdx);
    matchedQTIIndices.add(entry.qtiIdx);
  }

  const unmatchedExcel: UnmatchedItem[] = excelQs
    .map((q, i) => ({ q, i }))
    .filter(({ i }) => !matchedExcelIndices.has(i))
    .map(({ q }) => ({ question: q, closeMatches: buildCloseMatches(q, qtiQs, normOptions, options?.ignoreTitleMismatch) }));

  const unmatchedQTI: UnmatchedItem[] = qtiQs
    .map((q, i) => ({ q, i }))
    .filter(({ i }) => !matchedQTIIndices.has(i))
    .map(({ q }) => ({ question: q, closeMatches: buildCloseMatches(q, excelQs, normOptions, options?.ignoreTitleMismatch) }));

  return { pairs, unmatchedExcel, unmatchedQTI };
}

/**
 * Calculate similarity between two questions.
 * Title is ignored for scoring (0%); Prompt 60%, Answers 40%.
 */
function calculateSimilarity(
  a: QTIQuestion,
  b: QTIQuestion,
  normOptions?: Partial<NormalizationOptions>,
  _ignoreTitleMismatch?: boolean
): {
  total: number;
  details: ScoringDetails;
} {
  const titleScore = a.title && b.title ? scoreField(a.title, b.title, normOptions) : 1.0;
  const promptScore = scoreField(a.prompt, b.prompt, normOptions);
  const answerScore = scoreAnswers(a.answers, b.answers, normOptions);

  const total = promptScore * 0.6 + answerScore * 0.4;

  return {
    total,
    details: { titleScore, promptScore, answerScore, totalScore: total },
  };
}

/** Score a single text field. */
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

/** Score answer matching: count plus per-position text similarity. */
function scoreAnswers(
  answersA: QTIAnswer[],
  answersB: QTIAnswer[],
  normOptions?: Partial<NormalizationOptions>
): number {
  const textsA = answersA.map((a) => a.text ?? '');
  const textsB = answersB.map((a) => a.text ?? '');

  if (textsA.length !== textsB.length) {
    const minLen = Math.min(textsA.length, textsB.length);
    if (minLen === 0) return 0;

    let matchScore = 0;
    for (let i = 0; i < minLen; i++) {
      matchScore += scoreField(textsA[i], textsB[i], normOptions);
    }

    const countDiff = Math.abs(textsA.length - textsB.length);
    const countPenalty = Math.min(1, countDiff * 0.15);
    return (matchScore / minLen) * (1 - countPenalty);
  }

  if (textsA.length === 0) return 1;

  let totalScore = 0;
  for (let i = 0; i < textsA.length; i++) {
    totalScore += scoreField(textsA[i], textsB[i], normOptions);
  }
  return totalScore / textsA.length;
}

/**
 * Detect potential copy-paste errors by analyzing score patterns.
 */
function detectCopyPasteError(scoring: ScoringDetails): { detected: boolean; reason?: string } {
  const { promptScore, answerScore, titleScore } = scoring;

  if (promptScore > 0.88 && titleScore < 0.4) {
    return {
      detected: true,
      reason: `Prompt matches well (${(promptScore * 100).toFixed(0)}%) but title differs significantly (${(titleScore * 100).toFixed(0)}%) - possible content copy with new title`,
    };
  }

  if (answerScore > 0.88 && promptScore < 0.6) {
    return {
      detected: true,
      reason: `Answers match very well (${(answerScore * 100).toFixed(0)}%) but prompt differs (${(promptScore * 100).toFixed(0)}%) - possible reordering or re-explanation`,
    };
  }

  if (answerScore > 0.88 && titleScore > 0.85 && promptScore < 0.5) {
    return {
      detected: true,
      reason: `Answers (${(answerScore * 100).toFixed(0)}%) and Title (${(titleScore * 100).toFixed(0)}%) match but prompt differs - possible question reordering`,
    };
  }

  return { detected: false };
}

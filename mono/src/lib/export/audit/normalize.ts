import type { NormalizationOptions, DiffChunk } from './types';

const DEFAULT_OPTIONS: NormalizationOptions = {
  normalize_html: true,
  ignore_case: true,
  ignore_punctuation: false,
  trim: true,
};

/**
 * Normalize text for comparison
 * @param text - Text to normalize
 * @param options - Normalization options (defaults to DEFAULT_OPTIONS)
 * @returns Normalized text
 */
export function normalize(text: string | undefined, options?: Partial<NormalizationOptions>): string {
  if (!text) return '';

  const opts = { ...DEFAULT_OPTIONS, ...options };
  let t = text;

  // Strip HTML tags
  if (opts.normalize_html) {
    t = stripHTML(t);
  }

  // Normalize Unicode characters
  t = t
    .replace(/\u00A0/g, ' ') // Non-breaking space
    .replace(/\u2019/g, "'") // Right single quotation mark
    .replace(/\u2018/g, "'") // Left single quotation mark
    .replace(/\u201C/g, '"') // Left double quotation mark
    .replace(/\u201D/g, '"') // Right double quotation mark
    .replace(/\u2014/g, '-') // Em dash
    .replace(/\u2013/g, '-'); // En dash

  // Optional: trim
  if (opts.trim) {
    t = t.trim();
  }

  // Optional: case-insensitive
  if (opts.ignore_case) {
    t = t.toLowerCase();
  }

  // Optional: remove punctuation
  if (opts.ignore_punctuation) {
    t = t.replace(/[.,!?;:—–\-]/g, '');
  }

  // Normalize whitespace (multiple spaces to single space)
  t = t.replace(/\s+/g, ' ');

  return t;
}

/**
 * Strip HTML tags from text
 * @param html - HTML string
 * @returns Plain text without tags
 */
function stripHTML(html: string): string {
  // Use browser DOMParser if available, otherwise fallback to regex
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      return doc.body.textContent || '';
    } catch {
      // Fallback to regex
    }
  }

  // Regex fallback: remove all HTML tags
  return html.replace(/<[^>]*>/g, ' ');
}

/**
 * Calculate text similarity using Jaro-Winkler algorithm
 * Implementation from talisman library or fallback
 */
export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const la = a.length;
  const lb = b.length;

  if (la === 0 && lb === 0) return 1;
  if (la === 0 || lb === 0) return 0;

  const maxDist = Math.max(la, lb) / 2 - 1;
  if (maxDist < 0) return 0;

  const aMatches = new Array(la);
  const bMatches = new Array(lb);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < la; i++) {
    const start = Math.max(0, i - maxDist);
    const end = Math.min(i + maxDist + 1, lb);

    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Find transpositions
  let k = 0;
  for (let i = 0; i < la; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  const jaro = (matches / la + matches / lb + (matches - transpositions / 2) / matches) / 3;

  // Common prefix length (up to 4)
  let prefix = 0;
  const prefixLen = Math.min(4, Math.min(la, lb));
  for (let i = 0; i < prefixLen; i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

/**
 * Calculate Levenshtein distance between two strings
 * Useful as an alternative to Jaro-Winkler for certain use cases
 */
export function levenshteinDistance(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;

  if (la === 0) return lb;
  if (lb === 0) return la;

  const dist: number[][] = Array(la + 1)
    .fill(null)
    .map(() => Array(lb + 1).fill(0));

  for (let i = 0; i <= la; i++) dist[i][0] = i;
  for (let j = 0; j <= lb; j++) dist[0][j] = j;

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dist[i][j] = Math.min(
        dist[i - 1][j] + 1, // deletion
        dist[i][j - 1] + 1, // insertion
        dist[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dist[la][lb];
}

/**
 * Convert Levenshtein distance to similarity score (0-1)
 */
export function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Find best match field boundaries
 * Useful for detecting if text is a substring match
 */
export function findSubstringMatch(
  text: string,
  pattern: string,
  tolerance: number = 0.9
): { found: boolean; score: number; startIndex: number; endIndex: number } {
  const tl = text.length;
  const pl = pattern.length;

  if (pl === 0) return { found: true, score: 1, startIndex: 0, endIndex: 0 };
  if (pl > tl) return { found: false, score: 0, startIndex: -1, endIndex: -1 };

  let bestScore = 0;
  let bestStart = 0;

  for (let i = 0; i <= tl - pl; i++) {
    const substring = text.substring(i, i + pl);
    const score = jaroWinkler(substring, pattern);
    if (score > bestScore) {
      bestScore = score;
      bestStart = i;
    }
  }

  return {
    found: bestScore >= tolerance,
    score: bestScore,
    startIndex: bestStart,
    endIndex: bestStart + pl,
  };
}

/**
 * Generate character-level diff chunks between two strings
 * Compares strings character-by-character and groups changes by words
 * Returns array of chunks with type (equal, added, removed) and text
 */
export function generateDiff(original: string, modified: string): DiffChunk[] {
  if (!original && !modified) return [];
  if (!original) return [{ type: 'added', text: modified }];
  if (!modified) return [{ type: 'removed', text: original }];

  // Use Myers diff algorithm (simplified version for character-level matching)
  const chunks = myersDiff(original, modified);
  return chunks;
}

/**
 * Simplified Myers diff algorithm for character-level comparison
 * Returns array of diff chunks (equal, added, removed)
 */
function myersDiff(original: string, modified: string): DiffChunk[] {
  const result: DiffChunk[] = [];

  // Build a map of character positions in both strings
  const originalLen = original.length;
  const modifiedLen = modified.length;

  // Create a matrix for longest common subsequence
  const matrix: number[][] = Array(originalLen + 1)
    .fill(null)
    .map(() => Array(modifiedLen + 1).fill(0));

  // Fill the matrix
  for (let i = 1; i <= originalLen; i++) {
    for (let j = 1; j <= modifiedLen; j++) {
      if (original[i - 1] === modified[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }

  // Backtrack to build the diff
  let i = originalLen;
  let j = modifiedLen;

  const diffSteps: Array<{ type: 'equal' | 'added' | 'removed'; char: string }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && original[i - 1] === modified[j - 1]) {
      // Character matches
      diffSteps.unshift({ type: 'equal', char: original[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      // Character added
      diffSteps.unshift({ type: 'added', char: modified[j - 1] });
      j--;
    } else {
      // Character removed
      diffSteps.unshift({ type: 'removed', char: original[i - 1] });
      i--;
    }
  }

  // Group consecutive characters of the same type into chunks
  let currentType: 'equal' | 'added' | 'removed' | null = null;
  let currentText = '';

  for (const step of diffSteps) {
    if (step.type === currentType) {
      currentText += step.char;
    } else {
      if (currentType !== null && currentText) {
        result.push({ type: currentType, text: currentText });
      }
      currentType = step.type;
      currentText = step.char;
    }
  }

  // Add final chunk
  if (currentType !== null && currentText) {
    result.push({ type: currentType, text: currentText });
  }

  return result;
}

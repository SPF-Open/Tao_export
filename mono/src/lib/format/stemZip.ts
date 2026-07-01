import {
  ZipReader,
  ZipWriter,
  BlobReader,
  BlobWriter,
  TextReader,
  TextWriter,
} from '@zip.js/zip.js';
import { locateStemRegion, spliceStemRegion } from './stemRegion';
import { formatStemText, htmlStemToText } from './stemFormat';
import { boldPromptXml } from './boldPrompt';

const ASSESSMENT_ITEM_TAG_RE = /<assessmentItem\b[^>]*>/;

function extractAttr(tag: string, name: string): string | null {
  const match = new RegExp(`\\b${name}="([^"]*)"`).exec(tag);
  return match ? match[1] : null;
}

const BULLET_LINE_RE = /^[•-]\s+/;

/**
 * Whether plain text actually has bullets/line-breaks worth normalizing.
 * A "prompt"-kind region shares its tag with the bold-prompt transform, so a
 * plain single-line prompt is left untouched here — otherwise every export
 * would strip its `<strong>` wrapper and let the bold pass reapply it,
 * converging to the same bytes but doing pointless churn on every run.
 */
function needsStemFormatting(text: string): boolean {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return lines.length > 1 || lines.some((line) => BULLET_LINE_RE.test(line));
}

export interface StemItem {
  /** Zip entry path — stable key into the edits map. */
  filename: string;
  identifier: string;
  title: string;
  /** null when no editable stem could be located (e.g. an instruction page). */
  region: { kind: 'context' | 'prompt' } | null;
  /** Plain-text editor seed, derived from the region's current markup. */
  initialText: string;
}

/** Enumerate every qti.xml entry in a TAO QTI zip for the question picker. */
export async function parseStemZip(
  input: Blob | File,
): Promise<{ items: StemItem[]; totalEntries: number }> {
  const reader = new ZipReader(new BlobReader(input));
  const items: StemItem[] = [];
  let totalEntries = 0;

  try {
    const entries = await reader.getEntries();
    totalEntries = entries.length;

    for (const entry of entries) {
      if (entry.directory || !entry.getData) continue;
      if (!entry.filename.endsWith('qti.xml')) continue;

      const xml = await entry.getData(new TextWriter());
      const tagMatch = ASSESSMENT_ITEM_TAG_RE.exec(xml);
      const tag = tagMatch ? tagMatch[0] : '';
      const identifier = extractAttr(tag, 'identifier') ?? entry.filename;
      const title = extractAttr(tag, 'title') ?? identifier;
      const region = locateStemRegion(xml);

      items.push({
        filename: entry.filename,
        identifier,
        title,
        region: region ? { kind: region.kind } : null,
        initialText: region ? htmlStemToText(region.innerHtml) : '',
      });
    }
  } finally {
    await reader.close();
  }

  return { items, totalEntries };
}

/**
 * Rebuild the zip: every question's stem gets its bullets/line-breaks
 * auto-formatted (using the manually edited text where the user provided
 * one, otherwise the same auto-detected text the editor was seeded with),
 * and every plain-text `<prompt>` gets bolded — matching the old bulk
 * "Bold prompts" behavior. Only entries with no detectable stem region
 * (e.g. instruction-only pages) and non-qti.xml entries (manifest, assets)
 * pass through byte-identical.
 */
export async function buildStemZip(
  input: Blob | File,
  edits: Map<string, string>,
): Promise<{ blob: Blob; stemsFormatted: number; promptsBolded: number; total: number }> {
  const reader = new ZipReader(new BlobReader(input));
  const writer = new ZipWriter(new BlobWriter('application/zip'));

  let total = 0;
  let stemsFormatted = 0;
  let promptsBolded = 0;

  try {
    const entries = await reader.getEntries();

    for (const entry of entries) {
      if (entry.directory || !entry.getData) continue;

      if (entry.filename.endsWith('qti.xml')) {
        total += 1;
        const xml = await entry.getData(new TextWriter());
        let output = xml;

        const region = locateStemRegion(xml);
        if (region) {
          const editedText = edits.get(entry.filename);
          const text = editedText ?? htmlStemToText(region.innerHtml);
          const shouldFormat =
            editedText !== undefined || region.kind === 'context' || needsStemFormatting(text);

          if (shouldFormat) {
            output = spliceStemRegion(xml, region, formatStemText(text));
            if (output !== xml) stemsFormatted += 1;
          }
        }

        const bolded = boldPromptXml(output);
        if (bolded.changed) promptsBolded += 1;

        await writer.add(entry.filename, new TextReader(bolded.xml));
      } else {
        const blob = await entry.getData(new BlobWriter());
        await writer.add(entry.filename, new BlobReader(blob));
      }
    }
  } finally {
    await reader.close();
  }

  const blob = await writer.close();
  return { blob, stemsFormatted, promptsBolded, total };
}

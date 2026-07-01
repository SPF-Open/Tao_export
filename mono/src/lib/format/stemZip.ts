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

const ASSESSMENT_ITEM_TAG_RE = /<assessmentItem\b[^>]*>/;

function extractAttr(tag: string, name: string): string | null {
  const match = new RegExp(`\\b${name}="([^"]*)"`).exec(tag);
  return match ? match[1] : null;
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
 * Rebuild the zip, splicing edited stems back into their qti.xml entries.
 * Entries with no recorded edit, and every non-qti.xml entry, pass through
 * byte-identical.
 */
export async function buildStemZip(
  input: Blob | File,
  edits: Map<string, string>,
): Promise<{ blob: Blob; changed: number; total: number }> {
  const reader = new ZipReader(new BlobReader(input));
  const writer = new ZipWriter(new BlobWriter('application/zip'));

  let total = 0;
  let changed = 0;

  try {
    const entries = await reader.getEntries();

    for (const entry of entries) {
      if (entry.directory || !entry.getData) continue;

      if (entry.filename.endsWith('qti.xml')) {
        total += 1;
        const xml = await entry.getData(new TextWriter());
        const editedText = edits.get(entry.filename);
        let output = xml;

        if (editedText !== undefined) {
          const region = locateStemRegion(xml);
          if (region) {
            output = spliceStemRegion(xml, region, formatStemText(editedText));
            if (output !== xml) changed += 1;
          }
        }

        await writer.add(entry.filename, new TextReader(output));
      } else {
        const blob = await entry.getData(new BlobWriter());
        await writer.add(entry.filename, new BlobReader(blob));
      }
    }
  } finally {
    await reader.close();
  }

  const blob = await writer.close();
  return { blob, changed, total };
}

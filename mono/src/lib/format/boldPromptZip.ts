import {
  ZipReader,
  ZipWriter,
  BlobReader,
  BlobWriter,
  TextReader,
  TextWriter,
} from '@zip.js/zip.js';
import { boldPromptXml } from './boldPrompt';

export interface BoldPromptZipResult {
  /** The rebuilt ZIP package, ready to download / re-upload to TAO. */
  blob: Blob;
  /** Number of qti.xml files found in the package. */
  total: number;
  /** Number of qti.xml files whose prompt was bolded. */
  changed: number;
}

/**
 * Read a TAO QTI ZIP package, bold every plain-text question prompt, and
 * return a new ZIP with the same structure. Non-`qti.xml` entries (the
 * manifest, images, …) are copied through unchanged so the package still
 * imports back into TAO.
 */
export async function boldPromptZip(
  input: Blob | File,
): Promise<BoldPromptZipResult> {
  const reader = new ZipReader(new BlobReader(input));
  const writer = new ZipWriter(new BlobWriter('application/zip'));

  let total = 0;
  let changed = 0;

  try {
    const entries = await reader.getEntries();

    for (const entry of entries) {
      // Directories are recreated implicitly from file paths.
      if (entry.directory || !entry.getData) continue;

      if (entry.filename.endsWith('qti.xml')) {
        total += 1;
        const xml = await entry.getData(new TextWriter());
        const result = boldPromptXml(xml);
        if (result.changed) changed += 1;
        await writer.add(entry.filename, new TextReader(result.xml));
      } else {
        const blob = await entry.getData(new BlobWriter());
        await writer.add(entry.filename, new BlobReader(blob));
      }
    }
  } finally {
    await reader.close();
  }

  const blob = await writer.close();
  return { blob, total, changed };
}

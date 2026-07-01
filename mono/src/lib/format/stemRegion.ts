/**
 * Locates the editable "stem" region of a qti.xml document and splices
 * replacement HTML back in — a surgical string-level edit (no XML parse and
 * reserialize), so every other byte of the file stays untouched and the
 * package keeps importing cleanly into TAO.
 *
 * A question's itemBody has up to two candidate stem locations:
 *
 *   - Region "context": the <div class="grid-row"> block(s) before the row
 *     that holds the interaction — where a question's intro/setup text (and
 *     any bullet list) normally lives.
 *   - Region "prompt": the interaction's own <prompt>…</prompt> — used when
 *     there is no separate context block, i.e. the whole stem is the prompt.
 *
 * Exactly one region is ever edited per file: context wins when present,
 * otherwise prompt is the fallback. If neither can be located (no supported
 * interaction in the item), there is no editable stem.
 */

const ITEM_BODY_OPEN_RE = /<itemBody(?:\s[^>]*)?>/;
const INTERACTION_RE = /<(?:choiceInteraction|extendedTextInteraction|textEntryInteraction)\b/;
const GRID_ROW_OPEN = '<div class="grid-row">';
const PROMPT_RE = /([ \t]*)<prompt>([\s\S]*?)<\/prompt>/;
const NBSP_ENTITY_RE = /&nbsp;|&#160;/gi;

export interface StemRegion {
  kind: 'context' | 'prompt';
  /** Byte offsets into the original xml string, [start, end). */
  start: number;
  end: number;
  /** Leading indentation captured near the region, reused when re-emitting it. */
  indent: string;
  /** The region's current raw inner HTML. */
  innerHtml: string;
}

function captureIndent(text: string): string {
  const match = /\n([ \t]*)\S/.exec(text);
  return match ? match[1] : '';
}

function hasVisibleText(html: string): boolean {
  return html.replace(/<[^>]*>/g, ' ').replace(NBSP_ENTITY_RE, ' ').trim().length > 0;
}

/** Locate the editable stem region of a single qti.xml document, if any. */
export function locateStemRegion(xml: string): StemRegion | null {
  const openMatch = ITEM_BODY_OPEN_RE.exec(xml);
  if (!openMatch) return null;

  const bodyStart = openMatch.index + openMatch[0].length;
  const bodyEnd = xml.indexOf('</itemBody>', bodyStart);
  if (bodyEnd === -1) return null;

  const bodyContent = xml.slice(bodyStart, bodyEnd);
  const interactionMatch = INTERACTION_RE.exec(bodyContent);
  if (!interactionMatch) return null;

  const preInteraction = bodyContent.slice(0, interactionMatch.index);

  if (hasVisibleText(preInteraction)) {
    const lastRowIdx = preInteraction.lastIndexOf(GRID_ROW_OPEN);
    const spliceEndRel = lastRowIdx === -1 ? interactionMatch.index : lastRowIdx;
    const raw = bodyContent.slice(0, spliceEndRel);

    return {
      kind: 'context',
      start: bodyStart,
      end: bodyStart + spliceEndRel,
      indent: captureIndent(raw) || '    ',
      innerHtml: raw.trim(),
    };
  }

  const afterInteraction = bodyContent.slice(interactionMatch.index);
  const promptMatch = PROMPT_RE.exec(afterInteraction);
  if (!promptMatch) return null;

  const [full, indent, inner] = promptMatch;
  const absStart = bodyStart + interactionMatch.index + promptMatch.index;

  return {
    kind: 'prompt',
    start: absStart,
    end: absStart + full.length,
    indent,
    innerHtml: inner.trim(),
  };
}

/**
 * Replace a region's content with newly formatted HTML. Returns `xml`
 * unchanged (no-op) if the new content is identical to what's already there.
 */
export function spliceStemRegion(xml: string, region: StemRegion, newInnerHtml: string): string {
  if (newInnerHtml.trim() === region.innerHtml.trim()) return xml;

  const nl = xml.includes('\r\n') ? '\r\n' : '\n';
  const { indent } = region;
  const pad = `${indent}  `;

  const replacement =
    region.kind === 'context'
      ? `${nl}${indent}<div class="grid-row"><div class="col-12">${nl}${pad}${newInnerHtml}${nl}${indent}</div></div>${nl}${indent}`
      : `${indent}<prompt>${newInnerHtml}</prompt>`;

  return xml.slice(0, region.start) + replacement + xml.slice(region.end);
}

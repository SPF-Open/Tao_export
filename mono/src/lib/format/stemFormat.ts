/**
 * Plain-text <-> HTML conversion for the question-stem editor.
 *
 * `formatStemText` turns editable plain text into the HTML fragment that gets
 * spliced back into a qti.xml stem region: consecutive lines starting with
 * "•" or "-" become one <ul><li> list, every other line break becomes <br/>.
 *
 * `htmlStemToText` runs once, when a question is first opened, to seed the
 * editor from whatever markup TAO already exported. It intentionally only
 * preserves bullets and line breaks — other inline formatting (e.g. a
 * previously bolded <strong> stem) is flattened to plain text, since this
 * tool edits stem content, not arbitrary rich text.
 */

const BULLET_RE = /^\s*[•-]\s+(.*)$/;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, '&');
}

type Token = { kind: 'text'; content: string } | { kind: 'list'; html: string };

/** Convert editable plain text (with optional bullet lines) into an HTML fragment. */
export function formatStemText(text: string): string {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');

  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  if (lines.length === 0) return '';

  const tokens: Token[] = [];
  let i = 0;
  while (i < lines.length) {
    const bulletMatch = BULLET_RE.exec(lines[i]);
    if (bulletMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const match = BULLET_RE.exec(lines[i]);
        if (!match) break;
        items.push(escapeHtml(match[1].trim()));
        i += 1;
      }
      // A blank line immediately before a bullet run is a boundary, not content.
      const prev = tokens[tokens.length - 1];
      if (prev?.kind === 'text' && prev.content.trim() === '') tokens.pop();
      tokens.push({ kind: 'list', html: `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>` });
    } else {
      tokens.push({ kind: 'text', content: escapeHtml(lines[i]) });
      i += 1;
    }
  }

  return tokens
    .map((token, index) => {
      if (token.kind === 'list') return token.html;
      const isLast = index === tokens.length - 1;
      const nextIsList = !isLast && tokens[index + 1].kind === 'list';
      return isLast || nextIsList ? token.content : `${token.content}<br/>`;
    })
    .join('');
}

/** Convert an existing stem's HTML fragment into a plain-text editor starting point. */
export function htmlStemToText(html: string): string {
  let text = html;

  // Each list becomes newline-joined "- item" lines.
  text = text.replace(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_full, _tag, inner: string) => {
    const items = Array.from(inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)).map(
      (match) => `- ${decodeEntities(stripTags(match[1])).trim()}`,
    );
    return `\n${items.join('\n')}\n`;
  });

  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/(div|p)>/gi, '\n').replace(/<(div|p)\b[^>]*>/gi, '\n');

  // Any remaining inline tag (strong, span, img, …) is dropped, keeping only its text.
  text = stripTags(text);
  text = decodeEntities(text);

  const lines = text.split('\n').map((line) => line.trim());
  const collapsed: string[] = [];
  let sawBlank = false;
  for (const line of lines) {
    if (line === '') {
      if (!sawBlank) collapsed.push('');
      sawBlank = true;
    } else {
      collapsed.push(line);
      sawBlank = false;
    }
  }

  while (collapsed.length && collapsed[0] === '') collapsed.shift();
  while (collapsed.length && collapsed[collapsed.length - 1] === '') collapsed.pop();

  return collapsed.join('\n');
}

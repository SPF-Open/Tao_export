/**
 * Bold-prompt formatter — pure XML transform (no dependencies).
 *
 * TAO exports each question as a `qti.xml` file. When a prompt is authored as
 * plain text it renders as plain text in the test player. The test team wants
 * the question prompt to stand out, which TAO encodes by wrapping the prompt
 * text in `<strong>` and padding it with a blank line above and below:
 *
 *   <prompt>Question text?</prompt>
 *
 * becomes
 *
 *   <prompt>
 *     <div>&#160;</div>
 *     <strong>Question text?</strong>
 *     <div>&#160;</div>
 *   </prompt>
 *
 * The blank lines are `<div>` elements containing a single non-breaking space
 * (U+00A0), exactly as TAO produces them when you bold a prompt by hand.
 *
 * The transform is intentionally surgical: it rewrites only the `<prompt>`
 * region of the XML string and leaves every other byte untouched, so the
 * re-zipped package still imports cleanly into TAO. Prompts that already
 * contain markup (a previously bolded prompt, an image, formatted text, …) are
 * left as-is, which makes the operation safe to run more than once.
 */

/** The non-breaking space (U+00A0) TAO places inside the spacer divs. */
const NBSP = '\u00A0';

/** Matches a `<prompt>…</prompt>` block, capturing its leading indentation. */
const PROMPT_RE = /([ \t]*)<prompt>([\s\S]*?)<\/prompt>/g;

export interface BoldPromptResult {
  /** The (possibly) transformed XML. */
  xml: string;
  /** Whether anything was changed. */
  changed: boolean;
}

/**
 * Wrap the plain-text prompt of a single qti.xml document in `<strong>`.
 *
 * Returns the transformed XML and whether a change was made. Prompts that are
 * empty or already contain child elements are skipped.
 */
export function boldPromptXml(xml: string): BoldPromptResult {
  let changed = false;

  const out = xml.replace(PROMPT_RE, (match, indent: string, inner: string) => {
    const text = inner.trim();

    // Skip empty prompts and prompts that already carry markup (already bold,
    // contain an image, etc.). A plain-text prompt never contains '<'.
    if (text.length === 0 || text.includes('<')) {
      return match;
    }

    changed = true;
    const pad = `${indent}  `;
    return (
      `${indent}<prompt>\n` +
      `${pad}<div>${NBSP}</div>\n` +
      `${pad}<strong>${text}</strong>\n` +
      `${pad}<div>${NBSP}</div>\n` +
      `${indent}</prompt>`
    );
  });

  return { xml: out, changed };
}

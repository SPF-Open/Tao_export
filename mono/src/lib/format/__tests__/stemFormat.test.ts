import { describe, expect, test } from 'vitest';
import { formatStemText, htmlStemToText } from '../stemFormat.js';

describe('formatStemText', () => {
  test('empty input produces an empty string', () => {
    expect(formatStemText('')).toBe('');
    expect(formatStemText('   \n  \n')).toBe('');
  });

  test('bullets-only input produces a single list with no leading/trailing <br>', () => {
    expect(formatStemText('- département\n- salaire')).toBe(
      '<ul><li>département</li><li>salaire</li></ul>',
    );
  });

  test('no-bullets input joins lines with <br/> and no trailing break', () => {
    expect(formatStemText('Line one\nLine two\nLine three')).toBe(
      'Line one<br/>Line two<br/>Line three',
    );
  });

  test('mixed prose and a bullet run has no orphan <br> at the list boundary', () => {
    const out = formatStemText('Intro:\n- a\n- b\nOutro.');
    expect(out).toBe('Intro:<ul><li>a</li><li>b</li></ul>Outro.');
  });

  test('a blank line between two bullet runs produces two separate lists, never an empty <li>', () => {
    const out = formatStemText('- a\n\n- b');
    expect(out).toBe('<ul><li>a</li></ul><ul><li>b</li></ul>');
    expect(out).not.toContain('<li></li>');
  });

  test('leading and trailing blank lines are trimmed away entirely', () => {
    expect(formatStemText('\n\nHello\n\n')).toBe('Hello');
  });

  test('both "•" and "-" are recognized as bullet markers', () => {
    expect(formatStemText('• one\n- two')).toBe('<ul><li>one</li><li>two</li></ul>');
  });

  test('escapes HTML-significant characters in plain text and list items', () => {
    expect(formatStemText('A < B & "C"')).toBe('A &lt; B &amp; &quot;C&quot;');
    expect(formatStemText('- <script>')).toBe('<ul><li>&lt;script&gt;</li></ul>');
  });

  test('a line starting with "-" but no following space is not treated as a bullet', () => {
    expect(formatStemText('non-bullet line')).toBe('non-bullet line');
  });

  test('emits self-closed <br/> tags, since the output is spliced into strict XML', () => {
    const out = formatStemText('a\nb');
    expect(out).not.toContain('<br>');
    expect(out).toContain('<br/>');
  });

  test('detects multiple "•" bullets running together on a single line', () => {
    const out = formatStemText('Intro: • département • salaire');
    expect(out).toBe('Intro:<ul><li>département</li><li>salaire</li></ul>');
  });

  test('detects multiple "-" bullets running together on a single line', () => {
    const out = formatStemText('Intro: - département - salaire');
    expect(out).toBe('Intro:<ul><li>département</li><li>salaire</li></ul>');
  });

  test('an inline bullet run with no leading prose produces a plain list', () => {
    expect(formatStemText('• first • second • third')).toBe(
      '<ul><li>first</li><li>second</li><li>third</li></ul>',
    );
  });

  test('does not split hyphenated words or numeric ranges mid-line', () => {
    expect(formatStemText('well-known fact')).toBe('well-known fact');
    expect(formatStemText('pages 3-4 are missing')).toBe('pages 3-4 are missing');
  });

  test('already one-bullet-per-line input is unaffected by inline expansion', () => {
    const out = formatStemText('- département\n- salaire');
    expect(out).toBe('<ul><li>département</li><li>salaire</li></ul>');
  });
});

describe('htmlStemToText', () => {
  test('round-trips the sample zip\'s département/salaire list into "- " lines', () => {
    const html = `
      <p><strong>Vous disposez d'une table « employés » avec les colonnes suivantes : </strong></p>
      <ul>
        <li><strong>département </strong></li>
        <li><strong>salaire </strong></li>
      </ul>
      <p><strong>Vous souhaitez sélectionner les départements...</strong></p>
    `;
    const text = htmlStemToText(html);
    const lines = text.split('\n');
    expect(lines).toContain('- département');
    expect(lines).toContain('- salaire');
    expect(text).toContain("Vous disposez d'une table « employés » avec les colonnes suivantes :");
    expect(text).toContain('Vous souhaitez sélectionner les départements...');
  });

  test('strips a <strong> wrapper but keeps its text', () => {
    expect(htmlStemToText('<strong>Bold question?</strong>')).toBe('Bold question?');
  });

  test('collapses an empty nested spacer div to nothing', () => {
    expect(htmlStemToText('<div><div>&nbsp;</div></div>')).toBe('');
  });

  test('converts <br> into a line break', () => {
    expect(htmlStemToText('First<br>Second')).toBe('First\nSecond');
  });

  test('canonicalizes bullet markers to "-" regardless of original glyph', () => {
    const text = htmlStemToText('<ul><li>a</li><li>b</li></ul>');
    expect(text).toBe('- a\n- b');
  });
});

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { boldPromptXml } from '../boldPrompt.js';

const fixtures = join(import.meta.dir, 'fixtures');
const read = (name: string) => readFileSync(join(fixtures, name), 'utf-8');

describe('boldPromptXml', () => {
  test('wraps a plain-text prompt to match a hand-bolded TAO export', () => {
    const plain = read('prompt-only.qti.xml');
    const bold = read('bold.qti.xml');

    const { xml, changed } = boldPromptXml(plain);

    expect(changed).toBe(true);
    expect(xml).toBe(bold);
  });

  test('produces a <strong> prompt padded with non-breaking-space divs', () => {
    const input =
      '          <prompt>Question text?</prompt>';
    const { xml, changed } = boldPromptXml(input);

    expect(changed).toBe(true);
    expect(xml).toBe(
      '          <prompt>\n' +
        '            <div> </div>\n' +
        '            <strong>Question text?</strong>\n' +
        '            <div> </div>\n' +
        '          </prompt>',
    );
  });

  test('is idempotent: re-running leaves an already-bold prompt untouched', () => {
    const bold = read('bold.qti.xml');
    const { xml, changed } = boldPromptXml(bold);

    expect(changed).toBe(false);
    expect(xml).toBe(bold);
  });

  test('skips an empty prompt', () => {
    const input = '  <prompt></prompt>';
    const { xml, changed } = boldPromptXml(input);

    expect(changed).toBe(false);
    expect(xml).toBe(input);
  });

  test('skips a prompt that already contains markup (e.g. an image)', () => {
    const input = '  <prompt><img src="x.png"/></prompt>';
    const { xml, changed } = boldPromptXml(input);

    expect(changed).toBe(false);
    expect(xml).toBe(input);
  });

  test('preserves every other byte of the document', () => {
    const plain = read('prompt-only.qti.xml');
    const { xml } = boldPromptXml(plain);

    // The closing assessment tag and the response mapping are untouched.
    expect(xml).toContain('</assessmentItem>');
    expect(xml).toContain('<mapEntry mapKey="choice_1" mappedValue="3"/>');
    // The original single-line prompt no longer exists.
    expect(xml).not.toContain('<prompt>In welke');
  });
});

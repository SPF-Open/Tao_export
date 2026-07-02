import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { locateStemRegion, spliceStemRegion } from '../stemRegion.js';

const fixtures = join(import.meta.dir, 'fixtures');
const read = (name: string) => readFileSync(join(fixtures, name), 'utf-8');

describe('locateStemRegion', () => {
  test('falls back to the <prompt> region when there is no separate context block', () => {
    const xml = read('prompt-only.qti.xml');
    const region = locateStemRegion(xml);

    expect(region?.kind).toBe('prompt');
    expect(region?.innerHtml).toBe(
      'In welke van de onderstaande gevallen moet de Algemene Administratie van de Douane en Accijnzen (AADA) NIET het recht om gehoord toepassen als ze een beschikking neemt?',
    );
  });

  test('prefers the pre-interaction context block when it holds real content', () => {
    const xml = read('context-block.qti.xml');
    const region = locateStemRegion(xml);

    expect(region?.kind).toBe('context');
    expect(region?.innerHtml).toContain('département');
    expect(region?.innerHtml).toContain('<li>');
    expect(region?.innerHtml).not.toContain('choiceInteraction');
    expect(region?.innerHtml).not.toContain('Quelle requête');
  });

  test('returns null when the item has no supported interaction', () => {
    const xml = '<assessmentItem><itemBody><div>Just some text.</div></itemBody></assessmentItem>';
    expect(locateStemRegion(xml)).toBeNull();
  });
});

describe('spliceStemRegion', () => {
  test('is a no-op when the new content matches the current content', () => {
    const xml = read('prompt-only.qti.xml');
    const region = locateStemRegion(xml)!;
    expect(spliceStemRegion(xml, region, region.innerHtml)).toBe(xml);
  });

  test('changes only the prompt region, leaving everything else byte-identical', () => {
    const xml = read('prompt-only.qti.xml');
    const region = locateStemRegion(xml)!;
    const out = spliceStemRegion(xml, region, 'A brand new question?');

    expect(out).toContain('<prompt>A brand new question?</prompt>');
    expect(out).toContain('</assessmentItem>');
    expect(out).toContain('<mapEntry mapKey="choice_1" mappedValue="3"/>');
    expect(out).toContain('Wanneer er een beschikking genomen wordt in verband');
    expect(out).toContain('het verlenen van een Bindende Tarief Inlichting.');
    expect(out).not.toContain('In welke van de onderstaande gevallen');
  });

  test('changes only the context region, leaving the prompt and choices byte-identical', () => {
    const xml = read('context-block.qti.xml');
    const region = locateStemRegion(xml)!;
    const out = spliceStemRegion(xml, region, '<ul><li>new</li></ul>');

    expect(out).toContain('<ul><li>new</li></ul>');
    expect(out).not.toContain('<strong>département');
    expect(out).not.toContain('Vous disposez');
    expect(out).toContain('<prompt>');
    expect(out).toContain('Quelle requête SQL est correcte ?');
    expect(out).toContain(
      'SELECT département, AVG(salaire) FROM employés WHERE salaire &gt; 2000 GROUP BY département HAVING AVG(salaire) &gt; 3000;',
    );
    expect(out).toContain('</assessmentItem>');
  });
});

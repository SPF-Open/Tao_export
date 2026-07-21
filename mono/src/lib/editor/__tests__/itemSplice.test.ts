import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEditableItem } from '../itemFields.js';
import {
	spliceCharLimit,
	spliceChoiceScore,
	spliceChoiceText,
	spliceCorrectResponse,
	spliceItemAttrs
} from '../itemSplice.js';

const fixtures = fileURLToPath(new URL('fixtures', import.meta.url));
const read = (name: string) => readFileSync(join(fixtures, name), 'utf-8');

describe('spliceItemAttrs', () => {
	test('replaces title/label/lang while leaving every other byte untouched', () => {
		const xml = read('choice-item.qti.xml');
		const out = spliceItemAttrs(xml, { title: 'Nouveau titre', label: 'Nouveau label', lang: 'nl-NL' });

		expect(out).toContain('title="Nouveau titre"');
		expect(out).toContain('label="Nouveau label"');
		expect(out).toContain('xml:lang="nl-NL"');
		expect(out).toContain('identifier="item-choice-1"');
		expect(out).toContain('Bruxelles');
		expect(out).toContain('</assessmentItem>');
	});

	test('is a no-op when nothing changes', () => {
		const xml = read('choice-item.qti.xml');
		expect(spliceItemAttrs(xml, { title: 'QCM Test' })).toBe(xml);
		expect(spliceItemAttrs(xml, {})).toBe(xml);
	});

	test('leaves fields not passed untouched', () => {
		const xml = read('choice-item.qti.xml');
		const out = spliceItemAttrs(xml, { title: 'Nouveau titre' });
		expect(out).toContain('label="QCM Test"');
		expect(out).toContain('xml:lang="fr-FR"');
	});
});

describe('spliceChoiceText', () => {
	test('replaces one choice by identifier, leaving the others byte-identical', () => {
		const xml = read('choice-item.qti.xml');
		const out = spliceChoiceText(xml, 'choice_2', 'Bruxelles-Capitale');

		expect(out).toContain('identifier="choice_2" fixed="false" showHide="show">Bruxelles-Capitale</simpleChoice>');
		expect(out).toContain('>Amsterdam<');
		expect(out).toContain('>Paris<');
		expect(out).toContain('>Berlin<');
		expect(out).not.toContain('>Bruxelles<');
	});

	test('is a no-op when the text is unchanged', () => {
		const xml = read('choice-item.qti.xml');
		expect(spliceChoiceText(xml, 'choice_2', 'Bruxelles')).toBe(xml);
	});

	test('is a no-op for an unknown identifier', () => {
		const xml = read('choice-item.qti.xml');
		expect(spliceChoiceText(xml, 'choice_99', 'anything')).toBe(xml);
	});
});

describe('spliceCorrectResponse', () => {
	test('replaces the correct-response value list', () => {
		const xml = read('choice-item.qti.xml');
		const out = spliceCorrectResponse(xml, ['choice_3']);

		expect(out).toContain('<value><![CDATA[choice_3]]></value>');
		expect(out).not.toContain('<value><![CDATA[choice_2]]></value>');
		expect(out).toContain('<mapEntry mapKey="choice_1" mappedValue="-1"/>');
	});

	test('is a no-op when the identifiers are unchanged', () => {
		const xml = read('choice-item.qti.xml');
		expect(spliceCorrectResponse(xml, ['choice_2'])).toBe(xml);
	});

	test('round-trips through parseEditableItem', () => {
		const xml = read('choice-item.qti.xml');
		const out = spliceCorrectResponse(xml, ['choice_4']);
		const item = parseEditableItem(out, 'items/item-choice-1/qti.xml');
		expect(item.choices.find((c) => c.identifier === 'choice_4')?.correct).toBe(true);
		expect(item.choices.find((c) => c.identifier === 'choice_2')?.correct).toBe(false);
	});
});

describe('spliceChoiceScore', () => {
	test('replaces one mapEntry mappedValue by mapKey', () => {
		const xml = read('choice-item.qti.xml');
		const out = spliceChoiceScore(xml, 'choice_1', 2);

		expect(out).toContain('<mapEntry mapKey="choice_1" mappedValue="2"/>');
		expect(out).toContain('<mapEntry mapKey="choice_2" mappedValue="3"/>');
	});

	test('is a no-op when the score is unchanged', () => {
		const xml = read('choice-item.qti.xml');
		expect(spliceChoiceScore(xml, 'choice_2', 3)).toBe(xml);
	});
});

describe('spliceCharLimit', () => {
	test('replaces the {0,N} fragment of an existing patternMask and expectedLength', () => {
		const xml = read('text-item.qti.xml');
		const out = spliceCharLimit(xml, 250);

		expect(out).toContain('patternMask=".{0,250}"');
		expect(out).toContain('expectedLength="250"');
	});

	test('is a no-op when the limit is unchanged', () => {
		const xml = read('text-item.qti.xml');
		expect(spliceCharLimit(xml, 500)).toBe(xml);
	});

	test('synthesizes a patternMask when the interaction has none yet', () => {
		const xml =
			'<assessmentItem identifier="i1"><itemBody><extendedTextInteraction responseIdentifier="RESPONSE"><prompt>P</prompt></extendedTextInteraction></itemBody></assessmentItem>';
		const out = spliceCharLimit(xml, 300);

		expect(out).toContain('patternMask=".{0,300}"');
		expect(out).toContain('expectedLength="300"');
	});

	test('clears both attributes when the limit is set to null', () => {
		const xml = read('text-item.qti.xml');
		const out = spliceCharLimit(xml, null);

		expect(out).not.toContain('patternMask');
		expect(out).not.toContain('expectedLength');
		expect(out).toContain('<extendedTextInteraction responseIdentifier="RESPONSE">');
	});

	test('round-trips through parseEditableItem', () => {
		const xml = read('text-item.qti.xml');
		const out = spliceCharLimit(xml, 800);
		const item = parseEditableItem(out, 'items/item-text-1/qti.xml');
		expect(item.charLimit).toBe(800);
	});
});

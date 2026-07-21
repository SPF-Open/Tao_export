import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEditableItem } from '../itemFields.js';

const fixtures = fileURLToPath(new URL('fixtures', import.meta.url));
const read = (name: string) => readFileSync(join(fixtures, name), 'utf-8');

describe('parseEditableItem', () => {
	test('parses a choice item: attributes, choices, correct answer and per-choice score', () => {
		const item = parseEditableItem(read('choice-item.qti.xml'), 'items/item-choice-1/qti.xml');

		expect(item.kind).toBe('choice');
		expect(item.identifier).toBe('item-choice-1');
		expect(item.title).toBe('QCM Test');
		expect(item.label).toBe('QCM Test');
		expect(item.lang).toBe('fr-FR');
		expect(item.charLimit).toBeNull();
		expect(item.maxChoices).toBe(1);

		expect(item.choices).toHaveLength(4);
		expect(item.choices.map((c) => c.identifier)).toEqual(['choice_1', 'choice_2', 'choice_3', 'choice_4']);
		expect(item.choices[1]).toMatchObject({ identifier: 'choice_2', html: 'Bruxelles', correct: true, score: 3 });
		expect(item.choices[0]).toMatchObject({ identifier: 'choice_1', html: 'Amsterdam', correct: false, score: -1 });

		expect(item.promptRegion?.kind).toBe('prompt');
		expect(item.promptRegion?.innerHtml).toBe('Quelle est la capitale de la Belgique ?');
	});

	test('parses a text item: attributes and character limit from patternMask', () => {
		const item = parseEditableItem(read('text-item.qti.xml'), 'items/item-text-1/qti.xml');

		expect(item.kind).toBe('text');
		expect(item.identifier).toBe('item-text-1');
		expect(item.charLimit).toBe(500);
		expect(item.choices).toEqual([]);
	});

	test('falls back to "unsupported" when no known interaction is found', () => {
		const xml = '<assessmentItem identifier="i1" title="T"><itemBody><div>Just some text.</div></itemBody></assessmentItem>';
		const item = parseEditableItem(xml, 'items/i1/qti.xml');

		expect(item.kind).toBe('unsupported');
		expect(item.choices).toEqual([]);
		expect(item.charLimit).toBeNull();
	});

	test('reports maxChoices > 1 for a multi-select choiceInteraction', () => {
		const xml =
			'<assessmentItem identifier="i1" title="T"><itemBody><choiceInteraction responseIdentifier="RESPONSE" maxChoices="3"><simpleChoice identifier="a">A</simpleChoice></choiceInteraction></itemBody></assessmentItem>';
		const item = parseEditableItem(xml, 'items/i1/qti.xml');
		expect(item.maxChoices).toBe(3);
	});

	test('falls back to the zip filename / identifier when title/label/lang attributes are missing', () => {
		const xml = '<assessmentItem identifier="i1"><itemBody></itemBody></assessmentItem>';
		const item = parseEditableItem(xml, 'items/i1/qti.xml');

		expect(item.identifier).toBe('i1');
		expect(item.title).toBe('i1');
		expect(item.label).toBe('');
		expect(item.lang).toBe('');
	});
});

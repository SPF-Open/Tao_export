/**
 * Read-only, regex-based extraction of a single item's editable fields
 * directly from its raw qti.xml text — no DOM parse/reserialize, matching
 * `$lib/format/stemRegion.ts`'s round-trip-safe approach. Every field this
 * reads has a matching splice function in `itemSplice.ts` that edits the
 * same raw text without disturbing anything else in the document.
 */

import { locateStemRegion, type StemRegion } from '$lib/format/stemRegion';
import { extractAttr } from './xmlAttrs';

export type ItemKind = 'choice' | 'text' | 'unsupported';

export interface EditableChoice {
	identifier: string;
	/** Raw inner XML/HTML of the <simpleChoice>. */
	html: string;
	correct: boolean;
	/** Per-choice score from <mapEntry>, null when no mapping exists for it. */
	score: number | null;
}

export interface EditableItem {
	/** Zip entry path — stable key into the edits map. */
	filename: string;
	identifier: string;
	title: string;
	label: string;
	lang: string;
	kind: ItemKind;
	/** Editable stem/prompt region, reused as-is from the Format tool. */
	promptRegion: StemRegion | null;
	/** Only populated when kind === 'choice'. */
	choices: EditableChoice[];
	/**
	 * <choiceInteraction maxChoices>: 1 means exactly one correct answer
	 * (radio semantics), any other value (including 0, meaning unlimited)
	 * means several may be marked correct (checkbox semantics). Only
	 * meaningful when kind === 'choice'.
	 */
	maxChoices: number;
	/** Character limit for open questions, only populated when kind === 'text'. */
	charLimit: number | null;
}

const ASSESSMENT_ITEM_TAG_RE = /<assessmentItem\b[^>]*>/;
const CHOICE_INTERACTION_TAG_RE = /<choiceInteraction\b[^>]*>/;
const TEXT_INTERACTION_RE = /<extendedTextInteraction\b[^>]*>|<textEntryInteraction\b[^>]*>/;
const EXTENDED_TEXT_TAG_RE = /<extendedTextInteraction\b[^>]*>/;
const CORRECT_RESPONSE_RE = /<correctResponse>([\s\S]*?)<\/correctResponse>/;
const VALUE_RE = /<value>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/value>/g;
const MAP_ENTRY_RE = /<mapEntry\b[^>]*\/>/g;
const SIMPLE_CHOICE_RE = /<simpleChoice\b([^>]*)>([\s\S]*?)<\/simpleChoice>/g;
const CHAR_LIMIT_RE = /\{0,(\d+)\}/;

function extractCorrectResponseIds(xml: string): Set<string> {
	const block = CORRECT_RESPONSE_RE.exec(xml);
	if (!block) return new Set();
	const ids = new Set<string>();
	let m: RegExpExecArray | null;
	VALUE_RE.lastIndex = 0;
	while ((m = VALUE_RE.exec(block[1]))) {
		const value = (m[1] ?? m[2] ?? '').trim();
		if (value) ids.add(value);
	}
	return ids;
}

function extractMapping(xml: string): Map<string, number> {
	const map = new Map<string, number>();
	let m: RegExpExecArray | null;
	MAP_ENTRY_RE.lastIndex = 0;
	while ((m = MAP_ENTRY_RE.exec(xml))) {
		const key = extractAttr(m[0], 'mapKey');
		const value = extractAttr(m[0], 'mappedValue');
		if (key) map.set(key, value !== null ? Number(value) : 0);
	}
	return map;
}

function extractChoices(xml: string): EditableChoice[] {
	const correctIds = extractCorrectResponseIds(xml);
	const scores = extractMapping(xml);
	const choices: EditableChoice[] = [];
	let m: RegExpExecArray | null;
	SIMPLE_CHOICE_RE.lastIndex = 0;
	while ((m = SIMPLE_CHOICE_RE.exec(xml))) {
		const identifier = extractAttr(m[1], 'identifier');
		if (!identifier) continue;
		choices.push({
			identifier,
			html: m[2],
			correct: correctIds.has(identifier),
			score: scores.get(identifier) ?? null
		});
	}
	return choices;
}

function extractCharLimit(xml: string): number | null {
	const tag = EXTENDED_TEXT_TAG_RE.exec(xml)?.[0];
	if (!tag) return null;
	const mask = extractAttr(tag, 'patternMask');
	if (!mask) return null;
	const m = CHAR_LIMIT_RE.exec(mask);
	return m ? Number(m[1]) : null;
}

/** Parse one item's qti.xml text into its editable field model. */
export function parseEditableItem(xml: string, filename: string): EditableItem {
	const tag = ASSESSMENT_ITEM_TAG_RE.exec(xml)?.[0] ?? '';
	const identifier = extractAttr(tag, 'identifier') ?? filename;
	const title = extractAttr(tag, 'title') ?? identifier;
	const label = extractAttr(tag, 'label') ?? '';
	const lang = extractAttr(tag, 'xml:lang') ?? '';

	const choiceTag = CHOICE_INTERACTION_TAG_RE.exec(xml)?.[0];
	const hasText = TEXT_INTERACTION_RE.test(xml);
	const kind: ItemKind = choiceTag ? 'choice' : hasText ? 'text' : 'unsupported';
	const maxChoicesAttr = choiceTag ? extractAttr(choiceTag, 'maxChoices') : null;

	return {
		filename,
		identifier,
		title,
		label,
		lang,
		kind,
		promptRegion: locateStemRegion(xml),
		choices: kind === 'choice' ? extractChoices(xml) : [],
		maxChoices: maxChoicesAttr !== null ? Number(maxChoicesAttr) : 1,
		charLimit: kind === 'text' ? extractCharLimit(xml) : null
	};
}

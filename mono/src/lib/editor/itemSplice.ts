/**
 * Byte-preserving splice functions for a single item's qti.xml text — the
 * write side of `itemFields.ts`. Each function edits exactly one field's
 * region of the raw XML string and leaves every other byte untouched,
 * following the same convention as `$lib/format/stemRegion.ts`: a no-op
 * (return the input unchanged) whenever the new value already matches.
 */

import { escapeRegExp, removeAttr, replaceFirstMatch, setAttr } from './xmlAttrs';

const ASSESSMENT_ITEM_TAG_RE = /<assessmentItem\b[^>]*>/;
const CORRECT_RESPONSE_RE = /([ \t]*)<correctResponse>([\s\S]*?)<\/correctResponse>/;
const EXTENDED_TEXT_TAG_RE = /<extendedTextInteraction\b[^>]*>/;
const CHAR_LIMIT_RE = /\{0,\d+\}/;

/** Set title/label/language on the <assessmentItem> open tag. Omitted fields are left untouched. */
export function spliceItemAttrs(
	xml: string,
	attrs: { title?: string; label?: string; lang?: string }
): string {
	return replaceFirstMatch(xml, ASSESSMENT_ITEM_TAG_RE, (tag) => {
		let next = tag;
		if (attrs.title !== undefined) next = setAttr(next, 'title', attrs.title);
		if (attrs.label !== undefined) next = setAttr(next, 'label', attrs.label);
		if (attrs.lang !== undefined) next = setAttr(next, 'xml:lang', attrs.lang);
		return next;
	});
}

function simpleChoiceRe(identifier: string): RegExp {
	return new RegExp(`(<simpleChoice\\b[^>]*\\bidentifier="${escapeRegExp(identifier)}"[^>]*>)([\\s\\S]*?)(<\\/simpleChoice>)`);
}

/** Replace one choice's inner content by identifier. */
export function spliceChoiceText(xml: string, identifier: string, html: string): string {
	const m = simpleChoiceRe(identifier).exec(xml);
	if (!m) return xml;
	if (m[2] === html) return xml;
	return xml.slice(0, m.index) + m[1] + html + m[3] + xml.slice(m.index + m[0].length);
}

/** Replace the <correctResponse> value list with the given choice identifiers. */
export function spliceCorrectResponse(xml: string, identifiers: string[]): string {
	const m = CORRECT_RESPONSE_RE.exec(xml);
	if (!m) return xml;
	const [full, indent, inner] = m;
	const nl = xml.includes('\r\n') ? '\r\n' : '\n';
	const pad = `${indent}  `;
	const values = identifiers.map((id) => `${pad}<value><![CDATA[${id}]]></value>`).join(nl);
	const newInner = `${nl}${values}${nl}${indent}`;
	if (newInner === inner) return xml;
	const replacement = `${indent}<correctResponse>${newInner}</correctResponse>`;
	return xml.slice(0, m.index) + replacement + xml.slice(m.index + full.length);
}

function mapEntryRe(mapKey: string): RegExp {
	return new RegExp(`<mapEntry\\b[^>]*\\bmapKey="${escapeRegExp(mapKey)}"[^>]*\\/>`);
}

/** Replace one choice's score, i.e. its <mapEntry mappedValue="…">, by mapKey. */
export function spliceChoiceScore(xml: string, identifier: string, score: number): string {
	return replaceFirstMatch(xml, mapEntryRe(identifier), (tag) => setAttr(tag, 'mappedValue', String(score)));
}

/**
 * Set (or clear) the character limit on the item's <extendedTextInteraction>,
 * stored as the `{0,N}` fragment of its `patternMask` (plus a matching
 * `expectedLength`). Preserves the rest of an existing mask template; when
 * none exists yet, synthesizes a minimal `.{0,N}` mask — a best-effort
 * default, since no real TAO export in this repo confirms its preferred
 * mask shape.
 */
export function spliceCharLimit(xml: string, maxLength: number | null): string {
	return replaceFirstMatch(xml, EXTENDED_TEXT_TAG_RE, (tag) => {
		if (maxLength === null) {
			return removeAttr(removeAttr(tag, 'patternMask'), 'expectedLength');
		}
		const maskMatch = /patternMask="([^"]*)"/.exec(tag);
		let next = tag;
		if (maskMatch && CHAR_LIMIT_RE.test(maskMatch[1])) {
			next = setAttr(next, 'patternMask', maskMatch[1].replace(CHAR_LIMIT_RE, `{0,${maxLength}}`));
		} else {
			next = setAttr(next, 'patternMask', `.{0,${maxLength}}`);
		}
		return setAttr(next, 'expectedLength', String(maxLength));
	});
}

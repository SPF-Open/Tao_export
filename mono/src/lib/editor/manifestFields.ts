/**
 * Read a single item's LOM/manifest metadata out of `imsmanifest.xml`'s
 * matching <resource><metadata>…</metadata></resource> block.
 *
 * Real TAO exports don't reliably embed this metadata at all (see
 * `$lib/library/parse/competency.ts`), and there is no verified sample in
 * this repo to target a fixed schema against — so this reads whatever LOM
 * leaf fields (elements with plain-text content, no nested tags) exist,
 * generically, rather than assuming e.g. a classification/competency shape.
 * Raw XML mode is the authoritative fallback for anything this can't model.
 */

import { decodeXmlText, extractAttr, itemKey } from './xmlAttrs';

const RESOURCE_RE = /<resource\b([^>]*)(?:\/>|>([\s\S]*?)<\/resource>)/g;
const METADATA_RE = /<metadata>([\s\S]*?)<\/metadata>/;
export const METADATA_OPEN = '<metadata>';
const LEAF_RE = /(<([\w:]+)(?:\s[^>]*)?>)([^<]*)(<\/\2>)/g;

export interface ResourceMatch {
	/** Byte offset of the whole <resource>…</resource> (or self-closing tag) in the manifest text. */
	start: number;
	end: number;
	/** The <resource ...> tag's attribute text (everything between `resource` and the closing `>`). */
	attrs: string;
	/** Inner content between <resource ...> and </resource>; empty when self-closing. */
	body: string;
	selfClosing: boolean;
}

/** Locate the <resource> element whose @href resolves to the given item, if any. */
export function findResource(manifestXml: string, itemFilename: string): ResourceMatch | null {
	const key = itemKey(itemFilename);
	RESOURCE_RE.lastIndex = 0;
	let m: RegExpExecArray | null;
	while ((m = RESOURCE_RE.exec(manifestXml))) {
		const href = extractAttr(m[1], 'href');
		if (href && itemKey(href) === key) {
			return {
				start: m.index,
				end: m.index + m[0].length,
				attrs: m[1],
				body: m[2] ?? '',
				selfClosing: m[2] === undefined
			};
		}
	}
	return null;
}

export interface LomField {
	/** Position among the metadata block's leaf fields, in document order — stable while none are added/removed. */
	index: number;
	/** Tag name, with the common `imsmd:` prefix dropped for display. */
	label: string;
	value: string;
}

/** Whether the item has a <resource> entry in the manifest at all. */
export function hasResource(manifestXml: string, itemFilename: string): boolean {
	return findResource(manifestXml, itemFilename) !== null;
}

/** Whether the item's resource has a <metadata> block already. */
export function hasMetadata(manifestXml: string, itemFilename: string): boolean {
	const res = findResource(manifestXml, itemFilename);
	return res !== null && METADATA_RE.test(res.body);
}

function extractLeafFields(body: string): LomField[] {
	const meta = METADATA_RE.exec(body);
	if (!meta) return [];
	const fields: LomField[] = [];
	let m: RegExpExecArray | null;
	LEAF_RE.lastIndex = 0;
	let index = 0;
	while ((m = LEAF_RE.exec(meta[1]))) {
		fields.push({ index, label: m[2].replace(/^imsmd:/, ''), value: decodeXmlText(m[3]) });
		index += 1;
	}
	return fields;
}

/** Read the item's generic LOM leaf fields, or an empty list when it has no <metadata> block. */
export function extractLomFields(manifestXml: string, itemFilename: string): LomField[] {
	const res = findResource(manifestXml, itemFilename);
	if (!res) return [];
	return extractLeafFields(res.body);
}

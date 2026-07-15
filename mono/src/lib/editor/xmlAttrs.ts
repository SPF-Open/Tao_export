/**
 * Low-level, byte-preserving helpers shared by every editor splice module.
 * These operate on plain XML text (never a parsed DOM), so editing one field
 * never disturbs any other byte of the source document — the same guarantee
 * `$lib/format/stemRegion.ts` relies on for round-tripping into TAO.
 */

/** Read an attribute's raw value out of a tag's source text (or its opening-tag substring). */
export function extractAttr(tag: string, name: string): string | null {
	const match = new RegExp(`\\b${escapeRegExp(name)}="([^"]*)"`).exec(tag);
	return match ? match[1] : null;
}

/** Set (or insert) an attribute's value on a single XML tag's source text. */
export function setAttr(tag: string, name: string, value: string): string {
	const re = new RegExp(`(\\s${escapeRegExp(name)}=")([^"]*)(")`);
	const encoded = escapeAttr(value);
	if (re.test(tag)) {
		return tag.replace(re, (_m, pre: string, _old: string, post: string) => `${pre}${encoded}${post}`);
	}
	const selfClosing = /\/>\s*$/.test(tag);
	const insertion = ` ${name}="${encoded}"`;
	return selfClosing ? tag.replace(/\/>\s*$/, `${insertion}/>`) : tag.replace(/>\s*$/, `${insertion}>`);
}

/** Remove an attribute from a single XML tag's source text, if present (no-op otherwise). */
export function removeAttr(tag: string, name: string): string {
	return tag.replace(new RegExp(`\\s${escapeRegExp(name)}="[^"]*"`), '');
}

/** Replace the first regex match in `xml` with `transform(match)`; no-op if the result is identical. */
export function replaceFirstMatch(xml: string, re: RegExp, transform: (match: string) => string): string {
	const m = re.exec(xml);
	if (!m) return xml;
	const replacement = transform(m[0]);
	if (replacement === m[0]) return xml;
	return xml.slice(0, m.index) + replacement + xml.slice(m.index + m[0].length);
}

export function escapeAttr(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function escapeXmlText(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function decodeXmlText(value: string): string {
	return value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

export function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalize a zip-entry path ("items/iXXXX/qti.xml") or a relative href from
 * test.xml/imsmanifest.xml ("../../items/iXXXX/qti.xml") to a stable key so
 * the two can be joined regardless of path prefixes — same convention as
 * `itemKey()` in `$lib/questions/adapters/qti.ts`.
 */
export function itemKey(path: string): string {
	const parts = path.split('/').filter((p) => p && p !== '..' && p !== '.');
	return parts.slice(-2).join('/');
}

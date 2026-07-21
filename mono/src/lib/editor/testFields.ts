/**
 * Read a single item's TAO per-item test options (zoom/calculator/…, plus
 * the "informational" flag) out of `test.xml`'s <assessmentItemRef
 * category="…">. Same regex-only, round-trip-safe approach as
 * `itemFields.ts` — the matching write side lives in `testSplice.ts`.
 */

import { parseCategory } from '$lib/questions/tao-tools.js';
import type { TaoTools } from '$lib/questions/types.js';
import { extractAttr, itemKey } from './xmlAttrs';

const ITEM_REF_RE = /<assessmentItemRef\b[^>]*>/g;

export interface TestToolOptions {
	tools: TaoTools;
	informational: boolean;
}

/** Locate the <assessmentItemRef> tag whose href resolves to the given item, if any. */
export function findItemRefTag(testXml: string, itemFilename: string): string | null {
	const key = itemKey(itemFilename);
	ITEM_REF_RE.lastIndex = 0;
	let m: RegExpExecArray | null;
	while ((m = ITEM_REF_RE.exec(testXml))) {
		const href = extractAttr(m[0], 'href');
		if (href && itemKey(href) === key) return m[0];
	}
	return null;
}

/** Read an item's TAO tool options from test.xml, or null when the item has no ref there. */
export function extractTestToolOptions(testXml: string, itemFilename: string): TestToolOptions | null {
	const tag = findItemRefTag(testXml, itemFilename);
	if (!tag) return null;
	return parseCategory(extractAttr(tag, 'category'));
}

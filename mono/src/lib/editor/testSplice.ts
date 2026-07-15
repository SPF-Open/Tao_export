/** Write side of `testFields.ts` — rebuilds one item's @category token string in test.xml. */

import { stringifyCategory } from '$lib/questions/tao-tools.js';
import type { TaoTools } from '$lib/questions/types.js';
import { escapeRegExp, replaceFirstMatch, setAttr } from './xmlAttrs';
import { findItemRefTag } from './testFields';

/** Set an item's TAO tool options on its <assessmentItemRef> in test.xml. No-op if the item has no ref there. */
export function spliceTestToolOptions(
	testXml: string,
	itemFilename: string,
	tools: TaoTools,
	informational: boolean
): string {
	const tag = findItemRefTag(testXml, itemFilename);
	if (!tag) return testXml;
	const category = stringifyCategory(tools, informational);
	return replaceFirstMatch(testXml, new RegExp(escapeRegExp(tag)), (match) => setAttr(match, 'category', category));
}

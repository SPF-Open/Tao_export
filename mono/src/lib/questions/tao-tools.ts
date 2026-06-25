import type { TaoTools } from './types.js';

const CATEGORY_TO_TOOL: Record<string, keyof TaoTools> = {
	'x-tao-option-zoom': 'zoom',
	'x-tao-option-highlighter': 'highlighter',
	'x-tao-option-calculator': 'calculator',
	'x-tao-option-reviewScreen': 'reviewScreen',
	'x-tao-option-markReview': 'markReview',
	'x-tao-option-endTestWarning': 'endTestWarning',
	'x-tao-option-nextPartWarning': 'nextPartWarning'
};

export const TOOL_LABELS: Record<string, string> = {
	zoom: 'Zoom',
	highlighter: 'Surlignage',
	calculator: 'Calculatrice',
	reviewScreen: 'Révision',
	markReview: 'Marquer',
	endTestWarning: 'Avertissement fin',
	nextPartWarning: 'Avertissement partie'
};

export function parseCategory(category: string | null): { tools: TaoTools; informational: boolean } {
	if (!category) return { tools: {}, informational: false };
	const parts = category.split(/\s+/);
	const tools: TaoTools = {};
	let informational = false;
	for (const part of parts) {
		if (part === 'x-tao-itemusage-informational') {
			informational = true;
		} else {
			const key = CATEGORY_TO_TOOL[part];
			if (key) tools[key] = true;
		}
	}
	return { tools, informational };
}

export function mergeTools(a: TaoTools, b: TaoTools): TaoTools {
	const result: TaoTools = { ...a };
	for (const key of Object.keys(b)) {
		if (b[key]) result[key] = true;
	}
	return result;
}

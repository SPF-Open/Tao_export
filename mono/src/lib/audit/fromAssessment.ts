import type { AssessmentItem } from '$lib/questions/types.js';
import type { QTIQuestion } from './types';

/** Strips HTML tags and collapses whitespace to plain text. */
function stripHtmlTags(htmlText: string): string {
	return htmlText
		.replace(/<[^>]*>/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Converts normalized assessment items (from `QtiAdapter.read()`) into the
 * `QTIQuestion[]` shape the audit pipeline expects. Instruction items and empty
 * prompts are dropped. Extracted from the former AuditTab so the standalone
 * route can parse its own TAO ZIP.
 */
export function assessmentItemsToQuestions(items: AssessmentItem[]): QTIQuestion[] {
	return items
		.filter((item) => item.type !== 'instruction')
		.map((item) => {
			const promptText = stripHtmlTags(item.content.html ?? item.content.text ?? '');
			const options = item.responses?.[0]?.options ?? [];
			return {
				id: item.id,
				title: item.title,
				prompt: promptText,
				answers: options.map((opt) => ({
					text: stripHtmlTags(opt.content.html ?? opt.content.text ?? ''),
					correct: opt.correct === true,
					id: opt.id
				})),
				type: (item.type === 'single-choice'
					? 'QCM'
					: item.type === 'text'
						? 'QO'
						: undefined) as 'QCM' | 'QO' | undefined,
				points: item.scoring?.maxScore,
				metadata: { qtiId: item.id, originalType: item.type }
			};
		})
		.filter((q) => q.prompt && q.prompt.length > 0);
}

import type { AssessmentItem } from '$lib/questions/types.js';
import type { LibraryCompetency } from '../types.js';

/**
 * Best-effort competency/indicator extraction.
 *
 * TAO QTI ZIP exports do not reliably embed competency metadata, so this reads
 * whatever the normalized {@link AssessmentItem.metadata} carries (populated
 * from item metadata when present) and returns an empty list otherwise. Search
 * and filters degrade gracefully when no competency data exists.
 */
export function extractCompetencies(item: AssessmentItem): LibraryCompetency[] {
	const meta = item.metadata;
	if (!meta) return [];

	const code = asString(meta.competency);
	const indicator = asString(meta.indicator);
	if (!code && !indicator) return [];

	return [
		{
			// Fall back to the indicator as the code when only an indicator exists,
			// so the relation row is still searchable/filterable.
			code: code || indicator,
			label: asString(meta.competencyDescr),
			description: asString(meta.masteryDescr),
			indicator
		}
	];
}

function asString(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

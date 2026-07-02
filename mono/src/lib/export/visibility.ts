import type { AssessmentItem } from '$lib/questions/types.js';

/**
 * Per-item visibility semantics for the export preview.
 *
 * `overrides` holds explicit user choices (false = hidden, true = shown);
 * absent means "default". Instructions default to hidden while the global
 * "Show Instructions" toggle is off, every other item defaults to visible.
 */
export function isItemVisible(
	overrides: Map<string, boolean>,
	showInstruction: boolean,
	itemId: string,
	itemType: string
): boolean {
	if (itemType === 'instruction' && !showInstruction) {
		return overrides.get(itemId) === true;
	}
	return overrides.get(itemId) !== false;
}

/**
 * Reconciles instruction overrides with the global toggle: turning the toggle
 * off marks every instruction hidden (so a user can still re-show one), and
 * turning it back on clears those marks. Returns the updated map, or `null`
 * when nothing changed (so callers can skip a store write).
 */
export function reconcileInstructionVisibility(
	overrides: Map<string, boolean>,
	items: AssessmentItem[],
	showInstruction: boolean
): Map<string, boolean> | null {
	const map = new Map(overrides);
	let changed = false;

	for (const item of items) {
		if (item.type !== 'instruction') continue;

		if (!showInstruction) {
			if (map.get(item.id) !== false) {
				map.set(item.id, false);
				changed = true;
			}
		} else if (map.has(item.id)) {
			map.delete(item.id);
			changed = true;
		}
	}

	return changed ? map : null;
}

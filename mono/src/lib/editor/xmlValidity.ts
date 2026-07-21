/** Browser-only XML well-formedness check, used to gate Raw-mode edits before switching modes or exporting. */
export function xmlParseError(xml: string): string | null {
	if (typeof DOMParser === 'undefined') return null;
	const doc = new DOMParser().parseFromString(xml, 'text/xml');
	const err = doc.querySelector('parsererror');
	return err ? (err.textContent?.trim() ?? 'Invalid XML') : null;
}

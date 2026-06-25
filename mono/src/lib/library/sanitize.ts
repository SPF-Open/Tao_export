import DOMPurify from 'dompurify';

/**
 * Centralized HTML sanitization for library previews. A one-time hook keeps
 * `blob:` image sources (the object URLs we generate from stored assets), which
 * DOMPurify would otherwise strip as an unknown scheme. All other untrusted
 * markup is still sanitized normally.
 */
let configured = false;
function ensureConfigured(): void {
	if (configured) return;
	configured = true;
	DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
		if (
			data.attrName === 'src' &&
			typeof data.attrValue === 'string' &&
			data.attrValue.startsWith('blob:')
		) {
			data.forceKeepAttr = true;
		}
	});
}

/** Sanitizes rich question/answer HTML (allows images, basic formatting). */
export function sanitizeRich(html: string): string {
	ensureConfigured();
	return DOMPurify.sanitize(html);
}

/** Sanitizes an FTS snippet, allowing only inline emphasis + the <mark> tag. */
export function sanitizeSnippet(html: string): string {
	ensureConfigured();
	return DOMPurify.sanitize(html, {
		ALLOWED_TAGS: ['mark', 'b', 'i', 'em', 'strong'],
		ALLOWED_ATTR: []
	});
}

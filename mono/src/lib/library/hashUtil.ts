/**
 * Tiny synchronous FNV-1a hash → hex string. Used for content fingerprints
 * inside the worker, where the async Web Crypto API is inconvenient. Not
 * cryptographic; collision resistance is not required here.
 */
export function fnv1aHex(input: string): string {
	let hash = 0x811c9dc5;
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		// 32-bit FNV prime multiply via shifts to stay in integer range.
		hash = Math.imul(hash, 0x01000193);
	}
	// Force unsigned and pad to 8 hex chars.
	return (hash >>> 0).toString(16).padStart(8, '0');
}

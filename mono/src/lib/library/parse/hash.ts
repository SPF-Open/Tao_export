/**
 * SHA-256 hex digest of raw bytes, used as the stable `source_hash` for an
 * imported ZIP (drives duplicate detection). Runs on the main thread via the
 * Web Crypto API.
 */
export async function sha256Hex(bytes: ArrayBuffer | Uint8Array): Promise<string> {
	const buffer = bytes instanceof Uint8Array ? toArrayBuffer(bytes) : bytes;
	const digest = await crypto.subtle.digest('SHA-256', buffer);
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
	// Copy to guarantee a plain ArrayBuffer (not a SharedArrayBuffer view).
	return u8.slice().buffer;
}

/**
 * Whole-database encryption for exported `.taodb` files.
 *
 * The stock `@sqlite.org/sqlite-wasm` build has no SQLCipher, so the live
 * database cannot be page-encrypted. Instead we encrypt the *entire* exported
 * SQLite image with the Web Crypto API (PBKDF2 → AES-GCM) and decrypt it on
 * open. A single password protects all of the data — no per-test granularity.
 *
 * Container layout (all binary, no base64):
 *   offset  size  field
 *   0       8     magic  = ASCII "TAOEDB01"
 *   8       16    salt   (PBKDF2)
 *   24      12    iv     (AES-GCM nonce)
 *   36      ...   ciphertext + 16-byte GCM auth tag
 *
 * A plaintext SQLite file starts with "SQLite format 3\0", so the distinct
 * magic lets {@link isEncryptedBytes} tell the two apart cheaply.
 */

const MAGIC = new TextEncoder().encode('TAOEDB01');
const MAGIC_LEN = MAGIC.length; // 8
const SALT_LEN = 16;
const IV_LEN = 12;
const HEADER_LEN = MAGIC_LEN + SALT_LEN + IV_LEN; // 36
const PBKDF2_ITERATIONS = 250_000;

/** True when `bytes` begins with the encrypted-container magic. */
export function isEncryptedBytes(bytes: Uint8Array): boolean {
	if (bytes.length < MAGIC_LEN) return false;
	for (let i = 0; i < MAGIC_LEN; i++) {
		if (bytes[i] !== MAGIC[i]) return false;
	}
	return true;
}

/** Reads only the leading bytes of a file to detect the encrypted magic. */
export async function isEncryptedFile(file: File): Promise<boolean> {
	const head = new Uint8Array(await file.slice(0, MAGIC_LEN).arrayBuffer());
	return isEncryptedBytes(head);
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
	const material = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		'PBKDF2',
		false,
		['deriveKey']
	);
	return crypto.subtle.deriveKey(
		{ name: 'PBKDF2', salt: toArrayBuffer(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
		material,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

/** Encrypts a raw SQLite image into a self-describing encrypted container. */
export async function encryptDb(
	plaintext: Uint8Array,
	password: string
): Promise<Uint8Array<ArrayBuffer>> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
	const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
	const key = await deriveKey(password, salt);
	const cipher = new Uint8Array(
		await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(plaintext))
	);

	const out = new Uint8Array(HEADER_LEN + cipher.length);
	out.set(MAGIC, 0);
	out.set(salt, MAGIC_LEN);
	out.set(iv, MAGIC_LEN + SALT_LEN);
	out.set(cipher, HEADER_LEN);
	return out;
}

/**
 * Decrypts a container produced by {@link encryptDb}. Throws a friendly error
 * when the password is wrong or the file is corrupted (AES-GCM auth failure).
 */
export async function decryptDb(
	container: Uint8Array,
	password: string
): Promise<Uint8Array<ArrayBuffer>> {
	if (!isEncryptedBytes(container) || container.length <= HEADER_LEN) {
		throw new Error('This file is not an encrypted library.');
	}
	const salt = container.subarray(MAGIC_LEN, MAGIC_LEN + SALT_LEN);
	const iv = container.subarray(MAGIC_LEN + SALT_LEN, HEADER_LEN);
	const cipher = container.subarray(HEADER_LEN);
	const key = await deriveKey(password, salt);
	try {
		const plain = await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv: toArrayBuffer(iv) },
			key,
			toArrayBuffer(cipher)
		);
		return new Uint8Array(plain);
	} catch {
		throw new Error('Incorrect password or corrupted file.');
	}
}

/** Copies a (possibly subarray-backed) view into a standalone ArrayBuffer. */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

import { LICENSE_PUBLIC_KEY, LICENSE_TOKEN_PREFIX, LICENSE_VERSION } from "./config";

export type LicensePayload = {
	sub: string;
	email: string;
	name?: string;
	exp: number;
	iat: number;
	tier: string;
	version: number;
};

export type LicenseVerificationResult =
	| { status: "valid"; payload: LicensePayload; token: string }
	| { status: "expired"; payload: LicensePayload }
	| { status: "malformed"; message: string }
	| { status: "wrong-signature"; message: string }
	| { status: "unsupported-version"; payload: LicensePayload }
	| { status: "config-error"; message: string };

const ECDSA_IMPORT_ALGORITHM: EcKeyImportParams = {
	name: "ECDSA",
	namedCurve: "P-256"
};

const ECDSA_VERIFY_ALGORITHM: EcdsaParams = {
	name: "ECDSA",
	hash: "SHA-256"
};

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function base64UrlToBytes(value: string): Uint8Array {
	const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
	const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

export function bytesToBase64Url(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function parseLicensePayload(payloadSegment: string): LicensePayload | null {
	try {
		const text = new TextDecoder().decode(base64UrlToBytes(payloadSegment));
		const payload = JSON.parse(text) as Partial<LicensePayload>;
		if (
			typeof payload.sub !== "string" ||
			typeof payload.email !== "string" ||
			(payload.name !== undefined && typeof payload.name !== "string") ||
			typeof payload.exp !== "number" ||
			typeof payload.iat !== "number" ||
			typeof payload.tier !== "string" ||
			typeof payload.version !== "number"
		) {
			return null;
		}
		return payload as LicensePayload;
	} catch {
		return null;
	}
}

export function formatLicenseExpiry(exp: number): string {
	return new Date(exp * 1000).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric"
	});
}

export async function verifyLicenseToken(
	token: string,
	publicKey: JsonWebKey = LICENSE_PUBLIC_KEY,
	nowMs = Date.now()
): Promise<LicenseVerificationResult> {
	const trimmed = token.trim();
	const [prefix, payloadSegment, signatureSegment, extra] = trimmed.split(".");
	if (extra !== undefined || prefix !== LICENSE_TOKEN_PREFIX || !payloadSegment || !signatureSegment) {
		return { status: "malformed", message: "Use the full token from your activation email." };
	}

	const payload = parseLicensePayload(payloadSegment);
	if (!payload) {
		return { status: "malformed", message: "The token payload is not readable." };
	}

	if (payload.version !== LICENSE_VERSION) {
		return { status: "unsupported-version", payload };
	}

	let key: CryptoKey;
	try {
		key = await crypto.subtle.importKey(
			"jwk",
			publicKey,
			ECDSA_IMPORT_ALGORITHM,
			false,
			["verify"]
		);
	} catch {
		return { status: "config-error", message: "The license public key is not configured correctly." };
	}

	let signature: Uint8Array;
	try {
		signature = base64UrlToBytes(signatureSegment);
	} catch {
		return { status: "malformed", message: "The token signature is not readable." };
	}

	const signedData = new TextEncoder().encode(`${prefix}.${payloadSegment}`);
	const ok = await crypto.subtle.verify(
		ECDSA_VERIFY_ALGORITHM,
		key,
		toArrayBuffer(signature),
		toArrayBuffer(signedData)
	);
	if (!ok) {
		return { status: "wrong-signature", message: "The token signature is not valid." };
	}

	if (payload.exp * 1000 < nowMs) {
		return { status: "expired", payload };
	}

	return { status: "valid", payload, token: trimmed };
}

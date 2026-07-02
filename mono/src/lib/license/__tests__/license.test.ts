import { describe, expect, test } from 'vitest';
import {
	bytesToBase64Url,
	type LicensePayload,
	parseLicensePayload,
	verifyLicenseToken
} from "../crypto";

async function createSignedToken(payload: LicensePayload) {
	const keyPair = await crypto.subtle.generateKey(
		{ name: "ECDSA", namedCurve: "P-256" },
		true,
		["sign", "verify"]
	);
	const publicKey = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
	const payloadSegment = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
	const signedData = new TextEncoder().encode(`tao1.${payloadSegment}`);
	const signature = await crypto.subtle.sign(
		{ name: "ECDSA", hash: "SHA-256" },
		keyPair.privateKey,
		signedData
	);
	return {
		publicKey,
		token: `tao1.${payloadSegment}.${bytesToBase64Url(new Uint8Array(signature))}`
	};
}

function payload(overrides: Partial<LicensePayload> = {}): LicensePayload {
	return {
		sub: "lic_test",
		email: "user@example.com",
		name: "Test User",
		exp: 4_102_444_799,
		iat: 1_735_689_600,
		tier: "supporter",
		version: 1,
		...overrides
	};
}

describe("license verification", () => {
	test("accepts a valid named expiring token", async () => {
		const signed = await createSignedToken(payload());
		const result = await verifyLicenseToken(signed.token, signed.publicKey, Date.UTC(2026, 0, 1));
		expect(result.status).toBe("valid");
		if (result.status === "valid") {
			expect(result.payload.name).toBe("Test User");
			expect(result.payload.email).toBe("user@example.com");
		}
	});

	test("rejects expired tokens", async () => {
		const signed = await createSignedToken(payload({ exp: 1_735_689_600 }));
		const result = await verifyLicenseToken(signed.token, signed.publicKey, Date.UTC(2026, 0, 1));
		expect(result.status).toBe("expired");
	});

	test("rejects tampered payloads", async () => {
		const signed = await createSignedToken(payload());
		const [prefix, payloadSegment, signatureSegment] = signed.token.split(".");
		const parsed = parseLicensePayload(payloadSegment)!;
		const tamperedPayload = bytesToBase64Url(
			new TextEncoder().encode(JSON.stringify({ ...parsed, email: "other@example.com" }))
		);
		const result = await verifyLicenseToken(
			`${prefix}.${tamperedPayload}.${signatureSegment}`,
			signed.publicKey,
			Date.UTC(2026, 0, 1)
		);
		expect(result.status).toBe("wrong-signature");
	});

	test("rejects tampered signatures", async () => {
		const signed = await createSignedToken(payload());
		const result = await verifyLicenseToken(
			`${signed.token.slice(0, -1)}A`,
			signed.publicKey,
			Date.UTC(2026, 0, 1)
		);
		expect(result.status).toBe("wrong-signature");
	});

	test("rejects malformed tokens", async () => {
		const result = await verifyLicenseToken("not-a-token", {}, Date.UTC(2026, 0, 1));
		expect(result.status).toBe("malformed");
	});

	test("rejects unsupported token versions", async () => {
		const signed = await createSignedToken(payload({ version: 99 }));
		const result = await verifyLicenseToken(signed.token, signed.publicKey, Date.UTC(2026, 0, 1));
		expect(result.status).toBe("unsupported-version");
	});
});

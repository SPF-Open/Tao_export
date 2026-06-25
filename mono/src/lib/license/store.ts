import { writable } from "svelte/store";
import { formatLicenseExpiry, type LicensePayload, verifyLicenseToken } from "./crypto";

const STORAGE_KEY = "tao-license-token";

export type LicenseState =
	| { status: "checking" }
	| { status: "missing" }
	| { status: "valid"; token: string; payload: LicensePayload }
	| { status: "invalid"; token: string; message: string };

export type AppliedLicenseState = Extract<LicenseState, { status: "valid" | "invalid" }>;

export const licenseState = writable<LicenseState>({ status: "checking" });
export const licenseDialogOpen = writable(false);

let initialized = false;

function getStoredToken(): string | null {
	if (typeof localStorage === "undefined") return null;
	return localStorage.getItem(STORAGE_KEY);
}

function setStoredToken(token: string): void {
	if (typeof localStorage === "undefined") return;
	localStorage.setItem(STORAGE_KEY, token);
}

function removeStoredToken(): void {
	if (typeof localStorage === "undefined") return;
	localStorage.removeItem(STORAGE_KEY);
}

function messageFromResult(result: Awaited<ReturnType<typeof verifyLicenseToken>>): string {
	switch (result.status) {
		case "expired":
			return `This license expired on ${formatLicenseExpiry(result.payload.exp)}.`;
		case "unsupported-version":
			return "This license was made for another version of TAO.";
		case "malformed":
		case "wrong-signature":
		case "config-error":
			return result.message;
		case "valid":
			return "This license is already valid.";
	}
}

export async function applyLicenseToken(token: string, persist = true): Promise<AppliedLicenseState> {
	const result = await verifyLicenseToken(token);
	if (result.status === "valid") {
		if (persist) setStoredToken(result.token);
		const state: LicenseState = {
			status: "valid",
			token: result.token,
			payload: result.payload
		};
		licenseState.set(state);
		return state;
	}

	const state: LicenseState = {
		status: "invalid",
		token,
		message: messageFromResult(result)
	};
	licenseState.set(state);
	return state;
}

export async function initializeLicense(): Promise<void> {
	if (initialized) return;
	initialized = true;
	const token = getStoredToken();
	if (!token) {
		licenseState.set({ status: "missing" });
		return;
	}
	await applyLicenseToken(token, false);
}

export function clearLicense(): void {
	removeStoredToken();
	licenseState.set({ status: "missing" });
}

export function licenseDisplayName(payload: LicensePayload): string {
	return payload.name?.trim() || payload.email;
}

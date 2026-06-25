export const LICENSE_TOKEN_PREFIX = "tao1";
export const LICENSE_VERSION = 1;
export const DEFAULT_LICENSE_TIER = "supporter";
export const PAYWALL_ENABLED = false;

// Replace this with the public JWK produced by scripts/license/generate-keypair.mjs.
// This key is public verification material only; never put a private JWK in app code.
export const LICENSE_PUBLIC_KEY: JsonWebKey = {
	key_ops: ["verify"],
	ext: true,
	kty: "EC",
    "x": "8ejcddvhSl6vg4nEmROznQ8gnXF77bWN8wYmkx18z0E",
    "y": "BzYp6m_AFpP-2mTgFYwPRHvDY_25dCuwcYSOSJJtV3k",
	crv: "P-256"
};

// Replace with your PayPal donation URL before publishing the paid build.
export const PAYPAL_DONATION_URL = "https://www.paypal.com/donate";

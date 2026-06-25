<script lang="ts">
	import { KeyRound, LockKeyhole, Mail, ExternalLink, CheckCircle2, XCircle } from "lucide-svelte";
	import Button from "$lib/ui/Button.svelte";
	import TextArea from "$lib/ui/TextArea.svelte";
	import { PAYPAL_DONATION_URL } from "./config";
	import {
		applyLicenseToken,
		clearLicense,
		licenseDialogOpen,
		licenseDisplayName,
		licenseState
	} from "./store";
	import { formatLicenseExpiry } from "./crypto";

	type Props = {
		compact?: boolean;
	};

	let { compact = false }: Props = $props();
	let tokenInput = $state("");
	let busy = $state(false);
	let localMessage = $state("");
	let licenseErrorMessage = $derived(
		localMessage || ($licenseState.status === "invalid" ? $licenseState.message : "")
	);

	async function activate() {
		localMessage = "";
		const token = tokenInput.trim();
		if (!token) {
			localMessage = "Paste the token from your activation email.";
			return;
		}
		busy = true;
		try {
			const state = await applyLicenseToken(token);
			if (state.status === "valid") {
				tokenInput = "";
				localMessage = "";
				licenseDialogOpen.set(false);
			} else {
				localMessage = state.message;
			}
		} finally {
			busy = false;
		}
	}
</script>

<section class:activation-shell={!compact} class:compact>
	<div class="activation-panel">
		<div class="activation-heading">
			<div class="heading-icon">
				<LockKeyhole size={20} />
			</div>
			<div>
				<h1>Activate TAO</h1>
				<p>Donate with PayPal, then paste the license token you received by email.</p>
			</div>
		</div>

		{#if $licenseState.status === "valid"}
			<div class="status-box success">
				<CheckCircle2 size={18} />
				<div>
					<strong>{licenseDisplayName($licenseState.payload)}</strong>
					<span>{$licenseState.payload.email} · expires {formatLicenseExpiry($licenseState.payload.exp)}</span>
				</div>
			</div>
		{:else if licenseErrorMessage}
			<div class="status-box danger">
				<XCircle size={18} />
				<div>
					<strong>License not accepted</strong>
					<span>{licenseErrorMessage}</span>
				</div>
			</div>
		{/if}

		<div class="action-row">
			<a class="paypal-link" href={PAYPAL_DONATION_URL} target="_blank" rel="noopener noreferrer">
				<ExternalLink size={16} />
				Donate with PayPal
			</a>
			<a class="email-link" href="mailto:license@lv0.eu?subject=TAO%20license%20token">
				<Mail size={16} />
				Token email
			</a>
		</div>

		<label class="token-field">
			<span>License token</span>
			<TextArea bind:value={tokenInput} rows={compact ? 4 : 5} placeholder="tao1..." disabled={busy} />
		</label>

		<div class="footer-row">
			<Button onclick={activate} disabled={busy}>
				<KeyRound size={16} />
				{busy ? "Checking..." : "Activate"}
			</Button>
			{#if $licenseState.status === "valid"}
				<Button variant="secondary" onclick={clearLicense}>Remove license</Button>
			{/if}
		</div>
	</div>
</section>

<style>
	.activation-shell {
		min-height: calc(100vh - var(--layout-header-height));
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 32px 16px;
		background: var(--bg);
	}

	.activation-panel {
		width: 100%;
		max-width: 560px;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-elevated);
		box-shadow: var(--shadow-lg);
		padding: 18px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.compact .activation-panel {
		border: none;
		box-shadow: none;
		padding: 0;
	}

	.activation-heading {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}

	.heading-icon {
		width: 36px;
		height: 36px;
		border-radius: var(--radius);
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--surface);
		color: var(--brand);
		border: 1px solid var(--border);
		flex-shrink: 0;
	}

	h1 {
		margin: 0;
		font-size: 20px;
		line-height: 1.2;
		color: var(--text);
	}

	p {
		margin: 4px 0 0;
		color: var(--text-muted);
	}

	.status-box {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		padding: 10px 12px;
		border-radius: var(--radius);
		border: 1px solid var(--border);
		background: var(--surface);
	}

	.status-box strong,
	.status-box span {
		display: block;
	}

	.status-box strong {
		color: var(--text);
		font-size: 13px;
	}

	.status-box span {
		color: var(--text-muted);
		font-size: 12px;
		margin-top: 2px;
	}

	.status-box.success {
		border-color: color-mix(in srgb, var(--success) 35%, var(--border));
	}

	.status-box.success :global(svg) {
		color: var(--success);
	}

	.status-box.danger {
		border-color: color-mix(in srgb, var(--danger) 35%, var(--border));
	}

	.status-box.danger :global(svg) {
		color: var(--danger);
	}

	.action-row,
	.footer-row {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}

	.paypal-link,
	.email-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 8px 12px;
		border-radius: var(--radius);
		border: 1px solid var(--border);
		color: var(--text);
		background: var(--surface);
		text-decoration: none;
		font-weight: 500;
	}

	.paypal-link {
		background: var(--primary);
		border-color: var(--primary);
		color: var(--primary-foreground);
	}

	.token-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		color: var(--text);
		font-size: 13px;
		font-weight: 600;
	}

	@media (max-width: 520px) {
		.activation-panel {
			padding: 14px;
		}

		.action-row {
			flex-direction: column;
		}

		.action-row > :global(*) {
			width: 100%;
		}

		.footer-row {
			flex-direction: column;
		}
	}
</style>

<script module lang="ts">
	declare const PKG: { version: string };
	declare const BUILD_DATE: string;
</script>

<script lang="ts">
	import "./layout.css";
	import { page } from "$app/state";
	import { Sun, Moon, Menu, Info, FileText } from "lucide-svelte";
	import { sidebarEnabled, sidebarOpen } from "$lib/sidebar";
	import { showDocsStore, showChangelogStore } from "$lib/about";
	import NotificationQueue from "$lib/ui/NotificationQueue.svelte";
	import Modal from "$lib/ui/Modal.svelte";
	import LicenseActivation from "$lib/license/LicenseActivation.svelte";
	import LicenseGate from "$lib/license/LicenseGate.svelte";
	import { PAYWALL_ENABLED } from "$lib/license/config";
	import {
		clearLicense,
		initializeLicense,
		licenseDialogOpen,
		licenseDisplayName,
		licenseState
	} from "$lib/license/store";
	import { formatLicenseExpiry } from "$lib/license/crypto";

	let { children } = $props();

	let darkMode = $state(
		typeof localStorage !== "undefined"
			? localStorage.getItem("darkMode") === "true"
			: false,
	);
	let showAbout = $state(false);

	$effect(() => {
		if (darkMode) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
		if (typeof localStorage !== "undefined") {
			localStorage.setItem("darkMode", String(darkMode));
		}
	});

	const APP_NAMES: Record<string, string> = {
		"/export": "export",
		"/import": "import",
		"/forge": "forge",
		"/iat": "iat",
	};

	let appName = $derived(APP_NAMES[page.url.pathname] ?? null);
	let protectedRoute = $derived(appName !== null);

	$effect(() => {
		initializeLicense();
	});

	// On a page that uses the sidebar, default it open on desktop/tablet but
	// closed on phones (where it becomes an overlay drawer).
	$effect(() => {
		if ($sidebarEnabled && typeof window !== "undefined") {
			sidebarOpen.set(window.innerWidth > 640);
		}
	});
</script>

<header class="layout-header hide-print">
	<div class="header-left">
		<button
			class="burger"
			onclick={() => sidebarOpen.update((v) => !v)}
			aria-label={$sidebarEnabled && $sidebarOpen
				? "Close sidebar"
				: "Open sidebar"}
			title="Toggle sidebar"
		>
			<Menu size={15} />
		</button>
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<a
				href="https://lv0.eu"
				class="bc-link bc-extern"
				target="_blank"
				rel="noopener noreferrer">lv0.eu</a
			>
			<span class="bc-sep bc-sep-extern" aria-hidden="true">/</span>
			<a href="/" class="bc-link">tao</a>
			{#if appName}
				<span class="bc-sep" aria-hidden="true">/</span>
				<span class="bc-current">{appName}</span>
			{/if}
		</nav>
	</div>
	<div class="header-right">
		<div class="about-container">
			<button
				class="icon-btn"
				onclick={() => (showAbout = !showAbout)}
				aria-label="About"
				title="About"
			>
				<Info size={15} />
			</button>
			{#if showAbout}
				<div class="about-menu" role="menu">
					{#if appName === 'export'}
						<button
							class="about-menu-item"
							role="menuitem"
							onclick={() => { showDocsStore.set(true); showAbout = false; }}
						>
							<FileText size={13} />
							<span>Documentation</span>
						</button>
						<button
							class="about-menu-item"
							role="menuitem"
							onclick={() => { showChangelogStore.set(true); showAbout = false; }}
						>
							<FileText size={13} />
							<span>Changelog</span>
						</button>
						<div class="about-menu-divider"></div>
					{/if}
					<div class="about-menu-info">
						<div class="info-row">
							<span class="info-label">Version</span>
							<span class="info-value">{PKG.version}</span>
						</div>
						<div class="info-row">
							<span class="info-label">Build</span>
							<span class="info-value">{BUILD_DATE}</span>
						</div>
						{#if $licenseState.status === 'valid'}
							<div class="info-row">
								<span class="info-label">License</span>
								<span class="info-value">{licenseDisplayName($licenseState.payload)}</span>
							</div>
							<div class="info-row">
								<span class="info-label">Expires</span>
								<span class="info-value">{formatLicenseExpiry($licenseState.payload.exp)}</span>
							</div>
						{/if}
					</div>
					{#if PAYWALL_ENABLED}
						<div class="about-menu-divider"></div>
						<button
							class="about-menu-item"
							role="menuitem"
							onclick={() => { licenseDialogOpen.set(true); showAbout = false; }}
						>
							<FileText size={13} />
							<span>{$licenseState.status === 'valid' ? 'Change license' : 'Activate license'}</span>
						</button>
						{#if $licenseState.status === 'valid'}
							<button
								class="about-menu-item"
								role="menuitem"
								onclick={() => { clearLicense(); showAbout = false; }}
							>
								<FileText size={13} />
								<span>Remove license</span>
							</button>
						{/if}
					{/if}
				</div>
			{/if}
		</div>
		<button
			class="icon-btn"
			onclick={() => (darkMode = !darkMode)}
			aria-label="Toggle dark mode"
			title="Toggle dark mode"
		>
			{#if darkMode}
				<Sun size={15} />
			{:else}
				<Moon size={15} />
			{/if}
		</button>
	</div>
</header>

{#if protectedRoute}
	<LicenseGate>
		{@render children()}
	</LicenseGate>
{:else}
	{@render children()}
{/if}

<Modal bind:open={$licenseDialogOpen} size="md">
	{#snippet title()}
		<span>TAO license</span>
	{/snippet}
	{#snippet children()}
		<LicenseActivation compact />
	{/snippet}
</Modal>
{#if $sidebarEnabled && $sidebarOpen}
	<button
		class="sidebar-backdrop hide-print"
		aria-label="Close menu"
		onclick={() => sidebarOpen.set(false)}
	></button>
{/if}
<NotificationQueue />

<style>
	.layout-header {
		position: sticky;
		top: 0;
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 36px;
		padding: 0 12px;
		background: var(--bg);
		border-bottom: 1px solid var(--border);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.burger {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border: none;
		background: transparent;
		color: var(--text-muted);
		border-radius: var(--radius);
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
		flex-shrink: 0;
	}

	.burger:hover {
		background: var(--surface);
		color: var(--text);
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		min-width: 0;
		overflow: hidden;
	}

	.bc-link,
	.bc-current {
		white-space: nowrap;
	}

	.sidebar-backdrop {
		display: none;
		position: fixed;
		inset: var(--layout-header-height) 0 0 0;
		background: rgba(0, 0, 0, 0.45);
		border: none;
		z-index: 55;
		animation: fadeIn 150ms ease;
		cursor: default;
	}

	.bc-link {
		color: var(--text-muted);
		text-decoration: none;
		font-weight: 500;
		transition: color 0.15s;
	}

	.bc-link:hover {
		color: var(--text);
	}

	.bc-sep {
		color: var(--border-strong);
		font-size: 12px;
	}

	.bc-current {
		color: var(--text);
		font-weight: 600;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.about-container {
		position: relative;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		background: transparent;
		color: var(--text-muted);
		border-radius: var(--radius);
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.icon-btn:hover {
		background: var(--surface);
		color: var(--text);
	}

	.about-menu {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		padding: 6px;
		background: var(--surface-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		min-width: 230px;
		z-index: 300;
		display: flex;
		flex-direction: column;
		gap: 2px;
		animation: fadeIn 0.12s ease;
	}

	.about-menu-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 10px;
		background: transparent;
		border: none;
		border-radius: var(--radius);
		color: var(--text);
		font-size: 13px;
		cursor: pointer;
		transition: background 0.15s;
		text-align: left;
		width: 100%;
	}

	.about-menu-item:hover {
		background: var(--surface);
	}

	.about-menu-divider {
		height: 1px;
		background: var(--border);
		margin: 3px 0;
	}

	.about-menu-info {
		display: flex;
		flex-direction: column;
		gap: 5px;
		padding: 7px 10px;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
	}

	.info-label {
		font-size: 11px;
		color: var(--text-muted);
		font-weight: 500;
	}

	.info-value {
		font-size: 11px;
		font-weight: 600;
		color: var(--text);
		font-family: monospace;
		text-align: right;
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-3px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	@media (max-width: 640px) {
		.sidebar-backdrop {
			display: block;
		}
		.bc-extern,
		.bc-sep-extern {
			display: none;
		}
		.about-menu {
			max-width: calc(100vw - 16px);
			max-height: 70vh;
			overflow: auto;
		}
		.burger {
			width: 34px;
			height: 34px;
		}
		.icon-btn {
			width: 36px;
			height: 36px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sidebar-backdrop {
			animation: none;
		}
	}

	@media print {
		.hide-print {
			display: none;
		}
	}
</style>

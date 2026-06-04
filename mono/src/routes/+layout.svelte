<script module lang="ts">
	declare const PKG: { version: string };
	declare const BUILD_DATE: string;
</script>

<script lang="ts">
	import "./layout.css";
	import { page } from "$app/stores";
	import { Sun, Moon, Menu, Info, FileText } from "lucide-svelte";
	import { sidebarEnabled, sidebarOpen } from "$lib/sidebar";
	import { showDocsStore, showChangelogStore } from "$lib/about";

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

	let appName = $derived(APP_NAMES[$page.url.pathname] ?? null);
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
				class="bc-link"
				target="_blank"
				rel="noopener noreferrer">lv0.eu</a
			>
			<span class="bc-sep" aria-hidden="true">/</span>
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
					</div>
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

{@render children()}

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
		min-width: 170px;
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
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-3px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	@media print {
		.hide-print {
			display: none;
		}
	}
</style>

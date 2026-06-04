<script lang="ts">
	import "./layout.css";
	import { page } from "$app/stores";
	import { Sun, Moon, Menu } from "lucide-svelte";
	import { sidebarEnabled, sidebarOpen } from "$lib/sidebar";

	let { children } = $props();

	let darkMode = $state(
		typeof localStorage !== "undefined"
			? localStorage.getItem("darkMode") === "true"
			: false,
	);

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
	<button
		class="dark-toggle"
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

	.dark-toggle {
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
		transition:
			background 0.2s,
			color 0.2s;
	}

	.dark-toggle:hover {
		background: var(--surface);
		color: var(--text);
	}

	@media print {
		.hide-print {
			display: none;
		}
	}
</style>

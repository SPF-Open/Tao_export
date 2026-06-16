<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { X, Trash2 } from 'lucide-svelte';

	interface Props {
		onclose?: () => void;
	}

	let { onclose }: Props = $props();

	type Tab = 'info' | 'logs' | 'errors' | 'network';

	let tab = $state<Tab>('info');
	let logs = $state<string[]>([]);
	let errors = $state<string[]>([]);
	let requests = $state<{ url: string; status: number | string; duration: number }[]>([]);
	let browserInfo = $state<Record<string, string>>({});
	let memoryInfo = $state<{ used: number; total: number } | null>(null);

	function addLog(message: string) {
		logs.unshift(`[${new Date().toLocaleTimeString()}] ${message}`);
		if (logs.length > 100) logs.pop();
	}

	// Reactive: re-runs only when $page changes (route navigation)
	$effect(() => {
		browserInfo = {
			Route: page.url.pathname,
			Language: navigator.language,
			Platform: navigator.platform,
			Screen: `${screen.width}×${screen.height}`,
			Viewport: `${window.innerWidth}×${window.innerHeight}`,
			Online: navigator.onLine ? 'Yes' : 'No',
		};

		const mem = (performance as any).memory;
		if (mem) {
			memoryInfo = {
				used: Math.round(mem.usedJSHeapSize / 1024 / 1024),
				total: Math.round(mem.totalJSHeapSize / 1024 / 1024),
			};
		}
	});

	// Runs once on mount — never in $effect or it re-patches fetch every time requests changes
	onMount(() => {
		const originalFetch = window.fetch;
		window.fetch = async (...args) => {
			const start = performance.now();
			try {
				const response = await originalFetch(...args);
				requests.unshift({
					url: String(args[0]),
					status: response.status,
					duration: Math.round(performance.now() - start),
				});
				return response;
			} catch (error) {
				requests.unshift({
					url: String(args[0]),
					status: 'ERR',
					duration: Math.round(performance.now() - start),
				});
				throw error;
			}
		};

		const errorHandler = (e: ErrorEvent) => {
			errors.unshift(`${e.message} (${e.filename}:${e.lineno})`);
			tab = 'errors';
		};
		const rejectionHandler = (e: PromiseRejectionEvent) => {
			errors.unshift(`Promise: ${String(e.reason)}`);
			tab = 'errors';
		};
		const onlineHandler = () => addLog('Online');
		const offlineHandler = () => addLog('Offline');

		window.addEventListener('error', errorHandler);
		window.addEventListener('unhandledrejection', rejectionHandler);
		window.addEventListener('online', onlineHandler);
		window.addEventListener('offline', offlineHandler);

		addLog('Debug panel opened');

		return () => {
			window.fetch = originalFetch;
			window.removeEventListener('error', errorHandler);
			window.removeEventListener('unhandledrejection', rejectionHandler);
			window.removeEventListener('online', onlineHandler);
			window.removeEventListener('offline', offlineHandler);
		};
	});

	function clearCurrent() {
		if (tab === 'logs') logs = [];
		else if (tab === 'errors') errors = [];
		else if (tab === 'network') requests = [];
	}

	const canClear = $derived(tab === 'logs' || tab === 'errors' || tab === 'network');
	const tabs: { id: Tab; label: string; badge?: () => number }[] = [
		{ id: 'info', label: 'Info' },
		{ id: 'logs', label: 'Logs', badge: () => logs.length },
		{ id: 'errors', label: 'Errors', badge: () => errors.length },
		{ id: 'network', label: 'Network', badge: () => requests.length },
	];
</script>

<div class="panel">
	<div class="panel-header">
		<span class="panel-title">Debug</span>
		<div class="panel-actions">
			{#if canClear}
				<button class="icon-btn" onclick={clearCurrent} title="Clear">
					<Trash2 size={13} />
				</button>
			{/if}
			<button class="icon-btn" onclick={onclose} title="Close">
				<X size={13} />
			</button>
		</div>
	</div>

	<div class="tabs" role="tablist">
		{#each tabs as t}
			<button
				role="tab"
				aria-selected={tab === t.id}
				class="tab"
				class:active={tab === t.id}
				onclick={() => (tab = t.id)}
			>
				{t.label}
				{#if t.badge && t.badge() > 0}
					<span class="badge" class:danger={t.id === 'errors'}>{t.badge()}</span>
				{/if}
			</button>
		{/each}
	</div>

	<div class="content">
		{#if tab === 'info'}
			<table class="info-table">
				<tbody>
					{#each Object.entries(browserInfo) as [key, value]}
						<tr>
							<td class="key">{key}</td>
							<td class="val">{value}</td>
						</tr>
					{/each}
					{#if memoryInfo}
						<tr><td class="section-sep" colspan="2">Memory (Chrome)</td></tr>
						<tr>
							<td class="key">JS Heap used</td>
							<td class="val">{memoryInfo.used} MB</td>
						</tr>
						<tr>
							<td class="key">JS Heap total</td>
							<td class="val">{memoryInfo.total} MB</td>
						</tr>
					{/if}
				</tbody>
			</table>

		{:else if tab === 'logs'}
			{#if logs.length === 0}
				<p class="empty">No logs yet.</p>
			{:else}
				{#each logs as log}
					<div class="entry log">{log}</div>
				{/each}
			{/if}

		{:else if tab === 'errors'}
			{#if errors.length === 0}
				<p class="empty">No errors caught.</p>
			{:else}
				{#each errors as error}
					<div class="entry error">{error}</div>
				{/each}
			{/if}

		{:else if tab === 'network'}
			{#if requests.length === 0}
				<p class="empty">No requests yet.</p>
			{:else}
				{#each requests as req}
					<div class="entry network">
						<span class="status" class:ok={typeof req.status === 'number' && req.status < 400} class:err={req.status === 'ERR' || (typeof req.status === 'number' && req.status >= 400)}>
							{req.status}
						</span>
						<span class="duration">{req.duration}ms</span>
						<span class="url">{req.url}</span>
					</div>
				{/each}
			{/if}
		{/if}
	</div>
</div>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--surface-elevated);
		border-left: 1px solid var(--border);
		font-size: 12px;
		font-family: var(--font-family);
		color: var(--text);
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 10px;
		height: 36px;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}

	.panel-title {
		font-weight: 600;
		font-size: 13px;
		color: var(--text);
	}

	.panel-actions {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
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

	.tabs {
		display: flex;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}

	.tab {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		padding: 6px 4px;
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-size: 11px;
		font-weight: 500;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: color 0.15s, border-color 0.15s;
	}

	.tab.active {
		color: var(--primary);
		border-bottom-color: var(--primary);
	}

	.tab:hover:not(.active) {
		color: var(--text);
	}

	.badge {
		font-size: 10px;
		font-weight: 600;
		background: var(--border);
		color: var(--text-muted);
		padding: 0 5px;
		border-radius: 9999px;
		min-width: 16px;
		text-align: center;
	}

	.badge.danger {
		background: var(--danger);
		color: var(--danger-foreground);
	}

	.content {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.empty {
		color: var(--text-muted);
		font-size: 12px;
		margin: 12px auto;
		text-align: center;
	}

	/* Info table */
	.info-table {
		width: 100%;
		border-collapse: collapse;
	}

	.info-table td {
		padding: 4px 6px;
		vertical-align: top;
	}

	.info-table .key {
		color: var(--text-muted);
		white-space: nowrap;
		width: 40%;
	}

	.info-table .val {
		color: var(--text);
		word-break: break-all;
		font-family: monospace;
	}

	.section-sep {
		color: var(--text-muted);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding-top: 10px !important;
		font-weight: 600;
	}

	/* Entries */
	.entry {
		padding: 4px 6px;
		border-radius: var(--radius);
		font-family: monospace;
		font-size: 11px;
		line-height: 1.5;
		word-break: break-all;
		background: var(--surface);
	}

	.entry.log {
		color: var(--primary);
	}

	.entry.error {
		color: var(--danger);
		background: color-mix(in srgb, var(--danger) 8%, transparent);
	}

	.entry.network {
		display: flex;
		align-items: baseline;
		gap: 6px;
		flex-wrap: wrap;
	}

	.status {
		font-weight: 700;
		flex-shrink: 0;
	}

	.status.ok {
		color: var(--success);
	}

	.status.err {
		color: var(--danger);
	}

	.duration {
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.url {
		color: var(--text);
		word-break: break-all;
	}
</style>
<script lang="ts">
	import type { TaoTools, TimeLimits } from './types.js';
	import { TOOL_LABELS } from './tao-tools.js';

	interface Props {
		tools: TaoTools;
		timeLimits?: TimeLimits;
	}

	let { tools, timeLimits }: Props = $props();

	const enabledTools = $derived(
		Object.entries(tools)
			.filter(([, v]) => v === true)
			.map(([k]) => ({ key: k, label: TOOL_LABELS[k] ?? k }))
	);

	function formatTime(seconds: number): string {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`;
		return `${m}min`;
	}
</script>

{#if enabledTools.length > 0 || timeLimits?.maxTime}
	<div class="badge-row">
		{#if timeLimits?.maxTime}
			<span class="badge badge-time">
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
				</svg>
				{formatTime(timeLimits.maxTime)}
			</span>
		{/if}
		{#each enabledTools as tool (tool.key)}
			<span class="badge">{tool.label}</span>
		{/each}
	</div>
{/if}

<style>
	.badge-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: center;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		border-radius: var(--radius);
		border: 1px solid var(--border);
		background: var(--surface-elevated);
		color: var(--text-muted);
		font-size: 11px;
		font-weight: 500;
		line-height: 1.6;
		white-space: nowrap;
	}

	.badge-time {
		color: var(--text);
		border-color: var(--border-strong);
	}
</style>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Wrench } from 'lucide-svelte';

	let { endTime }: { endTime: string | Date } = $props();
	
	let timeLeft = $state({ hours: 0, minutes: 0, seconds: 0 });
	let isActive = $state(true);
	let interval: ReturnType<typeof setInterval> | null = null;

	function calculateTimeLeft() {
		const now = new Date().getTime();
		const end = typeof endTime === 'string' ? new Date(endTime).getTime() : endTime.getTime();
		const difference = end - now;

		if (difference <= 0) {
			isActive = false;
			timeLeft = { hours: 0, minutes: 0, seconds: 0 };
			if (interval) {
				clearInterval(interval);
				interval = null;
			}
			return;
		}

		timeLeft = {
			hours: Math.floor(difference / (1000 * 60 * 60)),
			minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
			seconds: Math.floor((difference % (1000 * 60)) / 1000)
		};
	}

	function formatTime(value: number): string {
		return value.toString().padStart(2, '0');
	}

	onMount(() => {
		calculateTimeLeft();
		interval = setInterval(calculateTimeLeft, 1000);
	});

	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});
</script>

{#if isActive}
	<div class="overlay">
		<div class="maintenance-card">
			<div class="icon"><Wrench size={56} strokeWidth={1.5} /></div>
			<h1>Maintenance en cours</h1>
			<p class="message">L'accès est temporairement verrouillé pour maintenance.</p>
			
			<div class="countdown">
				<div class="time-unit">
					<span class="value">{formatTime(timeLeft.hours)}</span>
					<span class="label">Heures</span>
				</div>
				<span class="separator">:</span>
				<div class="time-unit">
					<span class="value">{formatTime(timeLeft.minutes)}</span>
					<span class="label">Minutes</span>
				</div>
				<span class="separator">:</span>
				<div class="time-unit">
					<span class="value">{formatTime(timeLeft.seconds)}</span>
					<span class="label">Secondes</span>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 2rem;
	}

	.maintenance-card {
		background: var(--surface-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-xl);
		padding: 3rem;
		max-width: 500px;
		width: 100%;
		text-align: center;
		box-shadow: var(--shadow-xl), 0 0 40px rgba(var(--brand-rgb), 0.12);
	}

	.icon {
		display: grid;
		place-items: center;
		width: 96px;
		height: 96px;
		margin: 0 auto 1.25rem;
		border-radius: var(--radius-xl);
		color: var(--brand);
		background: rgba(var(--brand-rgb), 0.1);
		border: 1px solid rgba(var(--brand-rgb), 0.22);
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.06);
			opacity: 0.85;
		}
	}

	h1 {
		margin: 0 0 1rem 0;
		font-size: 2rem;
		font-weight: 700;
		color: var(--text);
	}

	.message {
		margin: 0 0 2rem 0;
		color: var(--text-muted);
		font-size: 1rem;
		line-height: 1.5;
	}

	.countdown {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin: 2rem 0;
	}

	.time-unit {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.value {
		font-size: 3rem;
		font-weight: 700;
		color: var(--brand);
		font-variant-numeric: tabular-nums;
		min-width: 60px;
	}

	.label {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.separator {
		font-size: 2.5rem;
		color: rgba(var(--brand-rgb), 0.6);
		font-weight: 300;
		margin-bottom: 1.5rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.icon { animation: none; }
	}
</style>


<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

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
			<div class="icon">🔧</div>
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
		background: rgba(0, 0, 0, 0.95);
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 2rem;
	}

	.maintenance-card {
		background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
		border: 1px solid rgba(102, 227, 255, 0.3);
		border-radius: 20px;
		padding: 3rem;
		max-width: 500px;
		width: 100%;
		text-align: center;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(102, 227, 255, 0.1);
	}

	.icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.1);
			opacity: 0.8;
		}
	}

	h1 {
		margin: 0 0 1rem 0;
		font-size: 2rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.95);
	}

	.message {
		margin: 0 0 2rem 0;
		color: rgba(255, 255, 255, 0.7);
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
		color: #66e3ff;
		text-shadow: 0 0 20px rgba(102, 227, 255, 0.5);
		font-variant-numeric: tabular-nums;
		min-width: 60px;
	}

	.label {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.separator {
		font-size: 2.5rem;
		color: rgba(102, 227, 255, 0.6);
		font-weight: 300;
		margin-bottom: 1.5rem;
	}

	.submessage {
		margin: 1.5rem 0 0 0;
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.9rem;
	}
</style>


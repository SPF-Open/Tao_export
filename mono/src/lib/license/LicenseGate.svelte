<script lang="ts">
	import LicenseActivation from "./LicenseActivation.svelte";
	import { PAYWALL_ENABLED } from "./config";
	import { initializeLicense, licenseState } from "./store";

	type Props = {
		children?: import("svelte").Snippet;
	};

	let { children }: Props = $props();

	$effect(() => {
		initializeLicense();
	});
</script>

{#if !PAYWALL_ENABLED || $licenseState.status === "valid"}
	{@render children?.()}
{:else if $licenseState.status === "checking"}
	<div class="checking">Checking license...</div>
{:else}
	<LicenseActivation />
{/if}

<style>
	.checking {
		min-height: calc(100vh - var(--layout-header-height));
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
	}
</style>

<script lang="ts">
  import type { PageInfo } from "$lib/iat/store";

  let { pagesData }: { pagesData?: Record<number, PageInfo> } = $props();
</script>

{#if pagesData}
  <!-- Kept as a compatibility wrapper for older imports. -->
{/if}

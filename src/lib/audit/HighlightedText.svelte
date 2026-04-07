<script lang="ts">
  import type { DiffChunk } from './types';

  interface Props {
    diffs?: DiffChunk[] | null;
    text?: string | null;
    class?: string;
  }

  let { diffs = null, text = null, class: className = '' }: Props = $props();
</script>

<span class={className}>
  {#if diffs && diffs.length > 0}
    {#each diffs as chunk (diffs.indexOf(chunk))}
      {#if chunk.type === 'equal'}
        <span>{chunk.text}</span>
      {:else if chunk.type === 'added'}
        <span class="diff-added">{chunk.text}</span>
      {:else if chunk.type === 'removed'}
        <span class="diff-removed">{chunk.text}</span>
      {/if}
    {/each}
  {:else if text}
    <span>{text}</span>
  {:else}
    <span></span>
  {/if}
</span>
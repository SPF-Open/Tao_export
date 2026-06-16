<script lang="ts">
  interface Props {
    title?: string;
    children?: import('svelte').Snippet;
  }

  let { title = '', children }: Props = $props();
</script>

<fieldset>
  <legend>{title}</legend>
  {@render children?.()}
</fieldset>

<style>
  fieldset {
    position: relative;
    border: 1px solid var(--border);
    display: flex;
    justify-content: start;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.3rem;
    border-radius: var(--radius-lg);
    min-height: 29px;
    height: fit-content;
    padding: 6px 10px 8px 10px;
    margin: 0;
  }
  legend {
    padding: 0 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
</style>

<script lang="ts">
  interface Choice {
    label: string;
    value: string | boolean | number;
    disabled?: boolean;
  }

  interface Props {
    legend?: string;
    choices?: Choice[];
    value?: string | boolean | number;
    disabled?: boolean;
  }

  let { legend = "", choices = [], value = $bindable(), disabled = false }: Props = $props();
</script>

<fieldset class:combobox={legend}>
  {#if legend}
    <legend class="combobox-legend">{legend}</legend>
  {/if}
  <select class="combobox-select" bind:value {disabled}>
    {#each choices as choice}
      <option value={choice.value} disabled={choice.disabled}>{choice.label}</option>
    {/each}
  </select>
</fieldset>

<style>
  .combobox {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 6px 10px 8px 10px;
    margin: 0;
    min-height: 0;
  }

  .combobox-legend {
    padding: 0 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-muted);
    line-height: 1;
  }

  .combobox-select {
    width: 100%;
    padding: 4px 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background-color: var(--surface);
    color: var(--text);
    font-family: var(--font-family);
    font-size: var(--font-size-base);
    line-height: var(--line-height);
    cursor: pointer;
    transition: border-color 200ms ease, box-shadow 200ms ease;
  }

  .combobox-select:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
  }

  .combobox-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  :global(.dark) .combobox-select:focus {
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
  }
</style>

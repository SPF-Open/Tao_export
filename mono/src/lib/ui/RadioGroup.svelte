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
  }

  let { legend = "", choices = [], value = $bindable() }: Props = $props();
</script>

<fieldset class="radio-group">
  {#if legend}
    <legend class="radio-legend">{legend}</legend>
  {/if}
  <div class="radio-options">
    {#each choices as choice}
      <label class="radio-label" class:disabled={choice.disabled}>
        <input
          type="radio"
          class="radio-input"
          bind:group={value}
          value={choice.value}
          disabled={choice.disabled}
        />
        <span class="radio-dot"></span>
        <span class="radio-text">{choice.label}</span>
      </label>
    {/each}
  </div>
</fieldset>

<style>
  .radio-group {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 6px 10px 8px 10px;
    margin: 0;
    min-height: 0;
  }

  .radio-legend {
    padding: 0 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-muted);
    line-height: 1;
  }

  .radio-options {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    margin-top: 4px;
  }

  .radio-label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    user-select: none;
    font-size: var(--font-size-base);
    color: var(--text);
    line-height: var(--line-height);
  }

  .radio-label.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .radio-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  .radio-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid var(--border-strong);
    background: var(--surface);
    flex-shrink: 0;
    transition: border-color 150ms ease, border-width 150ms ease, background-color 150ms ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .radio-input:checked + .radio-dot {
    border: 4px solid var(--primary);
    background: var(--surface-elevated);
  }

  .radio-input:focus-visible + .radio-dot {
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.25);
    border-color: var(--brand);
  }

  .radio-text {
    white-space: nowrap;
  }
</style>

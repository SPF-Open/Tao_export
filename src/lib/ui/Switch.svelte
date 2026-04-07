<script lang="ts">
  interface Props {
    checked?: boolean;
    disabled?: boolean;
    ["bind:checked"]?: any;
  }

  let { checked = $bindable(false), disabled = false } = $props();
</script>

<button
  role="switch"
  aria-checked={checked}
  aria-disabled={disabled}
  aria-label="Toggle switch"
  disabled={disabled}
  class="switch"
  class:checked
  class:disabled
  onkeydown={(e) => {
    if ((e.key === " " || e.key === "Enter") && !disabled) {
      e.preventDefault();
      checked = !checked;
    }
  }}
  onclick={() => {
    if (!disabled) {
      checked = !checked;
    }
  }}
></button>

<style>
  .switch {
    position: relative;
    width: 32px;
    height: 18px;
    border: none;
    border-radius: 9px;
    background-color: var(--border);
    cursor: pointer;
    transition: background-color 200ms ease, box-shadow 200ms ease;
    padding: 0;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .switch::after {
    content: "";
    position: absolute;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-color: var(--accent-foreground);
    left: 2px;
    transition: left 200ms ease;
    box-shadow: var(--shadow-sm);
  }

  .switch.checked {
    background-color: var(--primary);
  }

  .switch.checked::after {
    left: 16px;
  }

  .switch:hover:not(.disabled) {
    box-shadow: var(--shadow-sm);
  }

  .switch:focus {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  .switch.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>

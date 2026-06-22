<script lang="ts">
  interface Props {
    value?: string;
    disabled?: boolean;
    placeholder?: string;
  }

  let { value = $bindable(""), disabled = $bindable(false), placeholder = "" }: Props = $props();
</script>

<input
  type="text"
  bind:value={value}
  disabled={disabled}
  placeholder={placeholder}
  maxlength="1"
  class="char"
/>

<style>
  .char {
    width: 2.5rem;
    height: 2.25rem;
    text-align: center;
    padding: 8px 6px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background-color: var(--surface);
    color: var(--text);
    font-family: var(--font-family);
    font-size: var(--font-size-base);
    line-height: var(--line-height);
    transition: border-color 200ms ease, box-shadow 200ms ease, background-color 200ms ease;
  }

  .char::placeholder {
    color: var(--text-muted);
  }

  .char:focus {
    outline: none;
    border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  .char:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--surface);
  }
</style>

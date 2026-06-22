<script lang="ts">
  interface Props {
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    type?: string;
    ["bind:value"]?: any;
  }

  let { value = $bindable(""), placeholder = "", disabled = false, type = "text" } = $props();
</script>

<input
  type={type}
  bind:value
  placeholder={placeholder}
  disabled={disabled}
  class="text-input"
/>

<style>
  .text-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background-color: var(--surface);
    color: var(--text);
    font-family: var(--font-family);
    font-size: var(--font-size-base);
    line-height: var(--line-height);
    transition: border-color 200ms ease, box-shadow 200ms ease, background-color 200ms ease;
  }

  .text-input::placeholder {
    color: var(--text-muted);
  }

  .text-input:focus {
    outline: none;
    border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  .text-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--surface);
  }
</style>

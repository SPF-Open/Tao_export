<script lang="ts">
  interface Props {
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    rows?: number;
  }

  let { value = $bindable(""), placeholder = "", disabled = false, rows = 3 }: Props = $props();
</script>

<textarea
  bind:value
  placeholder={placeholder}
  disabled={disabled}
  rows={rows}
  class="textarea"
></textarea>

<style>
  .textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background-color: var(--surface);
    color: var(--text);
    font-family: var(--font-family);
    font-size: var(--font-size-base);
    line-height: var(--line-height);
    resize: vertical;
    transition: border-color 200ms ease, box-shadow 200ms ease;
  }

  .textarea::placeholder {
    color: var(--text-muted);
  }

  .textarea:focus {
    outline: none;
    border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  .textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>

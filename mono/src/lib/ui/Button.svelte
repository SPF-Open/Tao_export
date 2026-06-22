<script lang="ts">
  interface Props {
    variant?: "primary" | "secondary" | "ghost" | "success" | "danger" | "info";
    disabled?: boolean;
    onclick?: (e: MouseEvent) => void;
    onClick?: (e: MouseEvent) => void;
    type?: string;
    [key: string]: any;
  }

  let { 
    variant = "primary", 
    disabled = false, 
    onclick = undefined,
    onClick = undefined,
    type = "button",
    children,
    ...rest 
  } = $props();

  // Support both onclick and onClick
  function handleClick(e: MouseEvent) {
    (onclick || onClick)?.(e);
  }
</script>

<button 
  class="btn variant-{variant}"
  onclick={handleClick} 
  disabled={disabled}
>
  {@render children?.()}
</button>

<style>
  .btn {
    padding: 8px 16px;
    border-radius: var(--radius);
    border: none;
    font-family: var(--font-family);
    font-size: var(--font-size-base);
    font-weight: 500;
    cursor: pointer;
    transition: background-color 200ms ease, border-color 200ms ease, box-shadow 200ms ease, color 200ms ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    gap: 8px;
  }

  :global(.btn.variant-primary) {
    background-color: var(--primary);
    color: var(--primary-foreground);
    border: 1px solid var(--primary);
  }

  :global(.btn.variant-primary:hover:not(:disabled)) {
    opacity: 0.9;
    box-shadow: var(--shadow-sm);
  }

  :global(.btn.variant-secondary) {
    background-color: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
  }

  :global(.btn.variant-secondary:hover:not(:disabled)) {
    background-color: var(--border);
    box-shadow: var(--shadow-sm);
  }

  :global(.btn.variant-ghost) {
    background-color: transparent;
    color: var(--text);
    border: 1px solid transparent;
  }

  :global(.btn.variant-ghost:hover:not(:disabled)) {
    background-color: var(--surface);
    border-color: var(--border);
  }

  :global(.btn.variant-success) {
    background-color: var(--success);
    color: var(--success-foreground);
    border: 1px solid var(--success);
  }

  :global(.btn.variant-success:hover:not(:disabled)) {
    opacity: 0.9;
    box-shadow: var(--shadow-sm);
  }

  :global(.btn.variant-danger) {
    background-color: var(--danger);
    color: var(--danger-foreground);
    border: 1px solid var(--danger);
  }

  :global(.btn.variant-danger:hover:not(:disabled)) {
    opacity: 0.9;
    box-shadow: var(--shadow-sm);
  }

  :global(.btn.variant-info) {
    background-color: var(--surface);
    color: var(--primary);
    border: 1px solid var(--primary);
  }

  :global(.btn.variant-info:hover:not(:disabled)) {
    background-color: var(--primary);
    color: var(--primary-foreground);
    box-shadow: var(--shadow-sm);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.35);
  }
</style>

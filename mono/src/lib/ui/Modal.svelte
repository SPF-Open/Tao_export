<script lang="ts">
  import { X } from "lucide-svelte";

  interface Props {
    open?: boolean;
    title?: import('svelte').Snippet;
    footer?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
    size?: "sm" | "md" | "lg" | "xl";
  }

  let { open = $bindable(false), title, footer, children, size = "md" }: Props = $props();
</script>

{#if open}
  <div
    class="modal-backdrop"
    role="button"
    tabindex="0"
    aria-label="Close modal"
    onclick={() => (open = false)}
    onkeydown={(event) => {
      if (event.key === "Enter" || event.key === " ") open = false;
    }}
  >
    <div
      class="modal-panel size-{size}"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div class="modal-header">
        <div class="modal-header-content">
          {@render title?.()}
        </div>
        <button class="modal-close" onclick={() => (open = false)} aria-label="Close">
          <X size={14} />
        </button>
      </div>
      <div class="modal-body">
        {@render children?.()}
      </div>
      {#if footer}
        <div class="modal-footer">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(2px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    animation: modal-fade 150ms ease;
    cursor: default;
    text-align: left;
  }

  .modal-panel {
    background-color: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    width: 100%;
    overflow: hidden;
    animation: modal-rise 180ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  @keyframes modal-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes modal-rise {
    from { opacity: 0; transform: translateY(8px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .modal-backdrop,
    .modal-panel { animation: none; }
  }

  .size-sm  { max-width: 400px; }
  .size-md  { max-width: 640px; }
  .size-lg  { max-width: 900px; }
  .size-xl  { max-width: min(85vw, 1400px); }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    background-color: var(--surface);
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .modal-header-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-weight: 600;
    color: var(--text);
    font-size: var(--font-size-base);
    flex: 1;
  }

  .modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius);
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    transition: background-color 150ms ease, color 150ms ease;
    flex-shrink: 0;
  }

  .modal-close:hover {
    background-color: var(--surface);
    color: var(--text);
    border-color: var(--border);
  }

  .modal-body {
    padding: 16px;
    overflow-y: auto;
    flex: 1;
  }

  .modal-footer {
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    background-color: var(--surface);
    flex-shrink: 0;
  }

  /* Phones: use almost the full width and a larger close target. */
  @media (max-width: 640px) {
    .modal-backdrop { padding: 8px; }
    .modal-body { padding: 12px; }
    .modal-close { width: 40px; height: 40px; }
  }
</style>

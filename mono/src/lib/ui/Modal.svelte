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

  const uid = $props.id();
  const titleId = `${uid}-title`;
  let panel = $state<HTMLDivElement | null>(null);

  // Move focus into the dialog when it opens and give it back on close.
  $effect(() => {
    if (!open || !panel) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.focus();
    return () => previous?.focus();
  });

  const FOCUSABLE =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function onWindowKeydown(event: KeyboardEvent) {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      open = false;
      return;
    }
    if (event.key !== "Tab" || !panel) return;

    // Cycle Tab/Shift+Tab inside the dialog.
    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusables.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || active === panel)) {
      event.preventDefault();
      first.focus();
    }
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#if open}
  <div
    class="modal-backdrop"
    role="presentation"
    onclick={(event) => {
      if (event.target === event.currentTarget) open = false;
    }}
  >
    <div
      bind:this={panel}
      class="modal-panel size-{size}"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      tabindex="-1"
    >
      <div class="modal-header">
        <div class="modal-header-content" id={titleId}>
          {@render title?.()}
        </div>
        <button type="button" class="modal-close" onclick={() => (open = false)} aria-label="Close">
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

  .modal-panel:focus {
    outline: none;
  }

  .modal-panel:focus-visible {
    box-shadow: var(--shadow-xl), 0 0 0 3px rgba(var(--brand-rgb), 0.18);
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

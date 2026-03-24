<script lang="ts">
  import { onMount } from 'svelte';
  import { marked } from 'marked';

  let { onClose }: { onClose: () => void } = $props();
  let content = $state('');
  let loading = $state(true);

  onMount(async () => {
    document.body.style.overflow = 'hidden';
    try {
      const res = await fetch('/CHANGELOG.md');
      content = await res.text();
    } catch (e) {
      content = '# Error\nCould not load changelog';
    }
    loading = false;
    return () => {
      document.body.style.overflow = '';
    };
  });
</script>

<div class="modal-overlay" onclick={onClose} role="dialog" aria-modal="true">
  <div class="modal-content" onclick={(e) => e.stopPropagation()} role="document">
    <div class="modal-header">
      <h2>Changelog</h2>
      <button class="close-btn" onclick={onClose} aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="modal-body">
      {#if loading}
        <div class="loading">Loading...</div>
      {:else}
        {@html marked.parse(content)}
      {/if}
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal-content {
    background: var(--surface-elevated);
    border-radius: var(--radius-xl);
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-xl);
    animation: fadeIn 0.2s ease;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text);
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.15s;
  }

  .close-btn:hover {
    background: var(--surface);
    color: var(--text);
  }

  .modal-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }

  .loading {
    text-align: center;
    color: var(--text-muted);
    padding: 40px;
  }

  .modal-body :global(h1),
  .modal-body :global(h2),
  .modal-body :global(h3) {
    color: var(--text);
    margin-top: 0;
  }

  .modal-body :global(h2) {
    font-size: 16px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }

  .modal-body :global(h3) {
    font-size: 14px;
    color: var(--text-muted);
    margin: 16px 0 8px;
  }

  .modal-body :global(p) {
    margin: 0 0 8px;
    color: var(--text);
    line-height: 1.5;
  }

  .modal-body :global(ul) {
    margin: 0 0 12px;
    padding-left: 20px;
  }

  .modal-body :global(li) {
    color: var(--text);
    margin-bottom: 4px;
    line-height: 1.5;
  }

  .modal-body :global(strong) {
    color: var(--text);
  }
</style>

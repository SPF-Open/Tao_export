<script lang="ts">
  interface Props {
    title?: import('svelte').Snippet;
    footer?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
    status?: "success" | "danger" | "warning" | "info";
  }

  let { title, footer, children, status }: Props = $props();
</script>

<div class="card" class:status-success={status === 'success'} class:status-danger={status === 'danger'} class:status-warning={status === 'warning'} class:status-info={status === 'info'}>
  {#if title}
    <div class="card-title">
      {@render title()}
    </div>
  {/if}
  <div class="card-body">
    {@render children?.()}
  </div>
  {#if footer}
    <div class="card-footer">
      {@render footer()}
    </div>
  {/if}
</div>

<style>
  .card {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background-color: var(--surface-elevated);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .card-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text);
    background-color: var(--surface);
    flex-wrap: wrap;
  }

  .card-body {
    padding: 12px 14px;
    color: var(--text);
  }

  .card-footer {
    padding: 10px 14px;
    border-top: 1px solid var(--border);
    background-color: var(--surface);
  }

  .status-success {
    border-left: 3px solid var(--success);
  }
  .status-danger {
    border-left: 3px solid var(--danger);
  }
  .status-warning {
    border-left: 3px solid var(--warning);
  }
  .status-info {
    border-left: 3px solid var(--primary);
  }
</style>

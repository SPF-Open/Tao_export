<script lang="ts">
  import { activeItems, showItems } from "./store";
  import { FileText, Grid } from 'lucide-svelte';

  let checked = true;
  let text = "";

  $effect.pre(() => {
    if (text) {
      const qn = text.split(",").map((n) => n.trim());
      showItems.update(m => {
        const updated = new Map(m);
        for (const item of $activeItems) {
          const num = item.title.split(" ")[1];
          updated.set(item.id, qn.includes(num));
        }
        return updated;
      });
    }
  });

  const qoCount = $derived($activeItems.filter(i => i.type === 'text').length);
  const qcmCount = $derived($activeItems.filter(i => i.type === 'single-choice').length);
  const qoVisible = $derived(
    $activeItems.filter(i => i.type === 'text' && $showItems.get(i.id) !== false).length
  );
  const qcmVisible = $derived(
    $activeItems.filter(i => i.type === 'single-choice' && $showItems.get(i.id) !== false).length
  );
</script>

<div class="nb-questions">
  <span class="stat qo">
    <FileText size={14} />
    <span class="stat-value">{qoCount}</span>
    <span class="stat-label">QO</span>
    <span class="stat-count">({qoVisible})</span>
  </span>
  <span class="stat qcm">
    <Grid size={14} />
    <span class="stat-value">{qcmCount}</span>
    <span class="stat-label">QCM</span>
    <span class="stat-count">({qcmVisible})</span>
  </span>
</div>

<style>
  .nb-questions {
    display: flex;
    gap: 16px;
    padding: 10px 12px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-muted);
  }

  .stat-value {
    font-weight: 600;
    color: var(--text);
  }

  .stat-label {
    font-weight: 500;
  }

  .stat-count {
    color: var(--text-muted);
    font-size: 11px;
  }

  .stat.qo :global(svg) {
    color: var(--primary);
  }

  .stat.qcm :global(svg) {
    color: var(--success);
  }
</style>

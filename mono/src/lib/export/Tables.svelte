<script lang="ts">
  import { questions } from "./store";
  import { FileText, Grid } from 'lucide-svelte';

  let checked = true;
  let text = "";

  $effect.pre(() => {
    if (text) {
      const qn = text.split(",").map((n) => n.trim());
      questions.update((o) =>
        o.map((q) => ({
          ...q,
          show: qn.includes(q.title.split(" ")[1]),
        })),
      );
    }
  });

  let container = null;
</script>

    <div class="nb-questions">
      <span class="stat qo">
        <FileText size={14} />
        <span class="stat-value">{$questions.filter((q) => q.type === "QO").length}</span>
        <span class="stat-label">QO</span>
        <span class="stat-count">({$questions.filter((q) => q.type === "Instruction QO" && q.show).length})</span>
      </span>
      <span class="stat qcm">
        <Grid size={14} />
        <span class="stat-value">{$questions.filter((q) => q.type === "QCM").length}</span>
        <span class="stat-label">QCM</span>
        <span class="stat-count">({$questions.filter((q) => q.type === "QCM" && q.show).length})</span>
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
    color: #8b5cf6;
  }

  .stat.qcm :global(svg) {
    color: #10b981;
  }
</style>

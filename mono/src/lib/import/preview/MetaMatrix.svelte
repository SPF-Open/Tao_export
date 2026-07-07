<script lang="ts">
  import type { AssessmentItem } from "$lib/questions/types.js";
  import type { MetaModel } from "../helper/meta";

  let { items, model }: { items: AssessmentItem[]; model: MetaModel } = $props();
</script>

<div class="matrix">
  <!-- Repartition: distinct values per dimension, with question counts -->
  <div class="legend">
    {#each model.dimensions as dim (dim.key)}
      <div class="legend-col">
        <div class="legend-head">
          <span class="legend-title">{dim.label}</span>
          <span class="legend-count" title="Distinct values">{dim.categories.length}</span>
        </div>
        {#if dim.categories.length === 0}
          <p class="legend-empty">No data</p>
        {:else}
          <ul class="legend-list">
            {#each dim.categories as cat (cat.value)}
              <li class="legend-item" title={`${cat.value} — ${cat.count} question(s)`}>
                <span class="swatch" style="background:{cat.color}"></span>
                <span class="legend-value">{cat.value}</span>
                <span class="legend-num">{cat.count}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Per-question matrix of colored squares -->
  <div class="grid" role="table" aria-label="Question metadata repartition">
    <div class="grid-head" role="row">
      <span class="cell-q" role="columnheader">Question</span>
      {#each model.dimensions as dim (dim.key)}
        <span class="cell-h" role="columnheader" title={dim.label}>{dim.short}</span>
      {/each}
    </div>
    <div class="grid-body">
      {#each items as item, i (item.id + '-' + i)}
        <div class="grid-row" role="row">
          <span class="cell-q" role="cell" title={item.title}>{item.title || `#${i + 1}`}</span>
          {#each model.dimensions as dim (dim.key)}
            {@const value = model.valueOf(item, dim.key)}
            {@const color = model.colorOf(dim.key, value)}
            <span class="cell-sq" role="cell" title={`${dim.label}: ${value || "—"}`}>
              <span class="sq" class:empty={!color} style={color ? `background:${color}` : ""}></span>
            </span>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .matrix {
    display: flex;
    flex-direction: column;
    gap: 16px;
    animation: meta-rise 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  /* Repartition legend */
  .legend {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
  }

  .legend-col {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    padding: 10px;
    min-width: 0;
  }

  .legend-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }

  .legend-title {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text);
  }

  .legend-count {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-muted);
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 1px 8px;
  }

  .legend-empty {
    margin: 0;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .legend-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
    max-height: 168px;
    overflow-y: auto;
  }

  .legend-item {
    display: grid;
    grid-template-columns: 12px 1fr auto;
    align-items: center;
    gap: 7px;
    font-size: 0.78rem;
    color: var(--text);
    min-width: 0;
  }

  .swatch {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .legend-value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .legend-num {
    font-variant-numeric: tabular-nums;
    color: var(--text-muted);
    font-size: 0.72rem;
  }

  /* Per-question matrix */
  .grid {
    --cols: minmax(120px, 1.6fr) repeat(4, 30px);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .grid-head,
  .grid-row {
    display: grid;
    grid-template-columns: var(--cols);
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
  }

  .grid-head {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .grid-body {
    max-height: 340px;
    overflow-y: auto;
  }

  .grid-row {
    border-top: 1px solid var(--border);
    transition: background-color 150ms ease;
  }

  .grid-row:first-child {
    border-top: none;
  }

  .grid-row:hover {
    background: rgba(var(--brand-rgb), 0.06);
  }

  .cell-q {
    font-size: 0.78rem;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cell-h {
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    text-align: center;
  }

  .cell-sq {
    display: grid;
    place-items: center;
  }

  .sq {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
  }

  .sq.empty {
    background: transparent;
    box-shadow: none;
    border: 1px dashed var(--border-strong);
  }

  @keyframes meta-rise {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .matrix { animation: none; }
    .grid-row { transition: none; }
  }
</style>

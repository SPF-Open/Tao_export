<script lang="ts">
  import type { AssessmentItem } from "$lib/questions/types.js";
  import type { MetaModel } from "../helper/meta";

  let { item, model }: { item: AssessmentItem; model: MetaModel } = $props();
</script>

<div class="meta">
  {#each model.dimensions as dim (dim.key)}
    {@const value = model.valueOf(item, dim.key)}
    {@const color = model.colorOf(dim.key, value)}
    <div class="field">
      <span class="label">{dim.label}</span>
      <span class="value" class:muted={!value}>
        <span class="dot" class:empty={!color} style={color ? `background:${color}` : ""}></span>
        <span class="text">{value || "—"}</span>
      </span>
    </div>
  {/each}
</div>

<style>
  .meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 8px 16px;
    margin-top: 8px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    animation: meta-fade 0.22s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .label {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }

  .value {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 0.82rem;
    color: var(--text);
    min-width: 0;
  }

  .value.muted {
    color: var(--text-muted);
  }

  .dot {
    width: 11px;
    height: 11px;
    border-radius: 3px;
    flex-shrink: 0;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
  }

  .dot.empty {
    background: transparent;
    box-shadow: none;
    border: 1px dashed var(--border-strong);
  }

  .text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @keyframes meta-fade {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .meta { animation: none; }
  }
</style>

<script lang="ts">
  import { auditTemplate, auditIgnoreTitle } from './store';
  import { TemplateColumn, bindingTemplate } from '$lib/import/helper/store';

  // The audit parses Excel with the exact same templates as the Import route, so
  // a file that imports cleanly audits cleanly. "OTHER" is omitted because it has
  // no column/row defaults to parse with.
  const templates: TemplateColumn[] = [
    TemplateColumn.FIN,
    TemplateColumn.OLD_BOSA,
    TemplateColumn.OLD_FIN,
  ];

  const binding = $derived(bindingTemplate[$auditTemplate]);
  const answerCols = $derived(`${binding.row.alternative} alt / row`);
</script>

<div class="config-section">
  <div class="field">
    <span class="field-label">Excel template</span>
    <div class="preset-buttons" role="group" aria-label="Excel template">
      {#each templates as template (template)}
        <button
          type="button"
          class="preset-btn"
          class:active={$auditTemplate === template}
          onclick={() => auditTemplate.set(template)}
        >
          {template}
        </button>
      {/each}
    </div>
    <small>Same templates as the Import route — pick the one you imported with.</small>
  </div>

  <dl class="binding-summary">
    <div><dt>Start row</dt><dd>{binding.row.offset + 1}</dd></div>
    <div><dt>Alternatives</dt><dd>{answerCols}</dd></div>
    <div><dt>Title col</dt><dd>{binding.column.title || '—'}</dd></div>
    <div><dt>Prompt col</dt><dd>{binding.column.prompt || '—'}</dd></div>
    <div><dt>Correct col</dt><dd>{binding.column.correct || 'first = correct'}</dd></div>
  </dl>

  <label class="checkbox-row">
    <input type="checkbox" bind:checked={$auditIgnoreTitle} />
    <span>Ignore title mismatches</span>
  </label>
</div>

<style>
  .config-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .field-label {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .field small {
    font-size: 0.74rem;
    color: var(--text-muted);
  }

  .preset-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .preset-btn {
    padding: 6px 12px;
    border: 1px solid var(--border);
    background: var(--surface-elevated);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: var(--font-family);
    font-size: 0.85rem;
    color: var(--text);
  }

  .preset-btn:hover {
    border-color: var(--brand);
    color: var(--brand);
  }

  .preset-btn.active {
    background: var(--accent);
    color: var(--accent-foreground);
    border-color: var(--accent);
  }

  .preset-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  .binding-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 14px;
    margin: 0;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface-elevated);
  }

  .binding-summary div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 0.76rem;
  }

  .binding-summary dt {
    color: var(--text-muted);
  }

  .binding-summary dd {
    margin: 0;
    color: var(--text);
    font-weight: 600;
  }

  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.82rem;
    color: var(--text);
    cursor: pointer;
  }

  .checkbox-row input[type='checkbox'] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--accent);
  }

  @media (prefers-reduced-motion: reduce) {
    .preset-btn {
      transition: none;
    }
  }
</style>

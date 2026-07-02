<script lang="ts">
  import { auditTemplate, auditIgnoreTitle, auditCustomColumns, auditCustomRow } from './store';
  import { TemplateColumn, bindingTemplate } from '$lib/import/helper/store';
  import Numeric from '$lib/ui/Numeric.svelte';

  // The audit parses Excel with the exact same templates as the Import route, so
  // a file that imports cleanly audits cleanly. "OTHER" (labeled "Custom" here)
  // unlocks manual column/row entry for layouts that don't match a fixed preset.
  const templates: TemplateColumn[] = [
    TemplateColumn.FIN,
    TemplateColumn.OLD_BOSA,
    TemplateColumn.OLD_FIN,
    TemplateColumn.OTHER,
  ];

  const labels: Record<TemplateColumn, string> = {
    [TemplateColumn.FIN]: 'FIN',
    [TemplateColumn.OLD_BOSA]: 'OLD_BOSA',
    [TemplateColumn.OLD_FIN]: 'OLD_FIN',
    [TemplateColumn.OTHER]: 'Custom',
  };

  const isCustom = $derived($auditTemplate === TemplateColumn.OTHER);
  const binding = $derived(bindingTemplate[$auditTemplate]);
  const answerCols = $derived(`${binding.row.alternative} alt / row`);

  // Keep entries as uppercase column letters (Excel cell keys are e.g. "B7").
  function setColumn(key: keyof typeof $auditCustomColumns, raw: string) {
    const letters = raw.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
    auditCustomColumns.update((c) => ({ ...c, [key]: letters }));
  }

  function setRow(key: keyof typeof $auditCustomRow, value: number) {
    auditCustomRow.update((r) => ({ ...r, [key]: value }));
  }

  // Switching into Custom from a fixed preset seeds the manual fields with that
  // preset's binding, so users only have to adjust the column(s) that differ
  // instead of retyping the whole mapping from scratch.
  function selectTemplate(template: TemplateColumn) {
    if (template === TemplateColumn.OTHER && $auditTemplate !== TemplateColumn.OTHER) {
      const b = bindingTemplate[$auditTemplate];
      auditCustomColumns.set({
        title: b.column.title ?? '',
        prompt: b.column.prompt ?? '',
        correct: b.column.correct ?? '',
        competency: b.column.competency ?? '',
        indicator: b.column.indicator ?? '',
        competencyDescr: b.column.competencyDescr ?? '',
        masteryDescr: b.column.masteryDescr ?? '',
      });
      auditCustomRow.set({ ...b.row });
    }
    auditTemplate.set(template);
  }
</script>

{#snippet letterField(label: string, key: keyof typeof $auditCustomColumns)}
  <label class="cell">
    <span>{label}</span>
    <input
      class="letter"
      type="text"
      maxlength="2"
      placeholder="—"
      value={$auditCustomColumns[key]}
      oninput={(e) => setColumn(key, e.currentTarget.value)}
    />
  </label>
{/snippet}

<div class="config-section">
  <div class="field">
    <span class="field-label">Excel template</span>
    <div class="preset-buttons" role="group" aria-label="Excel template">
      {#each templates as template (template)}
        <button
          type="button"
          class="preset-btn"
          class:active={$auditTemplate === template}
          onclick={() => selectTemplate(template)}
        >
          {labels[template]}
        </button>
      {/each}
    </div>
    <small>
      {isCustom
        ? 'Type in the column letters and row layout of your Excel source.'
        : 'Same templates as the Import route — pick the one you imported with.'}
    </small>
  </div>

  {#if isCustom}
    <div class="custom-fields">
      <div class="required-row">
        {@render letterField('Title', 'title')}
        {@render letterField('Prompt', 'prompt')}
        {@render letterField('Answer', 'correct')}
      </div>
      <div class="meta-grid">
        {@render letterField('Competency', 'competency')}
        {@render letterField('Indicator', 'indicator')}
        {@render letterField('Comp. descr.', 'competencyDescr')}
        {@render letterField('Mastery descr.', 'masteryDescr')}
      </div>
      <div class="rows">
        <div class="row-field">
          <label for="audit-row-offset">First data row</label>
          <Numeric
            id="audit-row-offset"
            name="First data row"
            size="sm"
            min={0}
            max={99}
            bind:value={() => $auditCustomRow.offset, (v) => setRow('offset', v)}
          />
        </div>
        <div class="row-field">
          <label for="audit-row-alternative">Answers per question</label>
          <Numeric
            id="audit-row-alternative"
            name="Answers per question"
            size="sm"
            min={0}
            max={99}
            bind:value={() => $auditCustomRow.alternative, (v) => setRow('alternative', v)}
          />
        </div>
        <div class="row-field">
          <label for="audit-row-skip">Rows to skip between questions</label>
          <Numeric
            id="audit-row-skip"
            name="Rows to skip"
            size="sm"
            min={0}
            max={99}
            bind:value={() => $auditCustomRow.skipRow, (v) => setRow('skipRow', v)}
          />
        </div>
      </div>
    </div>
  {:else}
    <dl class="binding-summary">
      <div><dt>Start row</dt><dd>{binding.row.offset + 1}</dd></div>
      <div><dt>Alternatives</dt><dd>{answerCols}</dd></div>
      <div><dt>Title col</dt><dd>{binding.column.title || '—'}</dd></div>
      <div><dt>Prompt col</dt><dd>{binding.column.prompt || '—'}</dd></div>
      <div><dt>Correct col</dt><dd>{binding.column.correct || 'first = correct'}</dd></div>
    </dl>
  {/if}

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

  .custom-fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .required-row {
    display: flex;
    gap: 8px;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .cell {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .cell span {
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  .letter {
    width: 100%;
    box-sizing: border-box;
    padding: 6px 8px;
    text-align: center;
    text-transform: uppercase;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background-color: var(--surface);
    color: var(--text);
    font-family: var(--font-family);
    font-size: 0.85rem;
    transition: border-color 200ms ease, box-shadow 200ms ease;
  }

  .letter::placeholder {
    color: var(--text-muted);
    text-transform: none;
  }

  .letter:focus {
    outline: none;
    border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  .rows {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .row-field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .row-field label {
    font-size: 0.82rem;
    color: var(--text);
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

<script lang="ts">
  import { DEFAULT_CONFIG, PRESET_CONFIGS, validateConfig } from '$lib/audit/config.js';
  import type { ExcelConfig } from '$lib/audit/types.js';
  import { Numeric } from '$lib/ui';

  interface Props {
    config: ExcelConfig;
    sheetNames?: string[];
    selectedSheet?: string;
  }

  let {
    config = $bindable({ ...DEFAULT_CONFIG, columns: { ...DEFAULT_CONFIG.columns } }),
    sheetNames = $bindable([]),
    selectedSheet = $bindable(''),
  }: Props = $props();

  const presetNames = Object.keys(PRESET_CONFIGS);
  let selectedPreset = $state('Custom');

  const layoutChoices = [
    { label: 'Same column', value: 'same_column' },
    { label: 'Spread columns', value: 'spread_columns' },
  ];

  $effect(() => {
    if (selectedPreset === 'Custom') return;
    const preset = PRESET_CONFIGS[selectedPreset];
    if (preset) config = { ...preset, columns: { ...preset.columns } };
  });

  function setLetter(field: keyof typeof config.columns, raw: string) {
    const val = raw.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
    config = { ...config, columns: { ...config.columns, [field]: val } };
  }

  function setSpreadAnswer(index: number, raw: string) {
    const val = raw.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
    const current = Array.isArray(config.columns.answers) ? [...config.columns.answers] : [];
    current[index] = val;
    config = { ...config, columns: { ...config.columns, answers: current } };
  }

  function onLayoutChange(newLayout: string) {
    if (newLayout === 'same_column') {
      config = { ...config, answerLayout: 'same_column', columns: { ...config.columns, answers: '' } };
    } else {
      const count = Math.min(config.alternativeCount, 8);
      config = {
        ...config,
        answerLayout: 'spread_columns',
        columns: { ...config.columns, answers: Array(count).fill('') },
      };
    }
  }

  const spreadCount = $derived(Math.min(config.alternativeCount, 8));
  const spreadAnswers = $derived(
    Array.isArray(config.columns.answers)
      ? (config.columns.answers as string[]).slice(0, spreadCount)
      : Array(spreadCount).fill(''),
  );

  const errors = $derived(validateConfig(config));
  const singleAnswer = $derived(
    typeof config.columns.answers === 'string' ? config.columns.answers : '',
  );
</script>

<div class="excel-config">
  <!-- Preset -->
  <label class="field-row">
    <span class="field-label">Preset</span>
    <select class="select" bind:value={selectedPreset}>
      {#each presetNames as name}
        <option value={name}>{name}</option>
      {/each}
      <option value="Custom">Custom</option>
    </select>
  </label>

  <!-- Sheet selector -->
  {#if sheetNames.length > 1}
    <label class="field-row">
      <span class="field-label">Sheet</span>
      <select class="select" bind:value={selectedSheet}>
        {#each sheetNames as s}
          <option value={s}>{s}</option>
        {/each}
      </select>
    </label>
  {/if}

  <!-- Answer layout -->
  <fieldset class="layout-group">
    <legend class="layout-legend">Answer layout</legend>
    <div class="layout-options">
      {#each layoutChoices as choice}
        <label class="layout-label">
          <input
            type="radio"
            value={choice.value}
            checked={config.answerLayout === choice.value}
            onchange={() => onLayoutChange(choice.value)}
          />
          {choice.label}
        </label>
      {/each}
    </div>
  </fieldset>

  <!-- Column letters -->
  <div class="section-label">Columns</div>
  <div class="col-grid">
    <label class="cell">
      <span>Title</span>
      <input
        class="letter"
        type="text"
        maxlength="2"
        placeholder="—"
        value={config.columns.title ?? ''}
        oninput={(e) => setLetter('title', e.currentTarget.value)}
      />
    </label>
    <label class="cell">
      <span>Prompt</span>
      <input
        class="letter"
        type="text"
        maxlength="2"
        placeholder="—"
        value={config.columns.prompt}
        oninput={(e) => setLetter('prompt', e.currentTarget.value)}
      />
    </label>
  </div>

  {#if config.answerLayout === 'same_column'}
    <div class="col-grid">
      <label class="cell">
        <span>Answer</span>
        <input
          class="letter"
          type="text"
          maxlength="2"
          placeholder="—"
          value={singleAnswer}
          oninput={(e) => setLetter('answers', e.currentTarget.value)}
        />
      </label>
      <label class="cell">
        <span>Marker (X)</span>
        <input
          class="letter"
          type="text"
          maxlength="2"
          placeholder="—"
          value={config.columns.answerMarker ?? ''}
          oninput={(e) => setLetter('answerMarker', e.currentTarget.value)}
        />
      </label>
    </div>
  {:else}
    <div class="spread-grid">
      {#each Array(spreadCount) as _, i}
        <label class="cell">
          <span>Answer {i + 1}</span>
          <input
            class="letter"
            type="text"
            maxlength="2"
            placeholder="—"
            value={spreadAnswers[i] ?? ''}
            oninput={(e) => setSpreadAnswer(i, e.currentTarget.value)}
          />
        </label>
      {/each}
    </div>
  {/if}

  <div class="col-grid">
    <label class="cell">
      <span>Competency</span>
      <input
        class="letter"
        type="text"
        maxlength="2"
        placeholder="—"
        value={config.columns.competency ?? ''}
        oninput={(e) => setLetter('competency', e.currentTarget.value)}
      />
    </label>
    <label class="cell">
      <span>Dimension</span>
      <input
        class="letter"
        type="text"
        maxlength="2"
        placeholder="—"
        value={config.columns.dimension ?? ''}
        oninput={(e) => setLetter('dimension', e.currentTarget.value)}
      />
    </label>
    <label class="cell">
      <span>Indicator</span>
      <input
        class="letter"
        type="text"
        maxlength="2"
        placeholder="—"
        value={config.columns.indicator ?? ''}
        oninput={(e) => setLetter('indicator', e.currentTarget.value)}
      />
    </label>
  </div>

  <!-- Row config -->
  <div class="section-label">Rows</div>
  <div class="row-grid">
    <label class="cell">
      <span>First data row</span>
      <Numeric
        bind:value={config.rowOffset}
        min={0}
        max={999}
        size="sm"
      />
    </label>
    <label class="cell">
      <span>Answers / question</span>
      <Numeric
        bind:value={config.alternativeCount}
        min={1}
        max={26}
        size="sm"
      />
    </label>
    <label class="cell">
      <span>Rows to skip</span>
      <Numeric
        bind:value={config.skipRows}
        min={0}
        max={99}
        size="sm"
      />
    </label>
  </div>

  <!-- Validation errors -->
  {#if errors.length > 0}
    <ul class="errors" role="alert">
      {#each errors as err}
        <li>{err}</li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .excel-config {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .field-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .field-label {
    font-size: 0.82rem;
    color: var(--text-muted);
    min-width: 48px;
  }

  .select {
    flex: 1;
    padding: 5px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    font-family: var(--font-family);
    font-size: 0.84rem;
    cursor: pointer;
  }

  .select:focus {
    outline: none;
    border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  .layout-group {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 8px 10px;
    margin: 0;
  }

  .layout-legend {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    padding: 0 4px;
  }

  .layout-options {
    display: flex;
    gap: 12px;
  }

  .layout-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.84rem;
    color: var(--text);
    cursor: pointer;
  }

  .section-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .col-grid {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .spread-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    gap: 8px;
  }

  .row-grid {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 64px;
  }

  .cell span {
    font-size: 0.78rem;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .letter {
    width: 100%;
    box-sizing: border-box;
    padding: 5px 8px;
    text-align: center;
    text-transform: uppercase;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    font-family: var(--font-family);
    font-size: 0.84rem;
    transition: border-color 150ms ease, box-shadow 150ms ease;
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

  .errors {
    margin: 0;
    padding: 8px 10px 8px 24px;
    border: 1px solid color-mix(in srgb, var(--danger) 40%, var(--border));
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--danger) 6%, var(--surface-elevated));
    font-size: 0.8rem;
    color: var(--danger);
    line-height: 1.5;
  }

  @media (prefers-reduced-motion: reduce) {
    .letter { transition: none; }
    .select { transition: none; }
  }
</style>

<script lang="ts">
  import { auditConfig } from '../../store';
  import { PRESET_CONFIGS, validateConfig } from '../audit/config';
  import type { ExcelConfig } from '../audit/types';

  type Props = {
    availableSheets?: string[];
    selectedSheet?: string;
    onSheetChange?: (sheet: string) => void;
  };

  let { availableSheets = [], selectedSheet = '', onSheetChange = () => {} }: Props = $props();

  let showAdvanced = $state(false);
  let configErrors = $state<string[]>([]);

  function updateConfig(updates: Partial<ExcelConfig>) {
    const updated = { ...$auditConfig, ...updates };
    const errors = validateConfig(updated);

    if (errors.length === 0) {
      auditConfig.set(updated);
      configErrors = [];
    } else {
      configErrors = errors;
    }
  }

  function applyPreset(name: string) {
    const preset = PRESET_CONFIGS[name];
    if (preset) {
      auditConfig.set(preset);
      configErrors = [];
      showAdvanced = false;
    }
  }

  function updateColumn(
    columnType: keyof Omit<typeof $auditConfig.columns, 'answers' | 'answerMarker'>,
    value: string
  ) {
    updateConfig({
      columns: {
        ...$auditConfig.columns,
        [columnType]: value,
      },
    });
  }

  function updateAnswerColumn(index: number, value: string) {
    if ($auditConfig.answerLayout === 'spread_columns' && Array.isArray($auditConfig.columns.answers)) {
      const newAnswers = [...($auditConfig.columns.answers as string[])];
      newAnswers[index] = value;
      updateConfig({
        columns: {
          ...$auditConfig.columns,
          answers: newAnswers,
        },
      });
    }
  }

  function updateSingleAnswerColumn(value: string) {
    updateConfig({
      columns: {
        ...$auditConfig.columns,
        answers: value,
      },
    });
  }

  function updateAnswerLayout(layout: 'same_column' | 'spread_columns') {
    const newColumns = { ...$auditConfig.columns };
    
    if (layout === 'same_column') {
      // Convert from spread_columns to same_column
      if (Array.isArray(newColumns.answers)) {
        newColumns.answers = newColumns.answers[0] || 'G';
      }
      newColumns.answerMarker = 'G';
    } else {
      // Convert from same_column to spread_columns
      if (typeof newColumns.answers === 'string') {
        const baseCol = newColumns.answers;
        const baseCols = ['G', 'H', 'I', 'J'];
        newColumns.answers = baseCols;
      }
    }
    
    updateConfig({
      answerLayout: layout,
      columns: newColumns,
    });
  }

  function updateAnswerMarker(value: string) {
    updateConfig({
      columns: {
        ...$auditConfig.columns,
        answerMarker: value,
      },
    });
  }
</script>

<div class="config-section">
  <h3>Step 2: Configure Excel Structure</h3>

  <!-- Preset Templates -->
  <div class="presets">
    <div style="display: none;">
      <label for="preset-select">Select Template:</label>
      <select id="preset-select" style="display: none;"></select>
    </div>
    <div class="preset-buttons" aria-label="Select template">
      {#each Object.keys(PRESET_CONFIGS) as preset}
        <button
          class="preset-btn"
          class:active={JSON.stringify($auditConfig) === JSON.stringify(PRESET_CONFIGS[preset])}
          onclick={() => applyPreset(preset)}
        >
          {preset}
        </button>
      {/each}
    </div>
  </div>

  <!-- Sheet Selection -->
  {#if availableSheets.length > 0}
    <div class="settings-group">
      <div class="input-group">
        <label for="sheet-select">Excel Sheet:</label>
        <select
          id="sheet-select"
          value={selectedSheet}
          onchange={(e) => onSheetChange((e.target as HTMLSelectElement).value)}
        >
          {#each availableSheets as sheet}
            <option value={sheet}>{sheet}</option>
          {/each}
        </select>
        <small>Select which sheet contains the questions</small>
      </div>
    </div>
  {/if}

  <!-- Basic Settings -->
  <div class="settings-group">
    <div class="input-group">
      <label for="rowOffset">Starting Row (0-based index):</label>
      <input
        id="rowOffset"
        type="number"
        min="0"
        max="100"
        value={$auditConfig.rowOffset}
        onchange={(e) => updateConfig({ rowOffset: parseInt((e.target as HTMLInputElement).value) })}
      />
      <small>Excel row {$auditConfig.rowOffset + 1} is the first question</small>
    </div>

    <div class="input-group">
      <label for="skipRows">Skip Rows Between Questions:</label>
      <input
        id="skipRows"
        type="number"
        min="0"
        max="10"
        value={$auditConfig.skipRows}
        onchange={(e) => updateConfig({ skipRows: parseInt((e.target as HTMLInputElement).value) })}
      />
      <small>Number of blank/separator rows between questions (e.g., 1 for alternating blank rows)</small>
    </div>

    <div class="input-group">
      <label for="altCount">Number of Answer Options:</label>
      <input
        id="altCount"
        type="number"
        min="1"
        max="10"
        value={$auditConfig.alternativeCount}
        onchange={(e) => updateConfig({ alternativeCount: parseInt((e.target as HTMLInputElement).value) })}
      />
      <small>Typical value: 4</small>
    </div>

    <div class="input-group checkbox-group">
      <label for="ignoreTitleMismatch">
        <input
          id="ignoreTitleMismatch"
          type="checkbox"
          checked={$auditConfig.ignoreTitleMismatch !== false}
          onchange={(e) => updateConfig({ ignoreTitleMismatch: (e.target as HTMLInputElement).checked })}
        />
        <span>Ignore Title Mismatches</span>
      </label>
      <small>Skip comparison of question titles (recommended for old exports)</small>
    </div>
  </div>

  <!-- Advanced: Column Mapping -->
  <button class="toggle-btn" onclick={() => (showAdvanced = !showAdvanced)}>
    {showAdvanced ? '▼' : '▶'} Column Mapping (Advanced)
  </button>

  {#if showAdvanced}
    <div class="advanced-settings">
      <p class="help-text">
        Column letters should match Excel columns (A, B, C, ..., Z, AA, AB, etc.)
      </p>

      <div class="input-group">
        <label for="answerLayout">Answer Layout:</label>
        <select id="answerLayout" value={$auditConfig.answerLayout} onchange={(e) => updateAnswerLayout((e.target as HTMLSelectElement).value as 'same_column' | 'spread_columns')}>
          <option value="same_column">Same Column (Q & A stacked vertically)</option>
          <option value="spread_columns">Spread Columns (Q on one row, A across columns)</option>
        </select>
        <small>Choose how questions and answers are arranged in your Excel file</small>
      </div>

      <div class="input-group">
        <label for="titleCol">Title Column (optional):</label>
        <input
          id="titleCol"
          type="text"
          maxlength="2"
          value={$auditConfig.columns.title || ''}
          onchange={(e) => updateColumn('title', (e.target as HTMLInputElement).value)}
          placeholder="e.g., E"
        />
      </div>

      <div class="input-group">
        <label for="promptCol">Prompt/Question Column:</label>
        <input
          id="promptCol"
          type="text"
          maxlength="2"
          value={$auditConfig.columns.prompt}
          onchange={(e) => updateColumn('prompt', (e.target as HTMLInputElement).value)}
          placeholder="e.g., F"
        />
      </div>

      {#if $auditConfig.answerLayout === 'same_column'}
        <div class="input-group">
          <label for="answerCol">Answer Column:</label>
          <input
            id="answerCol"
            type="text"
            maxlength="2"
            value={typeof $auditConfig.columns.answers === 'string' ? $auditConfig.columns.answers : 'F'}
            onchange={(e) => updateSingleAnswerColumn((e.target as HTMLInputElement).value)}
            placeholder="e.g., F"
          />
          <small>Column containing question and answer text (stacked vertically)</small>
        </div>

        <div class="input-group">
          <label for="markerCol">Correct Answer Marker Column (optional):</label>
          <input
            id="markerCol"
            type="text"
            maxlength="2"
            value={$auditConfig.columns.answerMarker || 'G'}
            onchange={(e) => updateAnswerMarker((e.target as HTMLInputElement).value)}
            placeholder="e.g., G"
          />
          <small>Column with X or x to mark the correct answer (e.g., old templates). If empty, first answer is assumed correct.</small>
        </div>
      {:else}
        <div class="input-group">
          <div style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text); font-size: 0.95em;">Answer Columns:</div>
          <div class="answer-columns" role="group" aria-label="Answer column letters">
            {#each $auditConfig.columns.answers as answer, i}
              <input
                type="text"
                maxlength="2"
                value={answer}
                onchange={(e) => updateAnswerColumn(i, (e.target as HTMLInputElement).value)}
                placeholder={`Answer ${i + 1}`}
              />
            {/each}
          </div>
          <small>Each answer in a separate column</small>
        </div>
      {/if}

      <div class="input-group">
        <label for="competencyCol">Competency Column (optional):</label>
        <input
          id="competencyCol"
          type="text"
          maxlength="2"
          value={$auditConfig.columns.competency || ''}
          onchange={(e) => updateColumn('competency', (e.target as HTMLInputElement).value)}
          placeholder="e.g., A"
        />
      </div>

      <div class="input-group">
        <label for="dimensionCol">Dimension Column (optional):</label>
        <input
          id="dimensionCol"
          type="text"
          maxlength="2"
          value={$auditConfig.columns.dimension || ''}
          onchange={(e) => updateColumn('dimension', (e.target as HTMLInputElement).value)}
          placeholder="e.g., B"
        />
      </div>

      <div class="input-group">
        <label for="indicatorCol">Indicator Column (optional):</label>
        <input
          id="indicatorCol"
          type="text"
          maxlength="2"
          value={$auditConfig.columns.indicator || ''}
          onchange={(e) => updateColumn('indicator', (e.target as HTMLInputElement).value)}
          placeholder="e.g., C"
        />
      </div>
    </div>
  {/if}

  <!-- Validation Errors -->
  {#if configErrors.length > 0}
    <div class="errors">
      {#each configErrors as error}
        <div class="error-message">❌ {error}</div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .config-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
  }

  .config-section h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: var(--text);
  }

  .presets {
    margin-bottom: 20px;
  }

  .presets label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: var(--text);
  }

  .preset-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .preset-btn {
    padding: 6px 12px;
    border: 2px solid var(--border);
    background: var(--surface-elevated);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9em;
    color: var(--text);
  }

  .preset-btn:hover {
    border-color: var(--accent);
  }

  .preset-btn.active {
    background: var(--accent);
    color: var(--accent-foreground);
    border-color: var(--accent);
  }

  .settings-group {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .input-group label {
    font-weight: 500;
    color: var(--text);
    font-size: 0.95em;
  }

  .input-group input {
    padding: 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 1em;
    background: var(--surface-elevated);
    color: var(--text);
  }

  .input-group input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  }

  .input-group select {
    padding: 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 1em;
    background: var(--surface-elevated);
    color: var(--text);
    cursor: pointer;
  }

  .input-group select:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  }

  .input-group small {
    font-size: 0.8em;
    color: var(--text-muted);
  }

  .checkbox-group {
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 0;
    font-weight: 500;
    cursor: pointer;
    color: var(--text);
  }

  .checkbox-group input[type='checkbox'] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    margin: 0;
    padding: 0;
    accent-color: var(--accent);
  }

  .checkbox-group span {
    color: var(--text);
    font-size: 0.95em;
  }

  .checkbox-group small {
    flex: 1;
    margin-left: 26px;
    color: var(--text-muted);
  }

  .toggle-btn {
    background: none;
    border: none;
    color: var(--accent);
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    font-size: 1em;
    margin: 15px 0;
  }

  .toggle-btn:hover {
    text-decoration: underline;
  }

  .advanced-settings {
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 15px;
    margin-top: 10px;
  }

  .help-text {
    font-size: 0.9em;
    color: var(--text-muted);
    margin-top: 0;
    margin-bottom: 15px;
    font-style: italic;
  }

  .answer-columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 8px;
  }

  .answer-columns input {
    padding: 6px;
    font-size: 0.9em;
  }

  .errors {
    margin-top: 15px;
    padding: 10px;
    background: rgba(220, 38, 38, 0.1);
    border: 1px solid var(--danger);
    border-radius: var(--radius);
  }

  .error-message {
    color: var(--danger);
    font-size: 0.9em;
    margin: 5px 0;
  }

  :global(.dark) .config-section {
    background: var(--surface);
    border-color: var(--border);
  }

  :global(.dark) .config-section h3 {
    color: var(--text);
  }

  :global(.dark) .presets label,
  :global(.dark) .input-group label {
    color: var(--text);
  }

  :global(.dark) .preset-btn {
    background: var(--surface-elevated);
    border-color: var(--border);
    color: var(--text);
  }

  :global(.dark) .preset-btn:hover {
    border-color: var(--accent);
  }

  :global(.dark) .preset-btn.active {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-foreground);
  }

  :global(.dark) .input-group input {
    background: var(--surface-elevated);
    border-color: var(--border);
    color: var(--text);
  }

  :global(.dark) .input-group select {
    background: var(--surface-elevated);
    border-color: var(--border);
    color: var(--text);
  }

  :global(.dark) .toggle-btn {
    color: var(--accent);
  }

  :global(.dark) .advanced-settings {
    background: var(--surface-elevated);
    border-color: var(--border);
  }

  :global(.dark) .checkbox-group label {
    color: var(--text);
  }

  :global(.dark) .checkbox-group span {
    color: var(--text);
  }

  :global(.dark) .checkbox-group input[type='checkbox'] {
    accent-color: var(--accent);
  }

  :global(.dark) .help-text {
    color: var(--text-muted);
  }
</style>

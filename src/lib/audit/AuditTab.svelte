<script lang="ts">
  import { onMount } from 'svelte';
  import type { QTIQuestion } from '../audit/types';
  import { runAudit } from '../audit/index';
  import { getExcelSheets } from '../audit/excel-parser';
  import AuditConfig from './AuditConfig.svelte';
  import AuditResults from './AuditResults.svelte';
  import { 
    questions, 
    auditReport, 
    auditLoading, 
    auditError, 
    auditConfig,
    auditFilename,
    resetAudit 
  } from '../../store';

  let excelFile: File | null = null;
  let fileInputElement: HTMLInputElement;
  let availableSheets: string[] = [];
  let selectedSheet: string = '';
  let matchingThreshold: number = 0.95;

  // Convert loaded QTI questions to audit format
  // Filter out instructions since they are not actual questions
  function stripHtmlTags(htmlText: string): string {
    // Remove all HTML/XML tags and normalize whitespace
    return htmlText
      .replace(/<[^>]*>/g, '') // Remove all tags
      .replace(/\s+/g, ' ')    // Collapse multiple spaces
      .trim();
  }

  function convertQTIQuestions(qtiQuestions: any[]): QTIQuestion[] {
    return qtiQuestions
      .filter(q => {
        // Exclude instruction types
        if (q.type === 'Instruction' || q.type === 'Instruction QCM') return false;
        return true;
      })
      .map((q) => {
        // Extract prompt text from various formats
        let promptText = '';
        
        if (q.prompt) {
          if (typeof q.prompt === 'string') {
            promptText = stripHtmlTags(q.prompt);
          } else if (Array.isArray(q.prompt)) {
            // Handle array of DOM elements or strings
            promptText = q.prompt
              .map((el: any) => {
                if (el && typeof el === 'object' && 'textContent' in el) {
                  // Use textContent to get plain text from DOM elements
                  return (el as Element).textContent || '';
                } else if (el && typeof el === 'object' && 'outerHTML' in el) {
                  // Fallback to outerHTML and strip tags
                  return stripHtmlTags((el as Element).outerHTML);
                }
                return String(el || '');
              })
              .join(' ')
              .trim();
          }
        }
        
        // Fallback to other fields
        if (!promptText) {
          promptText = stripHtmlTags(q.text || q.content || '');
        }

        return {
          id: q.id || q.title || '',
          title: q.title,
          prompt: promptText,
          answers: (q.answers || []).map((a: any) => ({
            text: stripHtmlTags(a.text || a.txt || a.content || ''),
            correct: a.correct === true || a.correct === 'true',
            id: a.id,
          })),
          type: q.type,
          points: q.points,
          metadata: {
            qtiId: q.id,
            originalType: q.type,
          },
        };
      })
      .filter(q => q.prompt && q.prompt.length > 0); // Final filter: only questions with actual content
  }

  async function handleRunAudit() {
    if (!excelFile) {
      auditError.set('Please select an Excel file');
      return;
    }

    if (!selectedSheet) {
      auditError.set('Please select a sheet');
      return;
    }

    auditLoading.set(true);
    auditError.set(null);
    auditReport.set(null);

    try {
      const buffer = await excelFile.arrayBuffer();
      const qtiQs = convertQTIQuestions($questions);

      console.log(`[Audit] Loaded QTI questions: ${qtiQs.length} (filtered from ${$questions.length})`);
      if (qtiQs.length === 0) {
        auditError.set('No valid questions found after filtering instructions. Check the TAO export.');
        return;
      }

      const result = await runAudit(buffer, qtiQs, $auditConfig, {
        threshold: matchingThreshold,
        sheetName: selectedSheet,
      });

      if (result.success && result.report) {
        auditReport.set(result.report);
      } else {
        auditError.set(result.error || 'Unknown error during audit');
      }
    } catch (error) {
      auditError.set(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      auditLoading.set(false);
    }
  }

  function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files;

    if (files && files.length > 0) {
      excelFile = files[0];
      auditFilename.set(excelFile.name);
      auditError.set(null);

      // Load available sheets
      excelFile.arrayBuffer().then((buffer) => {
        availableSheets = getExcelSheets(buffer);
        selectedSheet = availableSheets[0] || '';
      });
    }
  }

  function handleReset() {
    resetAudit();
    excelFile = null;
    auditFilename.set('');
    availableSheets = [];
    selectedSheet = '';
    if (fileInputElement) {
      fileInputElement.value = '';
    }
  }

  function triggerFileInput() {
    fileInputElement?.click();
  }

  onMount(() => {
    return () => {
      resetAudit();
    };
  });

  const hasQuestions = $questions && $questions.length > 0;
</script>

<div class="audit-container">
  <h2>📋 Audit TAO</h2>

  {#if !hasQuestions}
    <div class="alert alert-warning">
      ⚠️ Load a TAO ZIP file first to proceed with audit
    </div>
  {:else}
    <div class="audit-content">
      {#if !$auditReport}
        <!-- Upload & Config Section -->
        <div class="audit-section">
          <h3>Step 1: Upload Excel File</h3>

          <div class="file-input-wrapper">
            <input
              type="file"
              hidden
              bind:this={fileInputElement}
              on:change={handleFileSelect}
              accept=".xlsx,.xls"
              disabled={$auditLoading}
            />

            <button
              on:click={triggerFileInput}
              class="btn btn-primary"
              disabled={$auditLoading}
            >
              📁 Choose Excel File
            </button>

            {#if $auditFilename}
              <span class="filename">{$auditFilename}</span>
            {/if}
          </div>

          {#if $auditError}
            <div class="alert alert-error">
              {$auditError}
            </div>
          {/if}

          {#if availableSheets.length > 0}
            <div class="sheet-selector">
              <label for="sheet-select">📄 Select Sheet:</label>
              <select
                id="sheet-select"
                bind:value={selectedSheet}
                disabled={$auditLoading}
              >
                {#each availableSheets as sheet}
                  <option value={sheet}>{sheet}</option>
                {/each}
              </select>
            </div>
          {/if}
        </div>

        <!-- Config Section -->
        <AuditConfig />

        <!-- Summary Section -->
        <div class="audit-section">
          <h3>Questions Summary</h3>
          <div class="info-box">
            <div class="info-item">
              <span class="label">Excel Rows to Process:</span>
              <span class="value">Row {$auditConfig.rowOffset + 1} onwards</span>
            </div>
            <div class="info-item">
              <span class="label">Loaded QTI Questions:</span>
              <span class="value">{$questions.length}</span>
            </div>
            <div class="info-item">
              <span class="label">⚙️ Matching Threshold (min 50%):</span>
              <div class="threshold-control">
                <input
                  type="range"
                  min="0.50"
                  max="1.00"
                  step="0.05"
                  bind:value={matchingThreshold}
                  disabled={$auditLoading}
                  aria-label="Matching threshold slider"
                />
                <span class="threshold-value">{(matchingThreshold * 100).toFixed(0)}%</span>
              </div>
              <small style="margin-top: 6px; display: block;">Lower = more matches but less accurate. Higher = fewer but more confident matches.</small>
            </div>
          </div>
        </div>

        <!-- Run Audit Button -->
        <div class="audit-section">
          {#if excelFile && !$auditLoading}
            <button
              on:click={handleRunAudit}
              class="btn btn-success btn-large"
            >
              ▶️ Run Audit
            </button>
          {:else if $auditLoading}
            <button class="btn btn-loading" disabled>
              ⏳ Processing...
            </button>
          {:else}
            <button class="btn btn-primary" disabled>
              Select Excel file to begin
            </button>
          {/if}
        </div>
      {:else}
        <!-- Results Section -->
        <AuditResults report={$auditReport} />

        <!-- Reset Button -->
        <div class="audit-section">
          <button on:click={handleReset} class="btn btn-secondary">
            ↻ New Audit
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .audit-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .audit-container h2 {
    margin-top: 0;
    margin-bottom: 20px;
    color: var(--text);
    border-bottom: 3px solid var(--accent);
    padding-bottom: 10px;
  }

  .audit-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .audit-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
  }

  .audit-section h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: var(--text);
  }

  .file-input-wrapper {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .filename {
    padding: 8px 12px;
    background: var(--surface-elevated);
    color: var(--success);
    border-radius: var(--radius);
    font-size: 0.9em;
  }

  .sheet-selector {
    margin-top: 15px;
    padding: 12px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .sheet-selector label {
    font-weight: 500;
    color: var(--text);
  }

  .sheet-selector select {
    flex: 1;
    min-width: 150px;
    padding: 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 1em;
    background: var(--surface-elevated);
    color: var(--text);
  }

  .sheet-selector select:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  }

  .info-box {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .info-item .label {
    font-size: 0.85em;
    color: var(--text-muted);
    font-weight: 500;
  }

  .info-item .value {
    font-size: 1.1em;
    color: var(--text);
    font-weight: 600;
  }

  .alert {
    padding: 12px 16px;
    border-radius: var(--radius);
    margin: 10px 0;
  }

  .alert-warning {
    background: rgba(202, 138, 4, 0.1);
    border: 1px solid var(--warning);
    color: var(--warning);
  }

  .alert-error {
    background: rgba(220, 38, 38, 0.1);
    border: 1px solid var(--danger);
    color: var(--danger);
  }

  .btn {
    padding: 10px 16px;
    border: none;
    border-radius: var(--radius);
    font-size: 1em;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
    background: var(--surface-elevated);
    color: var(--text);
    border: 1px solid var(--border);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--accent);
    color: var(--accent-foreground);
    border: none;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--text-muted);
  }

  .btn-success {
    background: var(--success);
    color: var(--success-foreground);
    border: none;
  }

  .btn-success:hover:not(:disabled) {
    filter: brightness(0.9);
  }

  .btn-secondary {
    background: var(--text-muted);
    color: var(--bg);
    border: none;
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--text);
  }

  .btn-large {
    padding: 12px 24px;
    font-size: 1.05em;
  }

  .btn-loading {
    background: var(--warning);
    color: var(--warning-foreground);
    border: none;
  }

  :global(.dark) .audit-section {
    background: var(--surface);
    border-color: var(--border);
    color: var(--text);
  }

  :global(.dark) .filename {
    background: var(--surface-elevated);
    color: var(--success);
  }

  :global(.dark) .sheet-selector {
    background: var(--surface-elevated);
    border-color: var(--border);
  }

  :global(.dark) .sheet-selector label {
    color: var(--text);
  }

  :global(.dark) .sheet-selector select {
    background: var(--surface-elevated);
    border-color: var(--border);
    color: var(--text);
  }

  :global(.dark) .sheet-selector select:focus {
    border-color: var(--accent);
  }

  :global(.dark) .audit-container h2 {
    color: var(--text);
    border-bottom-color: var(--accent);
  }

  :global(.dark) .audit-section h3 {
    color: var(--text);
  }

  :global(.dark) .info-item .label {
    color: var(--text-muted);
  }

  :global(.dark) .info-item .value {
    color: var(--text);
  }

  .threshold-control {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
  }

  .threshold-control input[type='range'] {
    flex: 1;
    min-width: 100px;
    height: 6px;
    border-radius: 3px;
    background: var(--border);
    outline: none;
    appearance: none;
    -webkit-appearance: none;
  }

  .threshold-control input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    transition: background 0.2s;
  }

  .threshold-control input[type='range']::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    border: none;
  }

  .threshold-control input[type='range']::-moz-range-track {
    background: var(--border);
    border: none;
  }

  .threshold-value {
    font-weight: 600;
    color: var(--text);
    min-width: 50px;
    text-align: right;
  }

  :global(.dark) .threshold-control input[type='range'] {
    background: var(--border);
  }

  :global(.dark) .threshold-value {
    color: var(--text);
  }
</style>

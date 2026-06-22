<script lang="ts">
  import { onMount } from "svelte";
  import { ChevronDown, Upload, Settings, PlayCircle, CheckCircle, AlertCircle } from "lucide-svelte";
  import type { QTIQuestion } from "../audit/types";
  import { runAudit } from "../audit/index";
  import { getExcelSheets } from "../audit/excel-parser";
  import AuditConfig from "./AuditConfig.svelte";
  import AuditResults from "./AuditResults.svelte";
  import {
    questions,
    auditReport,
    auditLoading,
    auditError,
    auditConfig,
    auditFilename,
    resetAudit,
  } from "../store";

  let excelFile = $state<File | null>(null);
  let fileInputElement: HTMLInputElement;
  let availableSheets = $state<string[]>([]);
  let selectedSheet = $state("");
  let matchingThreshold = $state(0.95);

  // UI state for progressive disclosure
  let showConfigSection = $state(false);
  let showSummarySection = $state(false);

  // Ensure selectedSheet is set when availableSheets changes
  $effect(() => {
    if (availableSheets.length > 0 && !selectedSheet) {
      selectedSheet = availableSheets[0];
    }
  });

  // Convert loaded QTI questions to audit format
  function stripHtmlTags(htmlText: string): string {
    return htmlText
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function convertQTIQuestions(qtiQuestions: any[]): QTIQuestion[] {
    return qtiQuestions
      .filter((q) => {
        if (q.type === "Instruction" || q.type === "Instruction QCM")
          return false;
        return true;
      })
      .map((q) => {
        let promptText = "";

        if (q.prompt) {
          if (typeof q.prompt === "string") {
            promptText = stripHtmlTags(q.prompt);
          } else if (Array.isArray(q.prompt)) {
            promptText = q.prompt
              .map((el: any) => {
                if (el && typeof el === "object" && "textContent" in el) {
                  return (el as Element).textContent || "";
                } else if (el && typeof el === "object" && "outerHTML" in el) {
                  return stripHtmlTags((el as Element).outerHTML);
                }
                return String(el || "");
              })
              .join(" ")
              .trim();
          }
        }

        if (!promptText) {
          promptText = stripHtmlTags(q.text || q.content || "");
        }

        return {
          id: q.id || q.title || "",
          title: q.title,
          prompt: promptText,
          answers: (q.answers || []).map((a: any) => ({
            text: stripHtmlTags(a.text || a.txt || a.content || ""),
            correct: a.correct === true || a.correct === "true",
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
      .filter((q) => q.prompt && q.prompt.length > 0);
  }

  async function handleRunAudit() {
    if (!excelFile) {
      auditError.set("Please select an Excel file");
      return;
    }

    if (!selectedSheet) {
      auditError.set("Please select a sheet");
      return;
    }

    auditLoading.set(true);
    auditError.set(null);
    auditReport.set(null);

    try {
      const buffer = await excelFile.arrayBuffer();
      const qtiQs = convertQTIQuestions($questions);

      if (qtiQs.length === 0) {
        auditError.set(
          "No valid questions found after filtering instructions.",
        );
        return;
      }

      const result = await runAudit(buffer, qtiQs, $auditConfig, {
        threshold: matchingThreshold,
        sheetName: selectedSheet,
      });

      if (result.success && result.report) {
        auditReport.set(result.report);
      } else {
        auditError.set(result.error || "Unknown error during audit");
      }
    } catch (error) {
      auditError.set(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
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
      showConfigSection = true;

      excelFile.arrayBuffer().then((buffer) => {
        availableSheets = getExcelSheets(buffer);
        selectedSheet = availableSheets[0] || "";
      });
    }
  }

  function handleReset() {
    resetAudit();
    excelFile = null;
    auditFilename.set("");
    availableSheets = [];
    selectedSheet = "";
    showConfigSection = false;
    showSummarySection = false;
    if (fileInputElement) {
      fileInputElement.value = "";
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
  <div class="audit-header">
    <h2>📋 Audit & Compare</h2>
    <p class="audit-subtitle">Validate and compare exam questions against Excel files</p>
  </div>

  {#if !hasQuestions}
    <div class="alert alert-warning">
      <AlertCircle size={18} />
      <div>
        <strong>Load a TAO ZIP file first</strong>
        <p>You need to load exam questions before running an audit.</p>
      </div>
    </div>
  {:else}
    <div class="audit-content">
      {#if !$auditReport}
        <!-- Phase 1: Upload Excel File -->
        <div class="phase-section">
          <div class="phase-header">
            <div class="phase-icon" style={$auditFilename ? 'background: var(--color-success);' : ''}>
              <Upload size={20} />
            </div>
            <div class="phase-title">
              <h3>Step 1: Upload Excel File</h3>
              {#if $auditFilename}
                <p class="phase-status">✓ Loaded: {$auditFilename}</p>
              {:else}
                <p class="phase-status">Select an Excel file to begin</p>
              {/if}
            </div>
          </div>

          <div class="phase-content">
            <input
              type="file"
              hidden
              bind:this={fileInputElement}
              onchange={handleFileSelect}
              accept=".xlsx,.xls"
              disabled={$auditLoading}
              aria-label="Select Excel file"
            />

            <button
              onclick={triggerFileInput}
              disabled={$auditLoading}
              class="btn btn-primary"
            >
              📁 Choose Excel File
            </button>

            {#if $auditError}
              <div class="alert alert-error">
                {$auditError}
              </div>
            {/if}
          </div>
        </div>

        <!-- Phase 2: Configure Settings (collapsible) -->
        {#if $auditFilename}
          <div class="phase-section">
            <button
              class="phase-header phase-header-collapsible"
              onclick={() => showConfigSection = !showConfigSection}
            >
              <div class="phase-icon">
                <Settings size={20} />
              </div>
              <div class="phase-title">
                <h3>Step 2: Configure Matching</h3>
                <p class="phase-status">Set column mappings and matching threshold</p>
              </div>
                <div class="chevron-toggle" class:rotated={showConfigSection}>
                  <ChevronDown size={20} />
                </div>
            </button>

            {#if showConfigSection}
              <div class="phase-content">
                <AuditConfig
                  {availableSheets}
                  {selectedSheet}
                  onSheetChange={(sheet) => {
                    selectedSheet = sheet;
                  }}
                />

                <div class="threshold-control-group">
                  <label for="threshold">Matching Threshold (min 50%):</label>
                  <div class="threshold-control">
                    <input
                      id="threshold"
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
                  <small>Lower = more matches but less accurate. Higher = fewer but more confident matches.</small>
                </div>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Phase 3: Review Summary (collapsible) -->
        {#if $auditFilename}
          <div class="phase-section">
            <button
              class="phase-header phase-header-collapsible"
              onclick={() => showSummarySection = !showSummarySection}
            >
              <div class="phase-icon">
                <CheckCircle size={20} />
              </div>
              <div class="phase-title">
                <h3>Step 3: Review Summary</h3>
                <p class="phase-status">Verify settings before running audit</p>
              </div>
                <div class="chevron-toggle" class:rotated={showSummarySection}>
                  <ChevronDown size={20} />
                </div>
            </button>

            {#if showSummarySection}
              <div class="phase-content">
                <div class="summary-grid">
                  <div class="summary-item">
                    <span class="summary-label">QTI Questions:</span>
                    <span class="summary-value">{$questions.length}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Excel Start Row:</span>
                    <span class="summary-value">Row {$auditConfig.rowOffset + 1}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Title Column:</span>
                    <span class="summary-value">{$auditConfig.columns.title}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Matching Threshold:</span>
                    <span class="summary-value">{(matchingThreshold * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Phase 4: Run Audit Button -->
        {#if $auditFilename}
          <div class="phase-section">
            <div class="phase-actions">
              {#if $auditLoading}
                <button disabled class="btn btn-loading">
                  ⏳ Processing audit...
                </button>
              {:else}
                <button onclick={handleRunAudit} class="btn btn-success btn-large">
                  <PlayCircle size={18} />
                  Run Audit
                </button>
              {/if}
            </div>
          </div>
        {/if}
      {:else}
        <!-- Results Section -->
        <div class="phase-section">
          <div class="phase-header">
            <div class="phase-icon phase-icon-success">
              <CheckCircle size={20} />
            </div>
            <div class="phase-title">
              <h3>Audit Complete</h3>
              <p class="phase-status">Results and details below</p>
            </div>
          </div>
        </div>

        <AuditResults report={$auditReport} />

        <div class="phase-section">
          <button onclick={handleReset} class="btn btn-secondary btn-block">
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

  .audit-header {
    margin-bottom: 24px;
  }

  .audit-header h2 {
    margin: 0 0 8px 0;
    color: var(--text);
    font-size: 28px;
  }

  .audit-subtitle {
    margin: 0;
    color: var(--text-muted);
    font-size: 14px;
  }

  .audit-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .phase-section {
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .phase-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background 0.2s;
    width: 100%;
    text-align: left;
  }

  .phase-header:hover {
    background: var(--surface);
  }

  .phase-header-collapsible {
    justify-content: space-between;
  }

  .phase-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: var(--surface);
    border-radius: var(--radius-lg);
    color: var(--text-muted);
    transition: all 0.2s;
  }

  .phase-icon-success {
    background: var(--accent);
    color: white;
  }

  .phase-title {
    flex: 1;
    min-width: 0;
  }

  .phase-title h3 {
    margin: 0 0 4px 0;
    color: var(--text);
    font-size: 16px;
    font-weight: 600;
  }

  .phase-status {
    margin: 0;
    color: var(--text-muted);
    font-size: 13px;
  }

  .phase-header :global(svg) {
    transition: transform 0.2s;
  }

  .phase-header :global(svg.rotated) {
    transform: rotate(180deg);
  }

  .chevron-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
  }

  .chevron-toggle.rotated {
    transform: rotate(180deg);
  }

  .phase-content {
    padding: 16px;
    border-top: 1px solid var(--border);
    background: var(--surface);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .phase-actions {
    display: flex;
    gap: 12px;
    padding: 16px;
  }

  .alert {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    border-radius: var(--radius-lg);
    font-size: 14px;
    margin-bottom: 16px;
  }

  .alert.alert-warning {
    background: rgba(202, 138, 4, 0.1);
    border: 1px solid var(--warning);
    color: var(--warning);
  }

  .alert.alert-error {
    background: rgba(220, 38, 38, 0.1);
    border: 1px solid var(--danger);
    color: var(--danger);
  }

  .sheet-selector {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .sheet-selector label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
  }

  .sheet-selector select {
    flex: 1;
    min-width: 150px;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 14px;
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
  }

  .sheet-selector select:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent);
    opacity: 0.5;
  }

  .threshold-control-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .threshold-control-group label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
  }

  .threshold-control-group small {
    color: var(--text-muted);
    font-size: 12px;
  }

  .threshold-control {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .threshold-control input[type="range"] {
    flex: 1;
    height: 6px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--border);
    border-radius: 3px;
    outline: none;
  }

  .threshold-control input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    background: var(--accent);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
  }

  .threshold-control input[type="range"]::-webkit-slider-thumb:hover {
    box-shadow: 0 0 0 4px var(--accent);
    opacity: 0.8;
  }

  .threshold-control input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: var(--accent);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .threshold-control input[type="range"]::-moz-range-thumb:hover {
    box-shadow: 0 0 0 4px var(--accent);
    opacity: 0.8;
  }

  .threshold-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    min-width: 50px;
    text-align: right;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }

  .summary-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .summary-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--text);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    border: none;
    border-radius: var(--radius);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
  }

  .btn-primary {
    background: var(--accent);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    opacity: 0.9;
  }

  .btn-success {
    background: var(--accent);
    color: white;
  }

  .btn-success:hover:not(:disabled) {
    opacity: 0.9;
  }

  .btn-secondary {
    background: var(--surface-elevated);
    color: var(--text);
    border: 1px solid var(--border);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--surface);
  }

  .btn-loading {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-large {
    padding: 12px 20px;
    font-size: 16px;
  }

  .btn-block {
    width: 100%;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 900px) {
    .audit-container {
      padding: 16px;
    }

    .phase-header {
      padding: 12px;
      gap: 12px;
    }

    .phase-icon {
      width: 40px;
      height: 40px;
    }

    .phase-title h3 {
      font-size: 15px;
    }

    .summary-grid {
      grid-template-columns: 1fr;
    }

    .phase-actions {
      flex-direction: column;
    }
  }
</style>

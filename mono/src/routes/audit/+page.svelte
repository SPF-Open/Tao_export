<script lang="ts">
  import { get } from "svelte/store";
  import { ScanSearch, FileArchive, FileSpreadsheet, Play, RotateCcw, X, TriangleAlert } from "lucide-svelte";
  import { PageHeader, EmptyState, SidebarLayout, FileInput, Combobox, Button } from "$lib/ui";
  import { pushError } from "$lib/ui/notifications";
  import { QtiAdapter } from "$lib/questions/adapters/qti.js";
  import { runAudit } from "$lib/audit/index";
  import { getExcelSheets } from "$lib/audit/excel-parser";
  import { assessmentItemsToQuestions } from "$lib/audit/fromAssessment";
  import { bindingFromTemplate } from "$lib/audit/fromExcel";
  import AuditConfig from "$lib/audit/AuditConfig.svelte";
  import AuditResults from "$lib/audit/AuditResults.svelte";
  import {
    auditItems,
    auditZipName,
    auditTemplate,
    auditIgnoreTitle,
    auditFilename,
    auditReport,
    auditLoading,
    auditError,
    resetAuditAll,
  } from "$lib/audit/store";

  let excelFile = $state<File | null>(null);
  let sheets = $state<string[]>([]);
  let selectedSheet = $state("");

  const ready = $derived($auditItems.length > 0 && excelFile !== null && selectedSheet !== "");

  async function handleZip(files: File[]) {
    const file = files[0];
    if (!file) return;
    try {
      const assessment = await new QtiAdapter().read(file);
      auditItems.set(assessment.sections.flatMap((s) => s.items));
      auditZipName.set(file.name);
      auditError.set(null);
      if (get(auditItems).length === 0) {
        pushError("No questions", "The ZIP was read, but no questions were found inside it.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      auditItems.set([]);
      auditZipName.set("");
      pushError("ZIP load error", msg);
    }
  }

  async function handleExcel(files: File[]) {
    const file = files[0];
    if (!file) return;
    excelFile = file;
    auditFilename.set(file.name);
    auditError.set(null);
    try {
      sheets = getExcelSheets(await file.arrayBuffer());
      selectedSheet = sheets[0] ?? "";
    } catch (e) {
      pushError("Excel error", e instanceof Error ? e.message : String(e));
      sheets = [];
      selectedSheet = "";
    }
  }

  async function run() {
    if (!excelFile || !selectedSheet) return;
    auditLoading.set(true);
    auditError.set(null);
    auditReport.set(null);
    try {
      const questions = assessmentItemsToQuestions(get(auditItems));
      if (questions.length === 0) {
        auditError.set("No valid questions found after filtering instructions.");
        return;
      }
      const buffer = await excelFile.arrayBuffer();
      const result = await runAudit(buffer, questions, bindingFromTemplate(get(auditTemplate)), {
        sheetName: selectedSheet,
        ignoreTitleMismatch: get(auditIgnoreTitle),
      });
      if (result.success && result.report) auditReport.set(result.report);
      else auditError.set(result.error ?? "Unknown error during audit.");
    } catch (e) {
      auditError.set(e instanceof Error ? e.message : String(e));
    } finally {
      auditLoading.set(false);
    }
  }

  function reset() {
    resetAuditAll();
    excelFile = null;
    sheets = [];
    selectedSheet = "";
  }

  function clearZip() {
    auditItems.set([]);
    auditZipName.set("");
    auditReport.set(null);
  }

  const sheetChoices = $derived(sheets.map((s) => ({ label: s, value: s })));
</script>

<svelte:head>
  <title>Audit — TAO</title>
  <meta name="description" content="Audit a TAO QTI export against an Excel source: match questions, compare prompts and answers, and flag critical, major and minor differences." />
  <meta property="og:title" content="Audit — TAO" />
  <meta property="og:description" content="Compare a TAO QTI export against an Excel source and flag differences by severity." />
  <meta name="twitter:title" content="Audit — TAO" />
</svelte:head>

<SidebarLayout sidebarLabel="Audit inputs">
  {#snippet sidebar()}
    <div class="brand"><ScanSearch size={16} strokeWidth={1.9} /> <span>Audit</span></div>

    <div class="field">
      <span class="field-label"><FileArchive size={13} strokeWidth={1.9} /> TAO export (.zip)</span>
      {#if $auditZipName}
        <div class="badge">
          <span class="badge-name" title={$auditZipName}>{$auditZipName}</span>
          <span class="badge-count">{$auditItems.length}</span>
          <button class="badge-clear" onclick={clearZip} aria-label="Remove ZIP"><X size={13} /></button>
        </div>
      {:else}
        <FileInput accept=".zip" invalidTitle="Unsupported file" onfiles={handleZip} />
      {/if}
    </div>

    <div class="field">
      <span class="field-label"><FileSpreadsheet size={13} strokeWidth={1.9} /> Excel source</span>
      {#if $auditFilename}
        <div class="badge">
          <span class="badge-name" title={$auditFilename}>{$auditFilename}</span>
        </div>
      {/if}
      <FileInput accept=".xlsx,.xls" invalidTitle="Unsupported file" onfiles={handleExcel} />
      {#if sheetChoices.length > 0}
        <Combobox legend="Sheet" bind:value={selectedSheet} choices={sheetChoices} />
      {/if}
    </div>

    {#if $auditFilename}
      <AuditConfig />
    {/if}

    <div class="actions">
      <Button variant="primary" disabled={!ready || $auditLoading} onclick={run}>
        <Play size={16} strokeWidth={2} /> {$auditLoading ? "Running…" : "Run audit"}
      </Button>
      {#if $auditZipName || $auditFilename || $auditReport}
        <button class="ghost" onclick={reset}><RotateCcw size={15} strokeWidth={1.75} /> Reset</button>
      {/if}
    </div>
  {/snippet}

  <PageHeader
    icon={ScanSearch}
    eyebrow="Compliance review"
    title="Audit"
    subtitle="Compare a TAO QTI export against an Excel source and flag differences by severity."
  />

  {#if $auditError}
    <div class="error-card"><TriangleAlert size={16} strokeWidth={1.9} /> <span>{$auditError}</span></div>
  {/if}

  {#if $auditReport}
    <AuditResults report={$auditReport} />
  {:else if $auditLoading}
    <div class="loading"><span class="spinner" aria-hidden="true"></span> Running audit…</div>
  {:else}
    <EmptyState
      icon={ScanSearch}
      title="Audit a TAO export"
      description="Upload a TAO .zip export and an Excel source on the left, then run the audit to compare them and surface critical, major and minor differences."
    />
  {/if}
</SidebarLayout>

<style>
  .brand { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: var(--text); letter-spacing: -0.01em; padding: 2px; }

  .field { display: flex; flex-direction: column; gap: 0.4rem; }
  .field-label { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); }

  .badge {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.45rem 0.6rem; border: 1px solid var(--border);
    border-radius: var(--radius); background: var(--surface-elevated);
  }
  .badge-name { flex: 1; min-width: 0; font-size: 0.8rem; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .badge-count { font-size: 0.72rem; font-weight: 700; color: var(--brand); background: rgba(var(--brand-rgb), 0.1); padding: 1px 7px; border-radius: 999px; }
  .badge-clear { display: inline-flex; background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 2px; border-radius: var(--radius); }
  .badge-clear:hover { color: var(--danger); }

  .actions { display: flex; flex-direction: column; gap: 0.5rem; margin-top: auto; padding-top: 0.5rem; }
  .ghost {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
    padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius);
    background: var(--surface-elevated); color: var(--text); cursor: pointer;
    font-family: var(--font-family); font-size: 0.85rem; font-weight: 500;
  }
  .ghost:hover { color: var(--danger); border-color: color-mix(in srgb, var(--danger) 40%, var(--border)); }

  .error-card {
    display: flex; align-items: center; gap: 0.5rem;
    margin-bottom: 1rem; padding: 0.7rem 0.85rem;
    border: 1px solid color-mix(in srgb, var(--danger) 40%, var(--border));
    background: color-mix(in srgb, var(--danger) 7%, var(--surface-elevated));
    border-radius: var(--radius-lg); color: var(--danger); font-size: 0.85rem;
  }

  .loading { display: flex; align-items: center; gap: 0.6rem; padding: 2rem; color: var(--text-muted); font-size: 0.9rem; }
  .spinner {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2px solid var(--border); border-top-color: var(--brand);
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 640px) {
    .ghost { min-height: 44px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .spinner { animation: none; }
  }
</style>

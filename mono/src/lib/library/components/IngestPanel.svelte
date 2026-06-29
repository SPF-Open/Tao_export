<script lang="ts">
  import { slide } from "svelte/transition";
  import { browser } from "$app/environment";
  import {
    FileArchive,
    FileSpreadsheet,
    CheckCircle2,
    XCircle,
    CopyX,
    Clock,
    LoaderCircle,
    Trash2,
    Timer,
    ChevronDown,
    Upload,
  } from "lucide-svelte";
  import { EmptyState, FileInput } from "$lib/ui";
  import {
    dbInfo,
    ingestJobs,
    ingestRunning,
    enqueueIngest,
    enqueueIngestFromExcel,
    enqueueIngestMerged,
    clearFinishedJobs,
    MAX_INGEST_FILES,
    type IngestJob,
    type IngestJobStatus,
  } from "$lib/library/store";
  import { DEFAULT_CONFIG } from "$lib/audit/config.js";
  import { getExcelSheets } from "$lib/audit/excel-parser.js";
  import type { ExcelConfig } from "$lib/audit/types.js";
  import ExcelColumnConfig from "./ExcelColumnConfig.svelte";

  type ImportMode = "zip" | "merged" | "excel";
  let importMode = $state<ImportMode>("zip");

  let excelFile = $state<File | null>(null);
  let zipFileMerge = $state<File | null>(null);
  let excelConfig = $state<ExcelConfig>({
    ...DEFAULT_CONFIG,
    columns: { ...DEFAULT_CONFIG.columns },
  });
  let selectedSheet = $state("");
  let sheetNames = $state<string[]>([]);

  $effect(() => {
    if (!excelFile) {
      sheetNames = [];
      selectedSheet = "";
      return;
    }
    excelFile.arrayBuffer().then((buf) => {
      sheetNames = getExcelSheets(buf);
      selectedSheet = sheetNames[0] ?? "";
    });
  });

  const reduceMotion = browser && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const slideDur = reduceMotion ? 0 : 200;

  const jobs = $derived($ingestJobs);
  const total = $derived(jobs.length);
  const active = $derived(
    jobs.filter((j) => j.status === "queued" || j.status === "parsing" || j.status === "importing"),
  );
  const failed = $derived(jobs.filter((j) => j.status === "failed"));
  const succeeded = $derived(jobs.filter((j) => j.status === "success" || j.status === "skipped"));
  const successCount = $derived(jobs.filter((j) => j.status === "success").length);
  const skippedCount = $derived(jobs.filter((j) => j.status === "skipped").length);
  const doneCount = $derived(failed.length + succeeded.length);
  const importedQuestions = $derived(
    jobs.reduce((s, j) => (j.status === "success" ? s + j.questionCount : s), 0),
  );
  const globalProgress = $derived(
    total ? jobs.reduce((s, j) => s + j.progress, 0) / total : 0,
  );

  const statusLabel: Record<IngestJobStatus, string> = {
    queued: "Queued",
    parsing: "Parsing…",
    importing: "Importing…",
    success: "Imported",
    skipped: "Already imported",
    failed: "Failed",
  };

  function iconFor(status: IngestJobStatus) {
    switch (status) {
      case "queued":
        return Clock;
      case "parsing":
      case "importing":
        return LoaderCircle;
      case "success":
        return CheckCircle2;
      case "skipped":
        return CopyX;
      case "failed":
        return XCircle;
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
</script>

<div class="ingest">
  {#if !$dbInfo}
    <EmptyState
      icon={FileArchive}
      title="No library open"
      description="Create or open a library in the Database tab before importing TAO exports."
    />
  {:else}
    <!-- Mode tabs -->
    <div class="mode-tabs" role="tablist" aria-label="Import mode">
      <button
        role="tab"
        class="tab-btn"
        class:active={importMode === "zip"}
        aria-selected={importMode === "zip"}
        onclick={() => (importMode = "zip")}
      >
        <FileArchive size={14} strokeWidth={1.75} /> ZIP
      </button>
      <button
        role="tab"
        class="tab-btn"
        class:active={importMode === "merged"}
        aria-selected={importMode === "merged"}
        onclick={() => (importMode = "merged")}
      >
        <Upload size={14} strokeWidth={1.75} /> ZIP + Excel
      </button>
      <button
        role="tab"
        class="tab-btn"
        class:active={importMode === "excel"}
        aria-selected={importMode === "excel"}
        onclick={() => (importMode = "excel")}
      >
        <FileSpreadsheet size={14} strokeWidth={1.75} /> Excel
      </button>
    </div>

    {#if importMode === "zip"}
      <FileInput accept=".zip" multiple invalidTitle="Unsupported file" onfiles={enqueueIngest} />
      <p class="hint">Drop up to {MAX_INGEST_FILES} TAO <code>.zip</code> exports — they import one by one.</p>
    {:else if importMode === "merged"}
      <p class="hint">Drop a TAO <code>.zip</code> and an Excel file — the ZIP provides structure, Excel enriches competencies.</p>
      <div class="dual-drop">
        <div class="drop-group">
          <span class="drop-label">TAO ZIP</span>
          <FileInput
            accept=".zip"
            invalidTitle="ZIP required"
            onfiles={(files: File[]) => (zipFileMerge = files[0] ?? null)}
          />
          {#if zipFileMerge}<p class="file-chip"><FileArchive size={12} /> {zipFileMerge.name}</p>{/if}
        </div>
        <div class="drop-group">
          <span class="drop-label">Excel file</span>
          <FileInput
            accept=".xlsx,.xls"
            invalidTitle="Excel required"
            onfiles={(files: File[]) => (excelFile = files[0] ?? null)}
          />
          {#if excelFile}<p class="file-chip"><FileSpreadsheet size={12} /> {excelFile.name}</p>{/if}
        </div>
      </div>
      {#if excelFile}
        <ExcelColumnConfig
          bind:config={excelConfig}
          bind:sheetNames
          bind:selectedSheet
        />
      {/if}
      <button
        class="import-btn"
        disabled={!zipFileMerge || !excelFile}
        onclick={() => {
          if (!zipFileMerge || !excelFile) return;
          enqueueIngestMerged(zipFileMerge, excelFile, excelConfig, selectedSheet || undefined);
          zipFileMerge = null;
          excelFile = null;
        }}
      >
        <Upload size={15} strokeWidth={1.75} /> Import merged
      </button>
    {:else}
      <p class="hint">Drop an Excel file to import questions directly into the library.</p>
      <FileInput
        accept=".xlsx,.xls"
        invalidTitle="Excel required"
        onfiles={(files: File[]) => (excelFile = files[0] ?? null)}
      />
      {#if excelFile}
        <p class="file-chip"><FileSpreadsheet size={12} /> {excelFile.name}</p>
        <ExcelColumnConfig
          bind:config={excelConfig}
          bind:sheetNames
          bind:selectedSheet
        />
        <button
          class="import-btn"
          onclick={() => {
            if (!excelFile) return;
            enqueueIngestFromExcel(excelFile, excelConfig, selectedSheet || undefined);
            excelFile = null;
          }}
        >
          <Upload size={15} strokeWidth={1.75} /> Import Excel
        </button>
      {/if}
    {/if}

    {#if total > 0}
      <!-- Global progress -->
      <div class="global">
        <div class="global-head">
          <span class="g-count">{doneCount} / {total} files</span>
          <div class="chips">
            {#if successCount}<span class="chip ok"><CheckCircle2 size={13} strokeWidth={2} /> {successCount}</span>{/if}
            {#if skippedCount}<span class="chip skip"><CopyX size={13} strokeWidth={2} /> {skippedCount}</span>{/if}
            {#if failed.length}<span class="chip bad"><XCircle size={13} strokeWidth={2} /> {failed.length}</span>{/if}
          </div>
        </div>
        <div class="bar global-bar" class:running={$ingestRunning}>
          <div class="bar-fill" style="width: {globalProgress * 100}%"></div>
        </div>
        <div class="global-foot">
          <span>{importedQuestions} questions imported</span>
          {#if !$ingestRunning}
            <button class="clear" onclick={clearFinishedJobs}><Trash2 size={13} strokeWidth={1.75} /> Clear list</button>
          {/if}
        </div>
      </div>

      <!-- Failures: always shown, prominent -->
      {#if failed.length}
        <section class="group">
          <h3 class="g-title bad"><XCircle size={15} strokeWidth={1.9} /> Failed ({failed.length})</h3>
          <ul class="list">
            {#each failed as job (job.id)}
              <li class="row failed" transition:slide|local={{ duration: slideDur }}>
                <span class="r-icon bad"><XCircle size={16} strokeWidth={1.9} /></span>
                <div class="r-main">
                  <span class="r-name">{job.filename}</span>
                  <span class="r-error">{job.error}</span>
                </div>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      <!-- Active / queued -->
      {#if active.length}
        <section class="group">
          <ul class="list">
            {#each active as job (job.id)}
              {@const Icon = iconFor(job.status)}
              <li class="row" transition:slide|local={{ duration: slideDur }}>
                <span class="r-icon" class:spin={job.status === 'parsing' || job.status === 'importing'}>
                  <Icon size={16} strokeWidth={1.9} />
                </span>
                <div class="r-main">
                  <div class="r-line">
                    <span class="r-name">
                      {job.filename}
                      {#if job.source && job.source !== 'zip'}<span class="src-badge">{job.source === 'excel' ? 'Excel' : 'Merged'}</span>{/if}
                    </span>
                    <span class="r-status">{statusLabel[job.status]}</span>
                  </div>
                  <div class="bar file-bar">
                    <div class="bar-fill" style="width: {job.progress * 100}%"></div>
                  </div>
                </div>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      <!-- Succeeded / skipped: present but minimized -->
      {#if succeeded.length}
        <details class="completed" open={!$ingestRunning && failed.length === 0 && active.length === 0}>
          <summary>
            <ChevronDown size={15} strokeWidth={1.9} class="chev" />
            <span>{successCount} imported{skippedCount ? `, ${skippedCount} skipped` : ""}</span>
          </summary>
          <ul class="list compact">
            {#each succeeded as job (job.id)}
              {@const Icon = iconFor(job.status)}
              <li class="row mini {job.status}" transition:slide|local={{ duration: slideDur }}>
                <span class="r-icon {job.status === 'success' ? 'ok' : 'skip'}"><Icon size={14} strokeWidth={2} /></span>
                <span class="r-name">
                  {job.filename}
                  {#if job.source && job.source !== 'zip'}<span class="src-badge">{job.source === 'excel' ? 'Excel' : 'Merged'}</span>{/if}
                </span>
                <span class="r-meta">
                  {#if job.status === "success"}{job.questionCount} q{:else}duplicate{/if}
                  {#if job.durationMs}<span class="r-time"><Timer size={11} strokeWidth={2} /> {job.durationMs.toFixed(0)}ms</span>{/if}
                </span>
                <span class="r-size">{formatBytes(job.size)}</span>
              </li>
            {/each}
          </ul>
        </details>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .ingest { display: flex; flex-direction: column; gap: 0.75rem; }
  .hint { margin: 0; font-size: 0.82rem; color: var(--text-muted); }
  code { font-family: ui-monospace, monospace; font-size: 0.82em; }

  /* Global progress */
  .global {
    display: flex; flex-direction: column; gap: 0.5rem;
    padding: 0.85rem 1rem; border: 1px solid var(--border);
    border-radius: var(--radius-lg); background: var(--surface-elevated);
  }
  .global-head, .global-foot { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  .g-count { font-weight: 600; color: var(--text); font-size: 0.9rem; }
  .global-foot { font-size: 0.78rem; color: var(--text-muted); }
  .chips { display: flex; gap: 0.4rem; flex-wrap: wrap; }
  .chip { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; font-weight: 600; padding: 1px 7px; border-radius: 999px; border: 1px solid var(--border); }
  .chip.ok { color: var(--success); border-color: color-mix(in srgb, var(--success) 40%, var(--border)); }
  .chip.skip { color: var(--text-muted); }
  .chip.bad { color: var(--danger); border-color: color-mix(in srgb, var(--danger) 40%, var(--border)); }

  .clear { display: inline-flex; align-items: center; gap: 0.3rem; background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.78rem; padding: 2px 4px; border-radius: var(--radius); }
  .clear:hover { color: var(--danger); }
  .clear:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }

  /* Bars */
  .bar { width: 100%; height: 6px; border-radius: 999px; background: var(--surface); overflow: hidden; border: 1px solid var(--border); }
  .global-bar { height: 8px; }
  .bar-fill { height: 100%; background: var(--brand); border-radius: 999px; transition: width 350ms cubic-bezier(0.22, 1, 0.36, 1); }
  .file-bar { height: 5px; margin-top: 0.35rem; }

  /* Shimmer on the running global bar */
  .global-bar.running .bar-fill {
    background-image: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
    background-size: 200% 100%;
    animation: shimmer 1.2s linear infinite;
  }
  @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

  /* Groups + rows */
  .group { display: flex; flex-direction: column; gap: 0.4rem; }
  .g-title { display: inline-flex; align-items: center; gap: 0.4rem; margin: 0; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
  .g-title.bad { color: var(--danger); }
  .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }

  .row { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.6rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface-elevated); }
  .row.failed { border-color: color-mix(in srgb, var(--danger) 45%, var(--border)); background: color-mix(in srgb, var(--danger) 6%, var(--surface-elevated)); }
  .r-icon { flex-shrink: 0; color: var(--text-muted); display: flex; padding-top: 1px; }
  .r-icon.ok { color: var(--success); }
  .r-icon.skip { color: var(--text-muted); }
  .r-icon.bad { color: var(--danger); }
  .r-main { flex: 1; min-width: 0; }
  .r-line { display: flex; justify-content: space-between; gap: 0.5rem; align-items: baseline; }
  .r-name { font-size: 0.86rem; font-weight: 500; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .r-status { font-size: 0.74rem; color: var(--text-muted); white-space: nowrap; }
  .r-error { display: block; margin-top: 2px; font-size: 0.78rem; color: var(--danger); line-height: 1.4; word-break: break-word; }

  /* Compact (succeeded) rows */
  .completed { border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface-elevated); overflow: hidden; }
  .completed > summary { display: flex; align-items: center; gap: 0.45rem; padding: 0.6rem 0.85rem; cursor: pointer; font-size: 0.84rem; font-weight: 600; color: var(--text); list-style: none; }
  .completed > summary::-webkit-details-marker { display: none; }
  .completed > summary :global(.chev) { transition: transform 200ms ease; color: var(--text-muted); }
  .completed[open] > summary :global(.chev) { transform: rotate(-180deg); }
  .list.compact { padding: 0 0.5rem 0.5rem; gap: 0.15rem; }
  .row.mini { padding: 0.35rem 0.5rem; border: none; background: transparent; border-radius: var(--radius); align-items: center; gap: 0.5rem; }
  .row.mini:hover { background: var(--surface); }
  .row.mini .r-name { flex: 1; font-weight: 400; color: var(--text-muted); }
  .r-meta { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.74rem; color: var(--text-muted); white-space: nowrap; }
  .r-time { display: inline-flex; align-items: center; gap: 0.2rem; }
  .r-size { font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; }

  /* Spinner */
  .spin { animation: spin 0.9s linear infinite; color: var(--brand); }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (prefers-reduced-motion: reduce) {
    .bar-fill { transition: none; }
    .global-bar.running .bar-fill { animation: none; }
    .spin { animation: none; }
    .completed > summary :global(.chev) { transition: none; }
  }

  /* Mode tabs */
  .mode-tabs {
    display: flex; gap: 2px; padding: 3px;
    background: var(--surface-elevated); border: 1px solid var(--border);
    border-radius: var(--radius-lg);
  }
  .tab-btn {
    display: inline-flex; align-items: center; gap: 0.35rem;
    flex: 1; justify-content: center;
    padding: 5px 10px; border: none; border-radius: var(--radius);
    background: transparent; color: var(--text-muted);
    font-family: var(--font-family); font-size: 0.82rem; font-weight: 500;
    cursor: pointer; transition: background 0.15s, color 0.15s;
  }
  .tab-btn:hover { color: var(--text); }
  .tab-btn.active { background: var(--accent); color: var(--accent-foreground); }
  .tab-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }

  /* Dual-drop for ZIP + Excel mode */
  .dual-drop { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .drop-group { display: flex; flex-direction: column; gap: 0.4rem; }
  .drop-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }

  /* File chip */
  .file-chip {
    display: inline-flex; align-items: center; gap: 0.3rem;
    margin: 0; font-size: 0.78rem; color: var(--text-muted);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* Import button */
  .import-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
    align-self: flex-start;
    padding: 8px 16px; border: none; border-radius: var(--radius);
    background: var(--accent); color: var(--accent-foreground);
    font-family: var(--font-family); font-size: 0.86rem; font-weight: 600;
    cursor: pointer; transition: opacity 0.15s;
  }
  .import-btn:hover:not(:disabled) { opacity: 0.88; }
  .import-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .import-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.25); }

  /* Source badge */
  .src-badge {
    display: inline-flex; align-items: center;
    padding: 1px 5px; margin-left: 5px;
    font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
    border-radius: 999px; border: 1px solid var(--border);
    color: var(--text-muted); vertical-align: middle;
  }

  @media (max-width: 480px) {
    .dual-drop { grid-template-columns: 1fr; }
  }
</style>

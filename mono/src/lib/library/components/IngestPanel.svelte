<script lang="ts">
  import { Upload, FileArchive, CheckCircle2, CopyX, GitBranch, Timer } from "lucide-svelte";
  import { Button, Card, EmptyState, FileInput } from "$lib/ui";
  import { dbInfo, busy, importPreview, analyzeZip, ingestZip } from "$lib/library/store";

  let files = $state<File[]>([]);
  let analyzedName = $state("");
  const selected = $derived(files[0] ?? null);

  // Analyze each newly-selected ZIP exactly once.
  $effect(() => {
    if (selected && selected.name !== analyzedName) {
      analyzedName = selected.name;
      void analyzeZip(selected);
    }
  });

  async function doImport() {
    if (selected) {
      await ingestZip(selected);
      files = [];
      analyzedName = "";
    }
  }

  const preview = $derived($importPreview);
  const statusLabel: Record<string, string> = {
    new: "New import",
    duplicate: "Already imported",
    "new-version": "New version of an existing test",
  };
</script>

<div class="ingest">
  {#if !$dbInfo}
    <EmptyState icon={FileArchive} title="No library open"
      description="Create or open a library in the Database tab before importing TAO exports." />
  {:else}
    <FileInput bind:file={files} accept=".zip" invalidTitle="Unsupported file" />

    {#if preview}
      <Card status={preview.imported ? "success" : preview.duplicateStatus === "duplicate" ? "warning" : "info"}>
        {#snippet title()}
          <span class="ct">
            {#if preview.imported}<CheckCircle2 size={18} strokeWidth={1.75} />
            {:else if preview.duplicateStatus === "duplicate"}<CopyX size={18} strokeWidth={1.75} />
            {:else if preview.duplicateStatus === "new-version"}<GitBranch size={18} strokeWidth={1.75} />
            {:else}<FileArchive size={18} strokeWidth={1.75} />{/if}
            {preview.imported ? "Imported" : "Preview"}
          </span>
        {/snippet}

        <dl class="meta">
          <div><dt>Title</dt><dd>{preview.title}</dd></div>
          <div><dt>File</dt><dd>{preview.filename}</dd></div>
          <div><dt>Questions</dt><dd>{preview.questionCount}</dd></div>
          <div><dt>Status</dt><dd>{statusLabel[preview.duplicateStatus] ?? preview.duplicateStatus}</dd></div>
          {#if preview.skippedCount > 0}
            <div><dt>Skipped</dt><dd>{preview.skippedCount}</dd></div>
          {/if}
          <div><dt><Timer size={12} strokeWidth={2} /> {preview.imported ? "Import" : "Parse"} time</dt>
            <dd>{preview.durationMs.toFixed(0)} ms</dd></div>
        </dl>

        {#if preview.parseErrors.length}
          <details class="errors">
            <summary>{preview.parseErrors.length} parse warning(s)</summary>
            <ul>{#each preview.parseErrors as e}<li>{e}</li>{/each}</ul>
          </details>
        {/if}

        {#snippet footer()}
          <div class="row">
            {#if !preview.imported && preview.duplicateStatus !== "duplicate"}
              <Button variant="primary" disabled={$busy} onclick={doImport}>
                <Upload size={16} strokeWidth={2} /> Import {preview.questionCount} questions
              </Button>
            {:else if preview.duplicateStatus === "duplicate"}
              <span class="muted">This exact export is already in the library.</span>
            {:else}
              <span class="muted">Imported into the library.</span>
            {/if}
          </div>
        {/snippet}
      </Card>
    {/if}
  {/if}
</div>

<style>
  .ingest { display: flex; flex-direction: column; gap: 0.75rem; }
  .ct { display: inline-flex; align-items: center; gap: 0.5rem; }
  .row { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
  .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.5rem 1rem; margin: 0; }
  .meta div { display: flex; flex-direction: column; gap: 2px; }
  dt { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); display: inline-flex; align-items: center; gap: 3px; }
  dd { margin: 0; font-size: 0.9rem; font-weight: 600; color: var(--text); }
  .muted { color: var(--text-muted); font-size: 0.85rem; }
  .errors { margin-top: 0.75rem; font-size: 0.82rem; color: var(--text-muted); }
  .errors ul { margin: 0.4rem 0 0; padding-left: 1.1rem; }
</style>

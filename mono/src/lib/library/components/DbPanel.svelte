<script lang="ts">
  import { Database, FolderOpen, Plus, Download, HardDriveDownload, TriangleAlert } from "lucide-svelte";
  import { Button, Card } from "$lib/ui";
  import { dbInfo, busy, createDb, openDb, exportDb } from "$lib/library/store";
</script>

<div class="db-panel">
  <Card status={$dbInfo ? "success" : "info"}>
    {#snippet title()}
      <span class="ct"><Database size={18} strokeWidth={1.75} /> Database</span>
    {/snippet}

    {#if $dbInfo}
      <dl class="meta">
        <div><dt>Database ID</dt><dd class="mono">{$dbInfo.databaseId.slice(0, 8)}…</dd></div>
        <div><dt>Schema version</dt><dd>v{$dbInfo.schemaVersion}</dd></div>
        <div><dt>Content version</dt><dd>{$dbInfo.contentVersion}</dd></div>
        <div><dt>Content hash</dt><dd class="mono">{$dbInfo.contentHash}</dd></div>
        <div><dt>Tests</dt><dd>{$dbInfo.counts.tests}</dd></div>
        <div><dt>Questions</dt><dd>{$dbInfo.counts.questions}</dd></div>
        <div><dt>Competencies</dt><dd>{$dbInfo.counts.competencies}</dd></div>
        <div><dt>Storage</dt><dd>{$dbInfo.storageMode === "opfs" ? "Persistent (OPFS)" : "In-memory"}</dd></div>
      </dl>

      {#if $dbInfo.storageMode === "memory"}
        <p class="warn"><TriangleAlert size={15} strokeWidth={1.75} /> This browser has no persistent storage for the library. Export the
          <code>.taodb</code> file to keep your changes.</p>
      {/if}
    {:else}
      <p class="hint">Create a new question library or open an existing <code>.taodb</code> file to begin.</p>
    {/if}

    {#snippet footer()}
      <div class="actions">
        <Button variant="primary" disabled={$busy} onclick={() => createDb()}>
          <Plus size={16} strokeWidth={2} /> New library
        </Button>

        <label class="open-btn" class:disabled={$busy}>
          <FolderOpen size={16} strokeWidth={1.75} /> Open…
          <input type="file" accept=".taodb,.sqlite,.db,.sqlite3" disabled={$busy}
            onchange={(e) => {
              const t = e.currentTarget;
              if (t.files?.length) { void openDb(t.files[0]); t.value = ""; }
            }} />
        </label>

        <Button variant="secondary" disabled={$busy || !$dbInfo} onclick={() => exportDb()}>
          <Download size={16} strokeWidth={1.75} /> Export
        </Button>
      </div>
    {/snippet}
  </Card>

  {#if !$dbInfo}
    <p class="aside"><HardDriveDownload size={14} strokeWidth={1.75} /> Everything runs in your browser — no upload, no server.</p>
  {/if}
</div>

<style>
  .db-panel { display: flex; flex-direction: column; gap: 0.75rem; }
  .ct { display: inline-flex; align-items: center; gap: 0.5rem; }
  .meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 0.5rem 1rem;
    margin: 0;
  }
  .meta div { display: flex; flex-direction: column; gap: 2px; }
  dt { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); }
  dd { margin: 0; font-size: 0.9rem; font-weight: 600; color: var(--text); }
  .mono { font-family: ui-monospace, monospace; font-weight: 500; word-break: break-all; }
  .hint, .aside { margin: 0; color: var(--text-muted); font-size: 0.85rem; }
  .aside { display: inline-flex; align-items: center; gap: 0.4rem; }
  .warn {
    display: flex; align-items: center; gap: 0.4rem;
    margin: 0.75rem 0 0; padding: 0.6rem 0.75rem;
    font-size: 0.82rem; color: var(--warning);
    background: color-mix(in srgb, var(--warning) 8%, var(--surface));
    border-radius: var(--radius);
  }
  code { font-family: ui-monospace, monospace; font-size: 0.82em; }
  .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
  .open-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: var(--radius);
    border: 1px solid var(--border); background: var(--surface); color: var(--text);
    font-size: var(--font-size-base); font-weight: 500; cursor: pointer;
    transition: background-color 200ms ease, border-color 200ms ease;
  }
  .open-btn:hover:not(.disabled) { background: var(--border); box-shadow: var(--shadow-sm); }
  .open-btn.disabled { opacity: 0.5; cursor: not-allowed; }
  .open-btn input { display: none; }
  .open-btn:focus-within { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }
</style>

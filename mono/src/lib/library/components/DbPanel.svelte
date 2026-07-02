<script lang="ts">
  import {
    Database, FolderOpen, Plus, Download, HardDriveDownload, TriangleAlert,
    Lock, LockOpen, ShieldCheck,
  } from "lucide-svelte";
  import { Button, Card, TextInput } from "$lib/ui";
  import {
    dbInfo, busy, createDb, openDb, exportDb,
    dbHasPassword, setDbPassword, removeDbPassword,
  } from "$lib/library/store";
  import { isEncryptedFile } from "$lib/library/crypto";

  const MIN_PW = 4;

  // --- Set / change / remove the export password ---
  let editing = $state(false);
  let pwNew = $state("");
  let pwConfirm = $state("");
  let pwError = $state("");

  function startEdit() {
    editing = true;
    pwNew = ""; pwConfirm = ""; pwError = "";
  }
  function cancelEdit() {
    editing = false;
    pwNew = ""; pwConfirm = ""; pwError = "";
  }
  function savePassword() {
    if (pwNew.length < MIN_PW) { pwError = `Use at least ${MIN_PW} characters.`; return; }
    if (pwNew !== pwConfirm) { pwError = "Passwords do not match."; return; }
    setDbPassword(pwNew);
    cancelEdit();
  }
  function removePassword() {
    removeDbPassword();
    cancelEdit();
  }

  // --- Open a file, prompting for a password when it is encrypted ---
  let pendingFile = $state<File | null>(null);
  let unlockPw = $state("");
  let unlockError = $state("");

  async function pickFile(file: File) {
    unlockError = "";
    if (await isEncryptedFile(file)) {
      pendingFile = file;
      unlockPw = "";
    } else {
      await openDb(file);
    }
  }
  async function submitUnlock() {
    if (!pendingFile || !unlockPw) return;
    const ok = await openDb(pendingFile, unlockPw);
    if (ok) { pendingFile = null; unlockPw = ""; unlockError = ""; }
    else { unlockError = "Incorrect password. Please try again."; }
  }
  function cancelUnlock() {
    pendingFile = null; unlockPw = ""; unlockError = "";
  }
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

      <div class="security">
        <div class="sec-head">
          {#if $dbHasPassword}
            <span class="sec-badge"><ShieldCheck size={14} strokeWidth={1.9} /> Encrypted export</span>
          {:else}
            <span class="sec-badge muted"><LockOpen size={14} strokeWidth={1.75} /> No password</span>
          {/if}
          {#if !editing}
            <div class="sec-actions">
              <button type="button" class="link-btn" onclick={startEdit}>{$dbHasPassword ? "Change" : "Set password"}</button>
              {#if $dbHasPassword}
                <button type="button" class="link-btn danger" onclick={removePassword}>Remove</button>
              {/if}
            </div>
          {/if}
        </div>

        {#if editing}
          <div class="pw-form">
            <TextInput type="password" bind:value={pwNew} placeholder="New password" />
            <TextInput type="password" bind:value={pwConfirm} placeholder="Confirm password" />
            {#if pwError}<p class="pw-error">{pwError}</p>{/if}
            <div class="pw-buttons">
              <Button variant="primary" onclick={savePassword}><Lock size={15} strokeWidth={1.9} /> Save</Button>
              <button type="button" class="link-btn" onclick={cancelEdit}>Cancel</button>
            </div>
          </div>
        {/if}

        <p class="sec-note">Encryption protects the exported <code>.taodb</code> file. The in-browser working copy is not encrypted.</p>
      </div>
    {:else}
      <p class="hint">Create a new question library or open an existing <code>.taodb</code> file to begin.</p>
    {/if}

    {#if pendingFile}
      <div class="unlock">
        <div class="unlock-head"><Lock size={14} strokeWidth={1.9} /> <span>This library is encrypted — enter its password</span></div>
        <TextInput type="password" bind:value={unlockPw} placeholder="Password" disabled={$busy} />
        {#if unlockError}<p class="pw-error">{unlockError}</p>{/if}
        <div class="pw-buttons">
          <Button variant="primary" disabled={$busy || !unlockPw} onclick={submitUnlock}><LockOpen size={15} strokeWidth={1.9} /> Unlock &amp; open</Button>
          <button type="button" class="link-btn" onclick={cancelUnlock} disabled={$busy}>Cancel</button>
        </div>
      </div>
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
              if (t.files?.length) { void pickFile(t.files[0]); t.value = ""; }
            }} />
        </label>

        <Button variant="secondary" disabled={$busy || !$dbInfo} onclick={() => exportDb()}>
          <Download size={16} strokeWidth={1.75} /> Export {#if $dbHasPassword}<Lock size={13} strokeWidth={1.9} />{/if}
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

  /* Security / password */
  .security {
    margin-top: 0.9rem; padding-top: 0.85rem;
    border-top: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 0.6rem;
  }
  .sec-head { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
  .sec-badge {
    display: inline-flex; align-items: center; gap: 0.35rem;
    font-size: 0.8rem; font-weight: 600; color: var(--brand);
  }
  .sec-badge.muted { color: var(--text-muted); font-weight: 500; }
  .sec-actions { display: flex; gap: 0.75rem; margin-left: auto; }
  .link-btn {
    background: none; border: none; padding: 0; cursor: pointer;
    font-family: var(--font-family); font-size: 0.82rem; font-weight: 500;
    color: var(--brand);
    transition: color 150ms ease, opacity 150ms ease;
  }
  .link-btn:hover:not(:disabled) { text-decoration: underline; }
  .link-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .link-btn.danger { color: var(--danger); }
  .link-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); border-radius: 4px; }
  .pw-form, .unlock {
    display: flex; flex-direction: column; gap: 0.5rem;
    max-width: 320px;
  }
  .unlock {
    margin-top: 0.85rem; padding: 0.85rem;
    border: 1px solid rgba(var(--brand-rgb), 0.35);
    border-radius: var(--radius);
    background: rgba(var(--brand-rgb), 0.05);
    max-width: none;
    animation: reveal 180ms ease;
  }
  .unlock-head {
    display: inline-flex; align-items: center; gap: 0.4rem;
    font-size: 0.84rem; font-weight: 600; color: var(--text);
  }
  .pw-buttons { display: flex; align-items: center; gap: 0.75rem; }
  .pw-error { margin: 0; font-size: 0.8rem; color: var(--danger); }
  .sec-note { margin: 0; font-size: 0.76rem; color: var(--text-muted); line-height: 1.5; }

  @keyframes reveal { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
  @media (prefers-reduced-motion: reduce) { .unlock { animation: none; } }
</style>

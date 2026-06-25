<script lang="ts">
  import { QtiAdapter } from "$lib/questions/adapters/qti.js";
  import {
    assessments,
    examsIndex,
    multiple,
    activeItems,
    resetSettings,
    windowName,
    sourceFileName,
    pushError,
  } from "./store";
  import FileInput from "$lib/ui/FileInput.svelte";
  import { get } from "svelte/store";

  let files = $state<File[]>([]);
  let loadError = $state<string | null>(null);
  let loading = $state(false);

  $effect(() => {
    const f = Array.from(files);
    if (!f.length) return;

    sourceFileName.set(f.map((file) => file.name).join(", "));
    loadError = null;
    loading = true;

    const adapter = new QtiAdapter();

    Promise.all(
      f.map(async (file) => {
        if (!file.name.toLowerCase().endsWith(".zip")) {
          throw new Error(`"${file.name}" is not a .zip file`);
        }
        return adapter.read(file);
      })
    ).then((data) => {
      assessments.set(data);
      const index = get(examsIndex);
      const active = data[index] ?? data[0];
      if (active) {
        activeItems.set(active.sections.flatMap(s => s.items));
        windowName.set(active.title || "TAO-Export" + Math.floor(Math.random() * 1000));
      }
      const total = data.reduce((n, a) => n + a.sections.reduce((m, s) => m + s.items.length, 0), 0);
      if (total === 0) {
        loadError = "The ZIP was read, but no questions were found inside it.";
      }
    }).catch((e) => {
      const msg = String(e?.message ?? e);
      loadError = msg;
      pushError("ZIP Load Error", msg);
    }).finally(() => {
      loading = false;
    });

    resetSettings();
  });
</script>

<FileInput bind:file={files} accept=".zip" multiple={$multiple} />

{#if loading}
  <p class="dz-status">Reading ZIP…</p>
{/if}
{#if loadError}
  <p class="dz-error">{loadError}</p>
{/if}

<style>
  .dz-status {
    margin: 12px 0 0;
    font-size: 13px;
    color: var(--text-muted);
    text-align: center;
  }

  .dz-error {
    margin: 12px 0 0;
    padding: 8px 12px;
    font-size: 13px;
    color: var(--danger, #dc2626);
    background: rgba(220, 38, 38, 0.08);
    border: 1px solid rgba(220, 38, 38, 0.3);
    border-radius: var(--radius);
    text-align: center;
  }
</style>

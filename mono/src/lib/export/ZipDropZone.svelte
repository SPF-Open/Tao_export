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


<FileInput
  bind:file={files}
  accept=".zip,application/zip,application/x-zip-compressed"
  multiple={$multiple}
/>
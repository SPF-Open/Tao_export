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

  $effect(() => {
    const f = Array.from(files);
    if (!f.length) return;

    sourceFileName.set(f.map((file) => file.name).join(", "));

    const adapter = new QtiAdapter();

    Promise.all(
      f.map(async (file) => {
        if (!file.name.toLowerCase().endsWith(".zip")) {
          throw new Error("Please select a zip file");
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
    }).catch((e) => {
      pushError("ZIP Load Error", String(e?.message ?? e));
    });

    resetSettings();
  });
</script>

<FileInput bind:file={files} accept=".zip" multiple={$multiple} />

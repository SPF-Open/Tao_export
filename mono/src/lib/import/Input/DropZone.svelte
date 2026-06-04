<script lang="ts">
  import Files from "$lib/ui/Files.svelte";
  import { currentSheet, file, name, workbook } from "../helper/store";
  import * as XLSX from "xlsx";
    import { writable } from "svelte/store";

  const maxLenghtName = 45;
  let fileName = "";
  let fileTemp = writable<File[]>([]);

  fileTemp.subscribe(async (f) => {
    if(!f || !f.length) {
      return;
    }
    const e = f[0];

    fileName = fileTemp
      ? e.name.length > maxLenghtName
        ? e.name.slice(0, maxLenghtName - 3) + "..."
        : e.name
      : "";

    // Update Store item
    file.update(() => e);
    name.update(() => fileName.split(".").slice(0, -1).join());

    // Restore options
    currentSheet.update(() => "");

    const data = await e.arrayBuffer();
    /* data is an ArrayBuffer */
    workbook.update(() => XLSX.read(data));
  });
</script>

<div>
<Files bind:file={$fileTemp}/>
</div>

<style>
  div {
    border: 2px solid var(--border-color);
    border-radius: 12px;
  }

  div :global(label) {
    padding: 0 !important;
    min-height: 100px !important;
  }
</style>

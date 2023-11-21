<script lang="ts">
  import { ZipReader } from "@zip.js/zip.js";

  import {
    entryToObj,
    readAndParseXml,
    xmlToObj,
    type QuestionType,
    type zipObj,
  } from "./helper";

  export let questions: QuestionType[] = [];

  let files: FileList;
  let assets: zipObj[];
  let title = "Tao-PDF exporter";

  $: if (files) {
    const init = async () => {
      const zipReader = new ZipReader(files[0].stream());
      const entries = await zipReader.getEntries();

      const newTitle = files[0].name.split(".")[0].split("_")[0].toUpperCase();

      if (title == newTitle) return;

      title = newTitle;

      // Parse asset
      assets = entries
        .filter(
          (entry) =>
            !entry.filename.endsWith(".css") && !entry.filename.endsWith(".xml")
        )
        .map(entryToObj); // format obj

      // Parse questions
      const xmls = await Promise.all(
        entries
          .filter(
            (entry) =>
              entry.filename.endsWith(".xml") &&
              entry.filename !== "imsmanifest.xml"
          )
          .map(entryToObj) // format obj
          .map((obj) => readAndParseXml(obj, assets)) // parse xml
      );

      questions = xmls.map(xmlToObj).filter((q) => q);
    };
    init(); // Work around to use async/await
  }
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<input type="file" name="zip" id="zip" accept=".zip" bind:files />
<button class="hide-print" on:click|preventDefault={() => window.print()}
  >Get PDF</button
>
<script lang="ts">
  import { ZipReader } from "@zip.js/zip.js";

  import {
    entryToObj,
    readAndParseXml,
    xmlToObj,
    type EntryObj,
    type QuestionType,
  } from "./helper";
  import {
    exams,
    examsIndex,
    multiple,
    questions,
    resetSettings,
    windowName,
  } from "../store";
  import { Button, Files } from "@gzlab/uui";
  import { get } from "svelte/store";

  let assets: EntryObj[];
  let files = $state<File[]>([]);

  $effect(() => {
    const f = Array.from(files);
    if (!f) {
      exams.set([]);
      questions.set([]);
      return;
    }
    Promise.all(
      f.map(async (file) => {
        if (file.name.split(".").pop() !== "zip")
          throw new Error("Please select a zip file");

        try {
          const zipReader = new ZipReader(file.stream());
          const entries = await zipReader.getEntries();
          const newTitle = files[0].name
            .split(".")[0]
            .split("_")[0]
            .toUpperCase();

          assets = entries
            .filter(
              (entry) =>
                !entry.filename.toLowerCase().endsWith(".css") &&
                !entry.filename.toLowerCase().endsWith(".xml"),
            )
            .map(entryToObj);

          const xmls = await Promise.all(
            entries
              .filter(
                (entry) =>
                  entry.filename.toLowerCase().endsWith(".xml") &&
                  entry.filename.toLowerCase() !== "imsmanifest.xml",
              )
              .map(entryToObj)
              .map((obj) => readAndParseXml(obj, assets)),
          );

          const name = file.name.replace("_", " ").split("-")[0].toUpperCase();

          return {
            questions: xmls.map(xmlToObj).filter((q) => q),
            error: null,
            name,
          };
        } catch (e) {
          return {
            questions: [] as QuestionType[],
            error: e as Error,
            name: "",
          };
        }
      }),
    ).then((data) => {
      exams.set(data);
      const q = data[get(examsIndex)];
      if (q && q.questions && q.questions.length) {
        questions.set(q.questions);
        windowName.set(
          q.name || "TAO-Export" + Math.floor(Math.random() * 1000),
        );
      }
    });
    resetSettings();
  });
</script>

<div class="zip-input">
  <Files bind:file={files} accept=".zip" size="md" multiple={$multiple} />
  <Button onClick={() => window.print()} type="info">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="6 9 6 2 18 2 18 9"></polyline>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
      <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
    Get PDF
  </Button>
</div>

<style>
  .zip-input {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
</style>

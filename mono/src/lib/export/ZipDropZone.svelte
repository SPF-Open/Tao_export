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
    sourceFileName,
  } from "./store";
  import FileInput from "$lib/ui/FileInput.svelte";
  import { get } from "svelte/store";

  let assets: EntryObj[];
  let files = $state<File[]>([]);

  $effect(() => {
    const f = Array.from(files);
    if (!f.length) return;

    sourceFileName.set(f.map((file) => file.name).join(", "));

    Promise.all(
      f.map(async (file) => {
        if (file.name.split(".").pop() !== "zip")
          throw new Error("Please select a zip file");

        try {
          const zipReader = new ZipReader(file.stream());
          const entries = await zipReader.getEntries();

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

<FileInput bind:file={files} accept=".zip" multiple={$multiple} />

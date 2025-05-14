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

          // Parse asset
          assets = entries
            .filter(
              (entry) =>
                !entry.filename.endsWith(".css") &&
                !entry.filename.endsWith(".xml"),
            )
            .map(entryToObj); // format obj

          // Parse questions
          const xmls = await Promise.all(
            entries
              .filter(
                (entry) =>
                  entry.filename.endsWith(".xml") &&
                  entry.filename !== "imsmanifest.xml",
              )
              .map(entryToObj) // format obj
              .map((obj) => readAndParseXml(obj, assets)), // parse xml
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

<Files bind:file={files} accept=".zip" size="md" multiple={$multiple} />
<Button onClick={() => window.print()} type="info">Get PDF</Button>

<style>
</style>

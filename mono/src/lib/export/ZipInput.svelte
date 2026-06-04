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
  } from "./store";
  import Button from "./ui/Button.svelte";
  import FileInput from "./ui/FileInput.svelte";
  import { get } from "svelte/store";
  import { Printer, FileJson, ChevronDown } from 'lucide-svelte';

  type Props = {
    onExportPDF?: () => void;
    onExportJSON?: () => void;
  };

  interface ComponentProps extends Props {}

  let { onExportPDF, onExportJSON }: ComponentProps = $props();

  let assets: EntryObj[];
  let files = $state<File[]>([]);
  let exportFormat = $state<'pdf' | 'json'>('pdf');
  let dropdownOpen = $state(false);

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
  <Button 
    onclick={() => {
      if (exportFormat === 'pdf') {
        onExportPDF?.();
      } else {
        onExportJSON?.();
      }
    }} 
    onClick={() => {
      if (exportFormat === 'pdf') {
        onExportPDF?.();
      } else {
        onExportJSON?.();
      }
    }}
    variant="primary"
  >
    {#if exportFormat === 'pdf'}
      <Printer size={16} />
      Get PDF
    {:else}
      <FileJson size={16} />
      Get JSON
    {/if}
  </Button>
  
  <div class="export-selector">
    <button 
      class="dropdown-toggle"
      onclick={() => dropdownOpen = !dropdownOpen}
      aria-label="Select export format"
    >
      <span class="selector-label">
        {exportFormat === 'pdf' ? 'PDF' : 'JSON'}
      </span>
      <div class="chevron" class:rotated={dropdownOpen}>
        <ChevronDown size={14} />
      </div>
    </button>
    
    {#if dropdownOpen}
      <div class="dropdown-menu">
        <button
          class="dropdown-item"
          class:active={exportFormat === 'pdf'}
          onclick={() => {
            exportFormat = 'pdf';
            dropdownOpen = false;
          }}
        >
          PDF
        </button>
        <button
          class="dropdown-item"
          class:active={exportFormat === 'json'}
          onclick={() => {
            exportFormat = 'json';
            dropdownOpen = false;
          }}
        >
          JSON
        </button>
      </div>
    {/if}
  </div>

  <FileInput bind:file={files} accept=".zip" multiple={$multiple} />
</div>

<style>
  .zip-input {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .export-selector {
    position: relative;
  }

  .dropdown-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 12px;
    transition: color 0.2s;
  }

  .dropdown-toggle:hover {
    color: var(--text);
  }

  .selector-label {
    font-weight: 500;
    font-size: 12px;
  }

  .chevron {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
  }

  .chevron.rotated {
    transform: rotate(180deg);
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin-top: 4px;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .dropdown-item {
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    text-align: left;
    color: var(--text);
    cursor: pointer;
    font-size: 12px;
    transition: background 0.2s;
  }

  .dropdown-item:hover {
    background: var(--surface);
  }

  .dropdown-item.active {
    color: var(--accent);
    font-weight: 600;
  }

  .dropdown-item:first-child {
    border-radius: var(--radius) var(--radius) 0 0;
  }

  .dropdown-item:last-child {
    border-radius: 0 0 var(--radius) var(--radius);
  }
</style>

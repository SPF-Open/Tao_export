<script lang="ts">
  import Download from "./Input/Download.svelte";
  import { Combobox } from "$lib/ui";
  import RadioGroup from "$lib/ui/RadioGroup.svelte";
  import Switch from "$lib/ui/Switch.svelte";
  import {
    FileSpreadsheet,
    SlidersHorizontal,
    Columns3,
    Rows3,
    X,
  } from "lucide-svelte";
  import {
    currentSheet,
    selectedFormat,
    hideAnswer,
    workbook,
    langOutput,
    file,
    name,
  } from "./helper/store";
  import Section from "./container/Section.svelte";
  import Column from "./menu/Column.svelte";
  import Row from "./menu/Row.svelte";

  const sheetToIgnore = [
    "Checklist Questionnaire",
    "Explications - Toelichting",
    "Introduction - Introductie",
  ];

  let sheet = $state<{ label: string; value: string }[]>([]);

  workbook.subscribe((workbook) => {
    if (!workbook || !workbook.SheetNames) return;
    sheet = workbook.SheetNames.filter(
      (s: string) => !sheetToIgnore.includes(s),
    ).map((s: string) => ({ label: s, value: s }));
    // Auto-select the first usable sheet so the preview populates immediately.
    if (sheet.length) currentSheet.set(sheet[0].value);
  });

  // Persist which sections are open across reloads.
  type Panels = {
    source: boolean;
    output: boolean;
    columns: boolean;
    rows: boolean;
  };
  const defaultPanels: Panels = {
    source: true,
    output: true,
    columns: true,
    rows: false,
  };

  function loadPanels(): Panels {
    if (typeof localStorage === "undefined") return defaultPanels;
    try {
      return {
        ...defaultPanels,
        ...JSON.parse(localStorage.getItem("import-panels") ?? "{}"),
      };
    } catch {
      return defaultPanels;
    }
  }

  let panels = $state(loadPanels());

  $effect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("import-panels", JSON.stringify(panels));
    }
  });

  // Clearing the file sends the user back to the centered drop zone in the main area.
  function clearFile() {
    file.set(null);
    name.set("TAO");
    workbook.set(null);
    currentSheet.set("");
  }
</script>

<div class="menu-content hide-print">
  {#if $file}
    <div class="file-badge">
      <FileSpreadsheet size={15} />
      <span class="file-name" title={$file.name}>{$file.name}</span>
      <button
        class="file-clear"
        type="button"
        onclick={clearFile}
        aria-label="Change file"
      >
        <X size={14} />
      </button>
    </div>
  {:else}
    <p class="file-empty">No file loaded</p>
  {/if}

  <Section title="Source" bind:open={panels.source}>
    {#snippet icon()}<FileSpreadsheet size={15} />{/snippet}
    <Combobox choices={sheet} bind:value={$currentSheet} />
  </Section>

  <Section title="Output" bind:open={panels.output}>
    {#snippet icon()}<SlidersHorizontal size={15} />{/snippet}
    <!-- <RadioGroup
      legend="Format"
      choices={[
        { label: "CSV", value: "CSV" },
        { label: "PDF", value: "PDF" },
      ]}
      bind:value={$selectedFormat}
    /> -->
    <RadioGroup
      legend="Language"
      choices={[
        { label: "FR", value: "FR" },
        { label: "NL", value: "NL" },
        { label: "DE", value: "DE" },
      ]}
      bind:value={$langOutput}
    />
    <!-- <label class="switch-row">
      <span>Hide answers</span>
      <Switch bind:checked={$hideAnswer} />
    </label> -->
  </Section>

  <Section title="Column mapping" bind:open={panels.columns}>
    {#snippet icon()}<Columns3 size={15} />{/snippet}
    <Column />
  </Section>

  <Section title="Row layout" bind:open={panels.rows}>
    {#snippet icon()}<Rows3 size={15} />{/snippet}
    <Row />
  </Section>

  <div class="bottom">
    <Download />
  </div>
</div>

<style>
  .menu-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .file-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    color: var(--text);
  }

  .file-name {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 2px;
    border-radius: var(--radius);
    transition:
      color 0.15s,
      background 0.15s;
  }

  .file-clear:hover {
    color: var(--text);
    background: var(--surface);
  }

  .file-empty {
    margin: 0;
    padding: 4px 10px;
    font-size: 12px;
    font-style: italic;
    color: var(--text-muted);
  }

  .bottom {
    display: flex;
    flex-direction: column;
    margin-top: auto;
    width: 100%;
  }
</style>

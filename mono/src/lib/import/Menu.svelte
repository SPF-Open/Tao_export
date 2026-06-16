<script lang="ts">
  import Download from "./Input/Download.svelte";
  import DropZone from "./Input/DropZone.svelte";
  import RadioInput from "./Input/RadioInput.svelte";
  import { Combobox } from "$lib/ui";
  import {
    currentSheet,
    selectedFormat,
    hideAnswer,
    workbook,
    langOutput,
    followTemplate,
    templateList,
  } from "./helper/store";

  const sheetToIgnore = [
    "Checklist Questionnaire",
    "Explications - Toelichting",
    "Introduction - Introductie",
  ];

  import Column from "./menu/Column.svelte";
  import Row from "./menu/Row.svelte";
    import Switch from "$lib/ui/Switch.svelte";
  let sheet: { txt: string; selected: boolean }[] = $state();

  workbook.subscribe((workbook) => {
    if (!workbook || !workbook.SheetNames) return;
    sheet = workbook.SheetNames.map((s: string, n: number) => ({
      txt: s,
      selected: n === 0,
    })).filter(
      (s) => !sheetToIgnore.includes(s.txt)
    );
  });
</script>

<div class="menu-content hide-print">
  <DropZone />
  <div class="choiceSelection">
    <RadioInput
      title="Sheet"
      inputChoices={sheet}
      bind:choice={$currentSheet}
    />
    <RadioInput
      title="Format"
      inputChoices={[
        { txt: "CSV", selected: true },
        { txt: "PDF" },
      ]}
      bind:choice={$selectedFormat}
    />
    <fieldset class="switch-field">
      <legend class="switch-legend">Answer</legend>
      <label class="switch-label">
        <span>Hide</span>
        <Switch bind:checked={$hideAnswer} />
      </label>
    </fieldset>
    <RadioInput
      title="Langage"
      inputChoices={[{ txt: "FR" }, { txt: "NL" }, { txt: "DE" }]}
      bind:choice={$langOutput}
    />

    <Combobox
      legend="Template"
      choices={templateList.map((t) => ({ label: t.txt, value: t.value }))}
      bind:value={$followTemplate}
    />
  </div>
  <Row />
  <Column />
  <div class="bottom">
    <Download />
  </div>
</div>

<style>
  .menu-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .choiceSelection {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .choiceSelection :global(fieldset:first-child) {
    width: 100%;
  }
  .switch-field {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 6px 10px 8px 10px;
    margin: 0;
  }
  .switch-legend {
    padding: 0 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-muted);
    line-height: 1;
  }
  .switch-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--font-size-base);
    color: var(--text);
    cursor: pointer;
    user-select: none;
  }
  .bottom {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: auto;
    width: 100%;
    padding-top: 8px;
  }
</style>

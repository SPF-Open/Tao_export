<script lang="ts">
  import Download from "./Input/Download.svelte";
  import DropZone from "./Input/DropZone.svelte";
  import RadioInput from "./Input/RadioInput.svelte";
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

<div class="menu hide-print">
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
        // { txt: 'WORD', disabled: true },
        // { txt: 'PPTX', disabled: true },
        // { txt: 'QTI' },
      ]}
      bind:choice={$selectedFormat}
    />
    <RadioInput
      title="Answer"
      inputChoices={[
        { txt: "Show", selected: true, value: false },
        { txt: "Hide", selected: false, value: true },
      ]}
      bind:choice={$hideAnswer}
    />
    <RadioInput
      title="Langage"
      inputChoices={[{ txt: "FR" }, { txt: "NL" }, { txt: "DE" }]}
      bind:choice={$langOutput}
    />

    <RadioInput
      title="Template"
      inputChoices={templateList}
      bind:choice={$followTemplate}
    />
  </div>
  <Row />
  <Column />
  <div class="bottom">
    <Download />
  </div>
</div>

<style>
  .menu {
    z-index: 1;
    position: sticky;
    border: 2px dotted #00566b;
    padding: 10px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    min-height: 600px;
    height: fit-content;
    width: fit-content;
    max-width: 400px;
  }
  .choiceSelection {
    display: flex;
    max-width: 360px;
    flex-wrap: wrap;
  }
  .choiceSelection :global(fieldset:first-child) {
    width: 100%;
  }
  .menu .bottom {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: auto;
    width: 100%;
  }
</style>

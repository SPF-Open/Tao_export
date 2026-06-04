<script lang="ts">
  import { get } from "svelte/store";
  import * as XLSX from "xlsx";
  import Menu from "$lib/import/Menu.svelte";
  import PreviewTao from "$lib/import/preview/PreviewTAO.svelte";
  import {
    alternative,
    column_row,
    competencyColumn,
    correctColumn,
    currentSheet,
    dimensionColumn,
    file,
    hideAnswer,
    indicatorColumn,
    promptColumn,
    rowOffset,
    skipRow,
    titleColumn,
  } from "$lib/import/helper/store";
  import { QCM, Question } from "$lib/import/helper/question";

  let questions = $state<QCM[]>([]);
  let workbook = $state<XLSX.WorkBook | undefined>(undefined);

  const parseAndShow = () => {
    if (!workbook) return;
    questions = Question.parseSheet(
      workbook.Sheets[get(currentSheet)],
      {
        title: get(titleColumn),
        prompt: get(promptColumn),
        correct: get(correctColumn),
        competency: get(competencyColumn),
        dimension: get(dimensionColumn),
        indicator: get(indicatorColumn),
      },
      {
        offset: get(rowOffset),
        alternative: get(alternative),
        skipRow: get(skipRow),
      },
    );
  };

  file.subscribe(async (f) => {
    if (!f) return;
    questions = [];
    workbook = XLSX.read(await f.arrayBuffer());
  });

  column_row.subscribe(async () => {
    parseAndShow();
  });

  currentSheet.subscribe(async () => {
    parseAndShow();
  });
</script>

<main>
  <div class="left">
    <Menu />
  </div>
  <PreviewTao bind:QCMs={questions} bind:hideAnswer={$hideAnswer} />
</main>

<style>
  main {
    min-width: 1280px;
    display: flex;
    justify-items: center;
  }
  .left {
    width: 400px;
    margin: 50px 50px;
  }
  main :global(.questions) {
    width: calc(100% - 400px);
    margin: 50px 50px;
  }

  @media only screen and (max-width: 1280px) {
    .left :global(.menu) {
      position: relative;
    }
  }
  @media print {
    .left {
      display: none;
    }
    main :global(.questions) {
      width: 80%;
    }
  }
</style>

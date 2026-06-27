<script lang="ts">
  import { get } from "svelte/store";
  import * as XLSX from "xlsx";
  import Menu from "$lib/import/Menu.svelte";
  import QuestionPreview from "$lib/export/template/Question.svelte";
  import { showAnswer } from "$lib/export/store";
  import type { AssessmentItem } from "$lib/questions/types.js";
  import DropZone from "$lib/import/Input/DropZone.svelte";
  import {
    alternative,
    column_row,
    competencyColumn,
    correctColumn,
    currentSheet,
    file,
    hideAnswer,
    indicatorColumn,
    competencyDescrColumn,
    masteryDescrColumn,
    promptColumn,
    rowOffset,
    skipRow,
    titleColumn,
  } from "$lib/import/helper/store";
  import { QCM, Question } from "$lib/import/helper/question";
  import { qcmsToAssessmentItems } from "$lib/import/helper/toQuestionType";
  import { EmptyState, SidebarLayout } from "$lib/ui";
  import { FileSpreadsheet } from "lucide-svelte";

  let questions = $state<QCM[]>([]);
  let renderItems = $state<AssessmentItem[]>([]);
  let itemVisibility = $state<Map<string, boolean>>(new Map());
  let workbook = $state<XLSX.WorkBook | undefined>(undefined);

  $effect(() => {
    renderItems = qcmsToAssessmentItems(questions);
    itemVisibility = new Map();
  });

  // Keep the shared renderer's answer visibility in sync with the import-side
  // "hide answers" toggle (Question.svelte / QCM.svelte read the export store).
  $effect(() => {
    showAnswer.set(!$hideAnswer);
  });

  const parseAndShow = () => {
    if (!workbook) return;
    questions = Question.parseSheet(
      workbook.Sheets[get(currentSheet)],
      {
        title: get(titleColumn),
        prompt: get(promptColumn),
        correct: get(correctColumn),
        competency: get(competencyColumn),
        indicator: get(indicatorColumn),
        competencyDescr: get(competencyDescrColumn),
        masteryDescr: get(masteryDescrColumn),
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

<svelte:head>
  <title>Import — TAO</title>
  <meta name="description" content="Import raw exam data from Excel and normalize it into a TAO export." />
</svelte:head>

<SidebarLayout sidebarLabel="Import settings">
  {#snippet sidebar()}
    <Menu />
  {/snippet}

  <div class="import-main">
    {#if $file}
      <div class="questions-container">
        {#each renderItems as item}
          {@const show = itemVisibility.get(item.id) !== false}
          <QuestionPreview
            {item}
            {show}
            onToggleShow={(s) => { itemVisibility.set(item.id, s); itemVisibility = new Map(itemVisibility); }}
          />
        {/each}
      </div>
    {:else}
      <div class="dropzone-center">
        <EmptyState
          icon={FileSpreadsheet}
          title="Import a question file"
          description="Upload an Excel workbook to generate a TAO export."
        >
          {#snippet children()}
            <div class="dropzone-inner">
              <DropZone />
            </div>
          {/snippet}
        </EmptyState>
      </div>
    {/if}
  </div>
</SidebarLayout>

<style>
  .import-main {
    min-width: 0;
    overflow-x: auto;
  }

  .questions-container {
    max-width: 1080px;
    margin: 0 auto;
  }

  .dropzone-center {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - var(--layout-header-height) - 32px);
  }

  .dropzone-inner {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
  }

  .dropzone-inner :global(.files-area) {
    padding: 36px 16px;
  }
</style>

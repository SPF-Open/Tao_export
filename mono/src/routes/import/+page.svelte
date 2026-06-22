<script lang="ts">
  import { get } from "svelte/store";
  import * as XLSX from "xlsx";
  import Menu from "$lib/import/Menu.svelte";
  import PreviewTao from "$lib/import/preview/PreviewTAO.svelte";
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
  import { sidebarEnabled, sidebarOpen } from "$lib/sidebar";

  let questions = $state<QCM[]>([]);
  let workbook = $state<XLSX.WorkBook | undefined>(undefined);

  $effect(() => {
    sidebarEnabled.set(true);
    return () => sidebarEnabled.set(false);
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

<main>
  <div class="content" class:sidebar-open={$sidebarOpen}>
    {#if $sidebarOpen}
      <aside class="sidebar">
        <div class="sidebar-content">
          <Menu />
        </div>
      </aside>
    {/if}

    <div class="main-area">
      {#if $file}
        <PreviewTao bind:QCMs={questions} bind:hideAnswer={$hideAnswer} />
      {:else}
        <div class="dropzone-center">
          <div class="dropzone-inner">
            <h2>Import a question file</h2>
            <p>Upload an Excel workbook to generate a TAO export.</p>
            <DropZone />
          </div>
        </div>
      {/if}
    </div>
  </div>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - var(--layout-header-height));
  }

  .content {
    display: flex;
    flex: 1;
    min-height: calc(100vh - var(--layout-header-height));
  }

  .sidebar {
    position: sticky;
    top: var(--layout-header-height);
    height: calc(100vh - var(--layout-header-height));
    width: var(--sidebar-width);
    background: var(--surface);
    border-right: 1px solid var(--border);
    box-shadow: var(--shadow-lg);
    z-index: 50;
    overflow-y: auto;
    scrollbar-gutter: stable;
    flex-shrink: 0;
  }

  .sidebar-content {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 100%;
  }

  .main-area {
    flex: 1;
    padding: 16px;
    min-width: 0;
    overflow-x: auto;
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
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: center;
  }

  .dropzone-inner h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text);
  }

  .dropzone-inner p {
    margin: 0 0 12px 0;
    font-size: 13px;
    color: var(--text-muted);
  }

  .dropzone-inner :global(.files-area) {
    padding: 36px 16px;
  }

  @media print {
    .sidebar {
      display: none !important;
    }
    .main-area {
      padding: 0;
    }
  }
</style>

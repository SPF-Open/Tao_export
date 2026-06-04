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
  <div class="content" class:sidebar-open={$sidebarOpen}>
    {#if $sidebarOpen}
      <aside class="sidebar">
        <div class="sidebar-content">
          <Menu />
        </div>
      </aside>
    {/if}

    <div class="main-area">
      <PreviewTao bind:QCMs={questions} bind:hideAnswer={$hideAnswer} />
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
    padding: 16px;
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

  @media print {
    .sidebar {
      display: none !important;
    }
    .main-area {
      padding: 0;
    }
  }
</style>

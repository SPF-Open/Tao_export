<script lang="ts">
  import { slide } from "svelte/transition";
  import Settings from "./lib/Settings.svelte";
  import Tables from "./lib/Tables.svelte";
  import ZipInput from "./lib/ZipInput.svelte";
  import Question from "./template/Question.svelte";

  import "./app.css";

  import {
    compareMode,
    showMenu,
    questions,
    oldQuestions,
    inzage,
    zoom,
    multiple,
    merge,
    examsIndex,
    exams,
    windowName,
  } from "./store";
  import Log from "./lib/Log.svelte";

  import "@gzlab/uui/main.css";
  import { Switch, Text } from "@gzlab/uui";
  import { get } from "svelte/store";
  import MaintenanceOverlay from "./lib/MaintenanceOverlay.svelte";
  let titleHeader = "";
  let rrnHeader = "";

  function moveIndex(n: number) {
    const maxLength = get(exams).length - 1;
    if (!maxLength) return;
    examsIndex.update((i) => {
      i += n;
      if (i < 0) i = maxLength;
      if (i > maxLength) i = 0;
      return i;
    });
  }
</script>

<svelte:head>
    <title>{$windowName}</title> 
</svelte:head>

<MaintenanceOverlay endTime={new Date('2026-01-17')} />
<main>
  <header class="hide-print">
    <div class="left">
      <span>Tao Export</span>
      <span>---</span>
      <span>Menu</span>
      <Switch bind:checked={$showMenu} />
    </div>
    <div class="middle">
      {#if $multiple && !$merge}
        <button onclick={() => moveIndex(-1)}> {"<"} </button>
        <span>{$examsIndex}</span>
        <button onclick={() => moveIndex(+1)}> {">"} </button>
      {/if}
    </div>
    <div class="right">
      <a href="/documentation.pdf" target="_blank">Documentation</a>
      <a
        href="https://github.com/SPF-Open/Tao_export/blob/Prod/CHANGELOG.md"
        target="_blank"
      >
        Changelog
      </a>
    </div>
  </header>

  <Log />
  <div class="hero">
    {#if $showMenu}
      <div class="left hide-print" >
        <Settings />
        <ZipInput />
        <Tables />
      </div>
    {/if}
    <div class="questions" style="zoom:{$zoom};">
      {#if $inzage}
        <div class="header hide-print">
          <Text bind:value={titleHeader} placeholder="Test name" />
          <Text bind:value={rrnHeader} placeholder="RRN" />
        </div>
        <div class="header show-print">
          <p class="show-print">{titleHeader}</p>
          <p class="show-print">{rrnHeader}</p>
        </div>
      {/if}

      {#if $questions.length > 0}
        {#each $questions as question}
          <Question {question} />
        {/each}
      {/if}
    </div>
    {#if $oldQuestions.length > 0 && $compareMode}
      <div class="questions">
        {#each $oldQuestions as question}
          <Question {question} />
        {/each}
      </div>
    {/if}
  </div>

  <footer class="hide-print">
    <div class="left">
      <span>&copy;Benoit-Welsch</span>
      <span class="version">v{PKG.version}</span>
    </div>
    <div class="right">
      <!-- svelte-ignore missing-declaration -->
      <!-- svelte-ignore missing-declaration -->
      <span class="build-time">Build time : {BUILD_DATE}</span>
    </div>
  </footer>
</main>

<style>
  header {
    display: flex;
    flex-wrap: wrap;
    position: sticky;
    gap: 0.3rem;
    top: 0;
    padding: 0.3rem;
    font-weight: bold;
    background-color: var(--bg);
  }

  header > * {
    display: inline-flex;
    flex-wrap: nowrap;
    width: fit-content;
    gap: 0.3rem;
  }

  .middle {
    flex: 1;
    margin: auto;
    display: flex;
    justify-content: center;
  }

  header > .right {
    margin-left: auto;
  }

  footer {
    font-size: 0.8rem;
    background-color: var(--bg);
    position: sticky;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    padding: 0.3rem;
    font-weight: bold;
    bottom: 0;
  }

  footer .right {
    margin-left: auto;
  }

  main {
    min-height: 100vh;
  }

  .hero {
    display: flex;
    grid-auto-flow: column;
  }

  .hero .left {
    position: sticky;
    display: flex;
    flex-direction: column;
    top: 30px;
    gap: 0.6rem;
    max-width: 350px;
    height: 91vh;
    overflow-y: auto;
    flex: 1;
    padding: 0 5px;
  }

  .hero .left > :global(*) {
    font-size: 0.95rem;
  }

  .questions > .header {
    padding: 5px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-evenly;
  }

  .questions > .header > * {
    margin: auto;
  }

  @media print {
    header {
      background-color: #ddd;
      display: none;
    }
    .left {
      display: none;
    }
  }
</style>

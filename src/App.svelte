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
  } from "./store";
  import Log from "./lib/Log.svelte";

  import "@gzlab/uui/main.css"
  import { Switch, Text } from "@gzlab/uui";

  let titleHeader = "";
  let rrnHeader = "";
</script>

<header class="hide-print">
  <div class="left">
    <span>Tao Export</span>
    <span>---</span>
    <span>Menu</span>
    <Switch bind:checked={$showMenu} />
  </div>
  <div class="right">
    <a href="/documentation.pdf" target="_blank">Documentation</a>
    <a
      href="https://github.com/SPF-Open/Tao_export/blob/Prod/CHANGELOG.md"
      target="_blank">Changelog</a
    >
  </div>
</header>

<Log />
<main>
  {#if $showMenu}
    <div class="left hide-print" transition:slide>
      <Settings />
      <div class="input">
        <ZipInput />
      </div>
      <div class="nb-questions hide-print">
        <span class="QO">
          QO : {$questions.filter((q) => q.type === "QO").length}
          ({$questions.filter((q) => q.type === "Instruction QO" && q.show)
            .length})
        </span>
        <span class="QCM">
          QCM : {$questions.filter((q) => q.type === "QCM").length}
          ({$questions.filter((q) => q.type === "QCM" && q.show).length})
        </span>
      </div>
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
        <Question bind:question />
      {/each}
    {/if}
  </div>
  {#if $oldQuestions.length > 0 && $compareMode}
    <div class="questions">
      {#each $oldQuestions as question}
        <Question bind:question />
      {/each}
    </div>
  {/if}
</main>

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

<style>
  header {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    padding: 5px;
    font-weight: bold;
  }

  header > * {
    display: inline-flex;
    flex-wrap: nowrap;
    align-items: center;
    width: fit-content;
    gap: 5px;
  }

  header > .right {
    margin-left: auto;
    justify-content: center;
  }

  header > .left > span {
    position: relative;
    top: -4px;
  }

  footer {
    font-size: 0.8rem;
    background-color: var(--bg);
    position: sticky;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    padding: 5px;
    font-weight: bold;
    bottom: 0;
  }

  footer .left {
    margin-right: auto;
  }

  footer .right {
    margin-left: auto;
  }

  main {
    display: grid;
    grid-auto-flow: column;
    min-height: 100vh;

  }

  .input {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: fit-content;
  }

  main .left {
    position: sticky;
    display: flex;
    flex-direction: column;
    top: 0;
    max-width: 300px;
    height: 90vh;
    max-height: 100vh;
    padding: 5px;
  }

  main .left > * {
    margin-top: 5px;
  }

  main .left > :global(*) {
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

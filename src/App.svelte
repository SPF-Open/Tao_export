<script lang="ts">
  import { writable } from 'svelte/store';
  import { slide } from 'svelte/transition';
  import Settings from './lib/Settings.svelte';
  import Tables from './lib/Tables.svelte';
  import ZipInput from './lib/ZipInput.svelte';
  import type { QuestionType } from './lib/helper';
  import Question from './template/Question.svelte';

  let showLeft = true;

  let hideAnswer;
  let showInstruction = writable(true);
  let showLetter;
  let compare;
  let inzage;
  let sort;

  let questions: QuestionType[] = [];
  let oldQuestions = questions;

  const copyQuestion = () => {
    oldQuestions = [...questions];
  };

  const resetSettings = () => {
    hideAnswer = false;
    showInstruction.set(true);
    showLetter = false;
    inzage = false;
    sort = false;
  };

  const sortQuestions = () => {
    copyQuestion();
    questions = questions.sort((a, b) => {
      if (a.type.includes('Instruction') || a.type === 'Instruction QCM')
        return 1;
      // sort by number find after QO and QCM
      const aNumber = a.title.match(/\d+/);
      const bNumber = b.title.match(/\d+/);
      if (aNumber && bNumber) {
        return Number(aNumber[0]) - Number(bNumber[0]);
      }
      return 0;
    });
  };

  $: if (compare) copyQuestion();

  $: if (sort) sortQuestions();

  $: if (!sort && oldQuestions.length > 0) questions = oldQuestions;

  showInstruction.subscribe((showInstruction) => {
    questions = questions.map((q) => ({
      ...q,
      show:
        q.type === 'Instruction' ||
        q.type === 'Instruction QCM' ||
        q.type === 'Instruction QO'
          ? showInstruction
          : q.show,
    }));
  });
</script>

<header>
  <div class="copy">&copy;Benoit-Welsch - 02-2023</div>
  <div class="doc">
    <a href="/documentation.pdf" target="_blank">Documentation</a>
  </div>
  <!-- svelte-ignore missing-declaration -->
  <!-- eslint-disable no-undef -->
  <div class="version">v{VITE_PKG.version}</div>
  <!--eslint-enable-->
  <div>
    <a
      href="https://github.com/SPF-Open/Tao_export/blob/Prod/CHANGELOG.md"
      target="_blank">CHANGELOG</a
    >
  </div>
</header>

<main>
  <button class="controlLeft hide-print" on:click={() => (showLeft = !showLeft)}
    >></button
  >
  {#if showLeft}
    <div class="left" transition:slide>
      <div class="settings">
        <Settings
          bind:hideAnswer
          bind:showInstruction={$showInstruction}
          bind:showLetter
          bind:compare
          bind:inzage
          bind:sort
        />
      </div>
      <div class="input">
        <ZipInput bind:questions onInput={resetSettings} />
      </div>
      <div class="nb-questions hide-print">
        <span class="QO">
          QO : {questions.filter((q) => q.type === 'QO').length}
          ({questions.filter((q) => q.type === 'Instruction QO' && q.show)
            .length})
        </span>
        <span class="QCM">
          QCM : {questions.filter((q) => q.type === 'QCM').length}
          ({questions.filter((q) => q.type === 'QCM' && q.show).length})
        </span>
      </div>
      <Tables bind:questions />
    </div>
  {/if}

  <div class="questions">
    {#if questions.length > 0}
      {#each questions as question}
        <Question bind:question bind:hideAnswer bind:showLetter bind:inzage />
      {/each}
    {/if}
  </div>
  {#if oldQuestions.length > 0 && compare}
    <div class="questions">
      {#each oldQuestions as question}
        <Question bind:question bind:hideAnswer bind:showLetter bind:inzage />
      {/each}
    </div>
  {/if}
</main>

<style>
  header {
    top: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    border: 1px solid var(--border-color);
  }

  main {
    display: grid;
    grid-auto-flow: column;
  }

  .controlLeft {
    position: absolute;
    top: 0;
  }

  .input {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: fit-content;
  }

  .left {
    position: sticky;
    top: 0;
    max-width: 320px;
    max-height: 100vh;
    padding: 5px;
  }

  .left > * {
    margin-bottom: 5px;
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

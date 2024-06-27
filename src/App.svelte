<script lang="ts">
  import { slide } from 'svelte/transition';
  import Settings from './lib/Settings.svelte';
  import Tables from './lib/Tables.svelte';
  import ZipInput from './lib/ZipInput.svelte';
  import Question from './template/Question.svelte';

  import { ThemeWrapper, ToggleSwitch } from '@lv00/sveltelib';
  import { compareMode, showMenu, questions, oldQuestions, inzage } from './store';
  import Log from './lib/Log.svelte';

  let titleHeader = '';
  let rrnHeader = '';

</script>

<header>
  <div class="copy">&copy;Benoit-Welsch - 02-2023</div>
  <div class="doc">
    <a href="/documentation.pdf" target="_blank">Documentation</a>
  </div>
  <!-- svelte-ignore missing-declaration -->
  <div class="version">v{PKG.version}</div>
  <div>
    <a
      href="https://github.com/SPF-Open/Tao_export/blob/Prod/CHANGELOG.md"
      target="_blank">CHANGELOG</a
    >
  </div>
</header>

<ThemeWrapper>
<Log />
  <main>
    <h4 class="controlLeft hide-print">
      <span>Menu</span>
      <ToggleSwitch bind:checked={$showMenu} />
    </h4>
    {#if $showMenu}
      <div class="left" transition:slide>
        <Settings />
        <div class="input">
          <ZipInput />
        </div>
        <div class="nb-questions hide-print">
          <span class="QO">
            QO : {$questions.filter((q) => q.type === 'QO').length}
            ({$questions.filter((q) => q.type === 'Instruction QO' && q.show)
              .length})
          </span>
          <span class="QCM">
            QCM : {$questions.filter((q) => q.type === 'QCM').length}
            ({$questions.filter((q) => q.type === 'QCM' && q.show).length})
          </span>
        </div>
        <Tables />
      </div>
    {/if}

    <div class="questions">
      {#if $inzage}
      <div class="header">
        <input type="text" bind:value={titleHeader} class="hide-print" placeholder="Test name">
        <p class="show-print">{titleHeader}</p>
        <input type="text" bind:value={rrnHeader} class="hide-print" placeholder="RRN">
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
</ThemeWrapper>

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
    margin: 0;
    padding: 0;
    display: flex;
    gap: 5px;
  }

  .input {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: fit-content;
  }

  .left {
    position: sticky;
    display: flex;
    flex-direction: column;
    top: 0;
    max-width: 300px;
    max-height: 100vh;
    padding: 5px;
  }

  .left > * {
    margin-top: 5px;
  }

  .left > :global(*) {
    font-size: 0.95rem;
  }

  .questions > .header {
    padding: 5px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: center;
  }

  .questions > .header > *{
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

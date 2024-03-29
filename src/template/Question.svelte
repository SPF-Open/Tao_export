<script lang="ts">
  import type { QuestionType } from '../lib/helper';
  import Qcm from './QCM.svelte';
  export let question: QuestionType;

  let questionDom;
</script>

{#if question.show}
  <div
    class="question"
    bind:this={questionDom}
    class:hidePrint={!question.show}
    style="page-break-inside: avoid !important; break-inside: avoid;"
  >
    <div class="title">
      <input
        class="hide-print"
        type="checkbox"
        bind:checked={question.show}
      />{question.title}
    </div>
    <div
      class="prompt"
      class:grid-row={question.type.includes('Instruction')}
    >
      {#each question.prompt as prompt, i}
        {@html prompt.innerHTML}
        <p class="maxChar">
          {question.type == 'QO' && (question.maxLenght && question.maxLenght[i])
            ? question.maxLenght[i] + ' caractères maximum.' || ''
            :  ''}
        </p>
      {/each}
    </div>

    {#if question.type === 'QCM' || question.type === 'Instruction QCM'}
      <Qcm bind:question/>
    {/if}
  </div>
{/if}

<style>
  @media print {
    div {
      break-inside: avoid;
    }
  }

  .grid-row {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  .question {
    font-family: 'Source Sans Pro';
    border: 3px solid #007f9f;
    margin: 30px 10px;
    max-width: 1080px;
    line-height: 1.4;
    font-size: 13px;
  }

  .title {
    padding: 1px 0px 3px 5px;
    background-color: #007f9f;
    color: white;
    font-size: 16px;
    font-weight: bold;
    height: fit-content;
  }

  .prompt {
    padding: 0 0 0 8px;
    margin: 5px 0;
  }

  .prompt :global(img) {
    max-height: calc(297mm - 100px);
    max-width: 98%;
  }

  .maxChar{
    margin-bottom: 10px;
  }
</style>

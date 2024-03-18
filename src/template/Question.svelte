<script lang="ts">
  import type { QuestionType } from '../lib/helper';
  import { inzage, showAnswer, showLetter } from '../store';
  export let question: QuestionType;

  let questionDom;
  let inzageSelection = -1;

  $: inzage.subscribe(() => {
    inzageSelection = -1;
  });

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
      class={`prompt ${
        question.type.includes('Instruction') ? 'grid-row' : ''
      }`}
    >
      {#each question.prompt as prompt, i}
        <!-- eslint-disable svelte/no-at-html-tags -->
        {@html prompt.innerHTML}
        <p class="maxChar">
          {question.type == 'QO' && (question.maxLenght && question.maxLenght[i])
            ? question.maxLenght[i] + ' caractères maximum.' || ''
            :  ''}
        </p>
        <!--eslint-enable-->
      {/each}
    </div>

    {#if question.type === 'QCM' || question.type === 'Instruction QCM'}
      <ul
        class="answers"
        style={$showLetter
          ? '--answerStyle:upper-alpha; --answerCorrectStyle:upper-alpha;'
          : '--answerStyle:circle; --answerCorrectStyle:disc;'}
      >
        {#each question.answers as answer, n}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
          <li 
            class:correct={(answer.correct && $showAnswer && !$inzage) ||
              (inzage && inzageSelection === n)}
            class="answer"
            class:inzage
            on:click={() => {
              inzageSelection = n;
            }}
          >
            <div class="text">
              <!-- eslint-disable svelte/no-at-html-tags -->
              {@html answer.txt}
              <!--eslint-enable-->
            </div>
            {#if $showAnswer}
              <div class="points">{answer.point || 0}</div>
            {/if}
          </li>
        {/each}
      </ul>
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

  .answers {
    margin: 0;
    display: flex;
    flex-direction: column;
    border: 6px solid #f5f4f2;
    padding: 5px;
    padding-left: 20px;
    list-style: var(--answerStyle);
  }

  .answer {
    position: relative;
    padding: 10px;
    font-weight: bold;
  }

  .answer.correct {
    list-style-type: var(--answerCorrectStyle);
  }
  .answer.correct.inzage {
    text-decoration: underline;
  }

  .answer .points {
    position: absolute;
    font-weight: bold;
    right: -22px;
    top: 0;
    border: 2px solid #266d9c;
    padding: 2px 3px;
    background-color: white;
    width: 12px;
    text-align: center;
  }

  .maxChar{
    margin-bottom: 10px;
  }
</style>

<script lang="ts">
  import type { QuestionType } from '../lib/helper';
  import { showLetter, showAnswer, inzage } from '../store';

  export let question: QuestionType;

  let inzageSelection = -1;

  $: inzage.subscribe(() => {
    inzageSelection = -1;
  });
</script>

<ul class="answers" class:alpha={$showLetter}>
  {#each question.answers as answer, n}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <li
      class:correct={(answer.correct && $showAnswer && !$inzage) ||
        (inzage && inzageSelection === n)}
      class="answer"
      on:click={() => {
        inzageSelection = $inzage && !answer.correct ? n : -1;
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

<style>
  .answers {
    margin: 0;
    display: flex;
    flex-direction: column;
    border: 6px solid #f5f4f2;
    padding: 5px;
    padding-left: 20px;
    list-style: circle;
  }

  .answer {
    position: relative;
    padding: 10px;
    font-weight: bold;
  }

  .alpha {
    list-style: upper-alpha;
  }

  .correct {
    list-style-type: disc;
    text-decoration: underline;
  }

  .points {
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
</style>

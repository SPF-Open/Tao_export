<script lang="ts">
  import type { QuestionType } from '../lib/helper';
  import { showLetter, showAnswer, inzage } from '../store';

  export let question: QuestionType;

  let inzageSelection = -1;

  $: inzage.subscribe(() => {
    inzageSelection = -1;
  });

  const onClick = (n: number) => {
    if (inzageSelection == n) {
      inzageSelection = -1;
    }
    else if ($inzage && !question.answers[n].correct) {
      inzageSelection = n;
    }
  };
</script>

<ul class="answers" class:alpha={$showLetter}>
  {#each question.answers as answer, n}
    {@const { txt, point, correct } = answer}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <li
      class:correct={(correct && $showAnswer && !$inzage) ||
        (inzage && inzageSelection === n)}
      class="answer"
      on:click={() => onClick(n)}
    >
      <div class="answer-indicator">
        {$showLetter ? String.fromCharCode(65 + n) : n + 1}
      </div>
      <div class="answer-text">
        {@html txt}
      </div>
      {#if $showAnswer}
        <div class="points">{point || 0}</div>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .answers {
    margin: 0;
    padding: 8px 16px 16px;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .answer {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    transition: all 0.15s;
  }

  .answer:hover {
    background: color-mix(in srgb, var(--accent) 5%, var(--surface));
    border-color: var(--border-strong);
  }

  .alpha .answer {
    list-style: none;
  }

  .correct {
    background: color-mix(in srgb, var(--success) 15%, var(--surface));
    border-color: var(--success);
  }

  .answer-indicator {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--border);
    border-radius: var(--radius);
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
  }

  .correct .answer-indicator {
    background: var(--success);
    color: var(--success-foreground);
  }

  .answer-text {
    flex: 1;
    font-size: 14px;
    line-height: 1.5;
    color: var(--text);
  }

  .answer-text :global(img) {
    max-width: 100%;
    border-radius: var(--radius);
    margin: 8px 0;
  }

  .points {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0 8px;
    background: var(--accent);
    color: var(--accent-foreground);
    border-radius: var(--radius);
    font-size: 12px;
    font-weight: 600;
  }

  .correct .points {
    background: var(--success);
    color: var(--success-foreground);
  }
</style>

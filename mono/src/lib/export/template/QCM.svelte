<script lang="ts">
  import { run } from 'svelte/legacy';
  import type { AssessmentItem } from '$lib/questions/types.js';
  import { showLetter, showAnswer, inzage } from '../store';

  interface Props {
    item: AssessmentItem;
  }

  let { question = $bindable() }: Props = $props();

  let inzageSelection = $state(-1);

  run(() => {
    inzage.subscribe(() => {
      inzageSelection = -1;
    });
  });

  const onClick = (n: number) => {
    const options = item.responses?.[0]?.options ?? [];
    if (inzageSelection == n) {
      inzageSelection = -1;
    } else if ($inzage && !options[n]?.correct) {
      inzageSelection = n;
    }
  };

  function getScore(optId: string): number | string {
    const mapping = item.responses?.[0]?.mapping;
    if (mapping && optId in mapping) return mapping[optId];
    const scoring = item.scoring?.rules?.find(r => r.answerId === optId);
    return scoring?.score ?? 0;
  }
</script>

<ul class="answers" class:alpha={$showLetter}>
  {#each item.responses?.[0]?.options ?? [] as option, n}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <li
      class:correct={(option.correct && $showAnswer && !$inzage) ||
        ($inzage && inzageSelection === n)}
      class="answer"
      onclick={() => onClick(n)}
    >
      <div class="answer-indicator">
        {$showLetter ? String.fromCharCode(65 + n) : n + 1}
      </div>
      <div class="answer-text">
        {@html option.content.html ?? option.content.text ?? ''}
      </div>
      {#if $showAnswer}
        <div class="points">{getScore(option.id)}</div>
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
    background: #111827;
    color: #ffffff;
    border-radius: var(--radius);
    font-size: 12px;
    font-weight: 600;
  }

  .correct .points {
    background: var(--success);
    color: var(--success-foreground);
  }
</style>

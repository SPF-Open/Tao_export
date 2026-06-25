<script lang="ts">
  import { Card } from "$lib/ui";
  import type { Alternative } from "$lib/iat/store";

  let { alternative }: { alternative: Alternative } = $props();
</script>

<Card status={alternative.isCorrect ? "success" : undefined}>
  {#snippet title()}
    <span>Alt {alternative.choiceId}</span>
    {#if alternative.isCorrect}<span class="correct-badge">Correct</span>{/if}
  {/snippet}
  <div class="alt-grid">
    <div class="text-cell"><span class="label">Text</span><span>{alternative.text}</span></div>
    <div><span class="label">%</span><span>{alternative.pct}%</span></div>
    <div><span class="label">Answers</span><span>{alternative.nAnswers} / {alternative.nCandidates}</span></div>
    <div><span class="label">D-Idx Comp</span><span>{alternative.discr_comp}</span></div>
    <div><span class="label">D-Idx Test</span><span>{alternative.discr_test}</span></div>
  </div>
</Card>

<style>
  .alt-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
    gap: 0.5rem 1rem;
    align-items: start;
  }
  .alt-grid > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
  }
  .correct-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: var(--radius);
    background-color: var(--success);
    color: var(--success-foreground);
  }
</style>

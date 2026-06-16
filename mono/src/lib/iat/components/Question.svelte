<script lang="ts">
  import { Card } from "$lib/ui";
  import type { Question } from "$lib/iat/store";
  import Alternative from "./Alternative.svelte";

  let { question }: { question: Question } = $props();
</script>

<Card>
  {#snippet title()}
    <span>Question {question.itemRank}</span>
    <span class="meta">{question.testCode} — {question.diplome}</span>
  {/snippet}
  <div class="q-grid">
    <div><span class="label">Candidates</span><span>{question.nCandidates}</span></div>
    <div><span class="label">Procedures</span><span>{question.nProcedures}</span></div>
    <div><span class="label">Correct</span><span>{question.correct_pct}%</span></div>
    <div><span class="label">Incorrect</span><span>{question.incorrect_pct}%</span></div>
    <div><span class="label">Empty</span><span>{question.empty_pct}%</span></div>
    <div><span class="label">Not seen</span><span>{question.not_seen_pct}%</span></div>
    <div><span class="label">Answered</span><span>{question.answered_pct}%</span></div>
    <div><span class="label">Difficulty</span><span>{question.difficulty}</span></div>
    <div><span class="label">Discr Comp</span><span>{question.discr_comp}</span></div>
    <div><span class="label">Discr Test</span><span>{question.discr_test}</span></div>
    <div><span class="label">D-Index Comp</span><span>{question.d_index_comp}</span></div>
    <div><span class="label">D-Index Test</span><span>{question.d_index_test}</span></div>
    <div><span class="label">Alpha Drop</span><span>{question.alpha_drop_test}</span></div>
  </div>
  <div class="alternatives">
    <h4>Alternatives</h4>
    {#each question.alternatives as alternative}
      <Alternative {alternative} />
    {/each}
  </div>
</Card>

<style>
  .meta {
    font-size: 12px;
    font-weight: 400;
    color: var(--text-muted);
  }
  .q-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem 1rem;
    margin-bottom: 0.75rem;
  }
  .q-grid > div {
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
  .alternatives {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-top: 0.5rem;
  }
  h4 {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text);
    margin: 0 0 0.4rem;
  }
</style>
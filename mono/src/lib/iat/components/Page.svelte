<script lang="ts">
  import { Card } from "$lib/ui";
  import type { PageInfo } from "$lib/iat/store";
  import Question from "./Question.svelte";

  let { page }: { page: PageInfo } = $props();
</script>

<Card>
  {#snippet title()}
    <span>Page {page.page}</span>
  {/snippet}
  <div class="page-grid">
    <div><span class="label">Instruction</span><span>{page.instruction ? "Yes" : "No"}</span></div>
    <div><span class="label">Mean</span><span>{page.duration.mean}s</span></div>
    <div><span class="label">SD</span><span>{page.duration.sd}s</span></div>
    <div><span class="label">Q10</span><span>{page.duration.q10}s</span></div>
    <div><span class="label">Q25</span><span>{page.duration.q25}s</span></div>
    <div><span class="label">Q50</span><span>{page.duration.q50}s</span></div>
    <div><span class="label">Q75</span><span>{page.duration.q75}s</span></div>
    <div><span class="label">Q90</span><span>{page.duration.q90}s</span></div>
  </div>
  <div class="questions">
    <h3>Questions</h3>
    {#each page.questions as question}
      <Question {question} />
    {/each}
  </div>
</Card>

<style>
  .page-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem 1rem;
    margin-bottom: 1rem;
  }
  .page-grid > div {
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
  .questions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  h3 {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text);
    margin: 0 0 0.5rem;
  }
</style>
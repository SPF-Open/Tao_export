<script lang="ts">
  import { Card } from "$lib/ui";
  import { pagesData, testInfo } from "$lib/iat/store";

  function getAlternativeMinimapClass(alt: { pct: number } | undefined): string {
    if (!alt || typeof alt.pct !== "number") return "";
    if (alt.pct < 25) return "heat-low";
    if (alt.pct < 50) return "heat-medium";
    return "heat-high";
  }

  let rows = $derived(
    $pagesData
      ? Object.values($pagesData).flatMap((page) =>
          page.questions.map((question) => ({
            ...question,
            page: page.page ?? "",
            instruction: page.instruction,
            duration_mean: page.duration?.mean,
            duration_sd: page.duration?.sd,
          }))
        )
      : []
  );
</script>

<div class="summary">
  {#if $testInfo}
    <div class="tests-row">
      {#each $testInfo as info}
        <Card>
          {#snippet title()}{info.name}{/snippet}
          <div class="diplomes">
            {#each info.diplome as diplome}
              <Card>
                {#snippet title()}{diplome.name}{/snippet}
                <div class="stat-row"><span class="label">Questions</span><span>{diplome.questionNb}</span></div>
                <div class="stat-row"><span class="label">Candidates</span><span>{diplome.candidateNb}</span></div>
              </Card>
            {/each}
          </div>
        </Card>
      {/each}
    </div>
  {/if}

  <Card>
    {#snippet title()}Questions Overview — {rows.length} questions{/snippet}
    <div class="alt-minimap">
      <p class="minimap-legend">
        <span class="dot heat-low"></span>Low (&lt;25%)
        <span class="dot heat-medium"></span>Medium (25–50%)
        <span class="dot heat-high"></span>High (&gt;50%)
      </p>
      {#each [0, 1, 2, 3] as altIndex}
        <div class="alt-minimap-row">
          {#each rows as row}
            <div
              class="alt-minimap-square {getAlternativeMinimapClass(row.alternatives?.[altIndex])}"
              title={row.alternatives?.[altIndex]
                ? `Alt ${altIndex + 1}: ${row.alternatives[altIndex].pct?.toFixed(1)}%`
                : ""}
            ></div>
          {/each}
        </div>
      {/each}
    </div>
  </Card>
</div>

<div class="flex-h">
  {#if $testInfo}
    <div class="flex-h">
      {#each $testInfo as info}
        <Card size="md">
          <span slot="title">{info.name}</span>
          <div class="flex-h tests">
            {#each info.diplome as diplome}
              <Card>
                <span slot="title">{diplome.name}</span>
                <p>Question : {diplome.questionNb}</p>
                <p>Candidate : {diplome.candidateNb}</p>
              </Card>
            {/each}
          </div>
        </Card>
      {/each}
    </div>
  {/if}

  <Card size="lg">
    <span slot="title">Questions Overview</span>
    <p>Total Questions: {rows.length}</p>
    <!-- Alternative Heat Minimap using rows data -->
    <div class="alt-minimap">
      <h4>Alternatives Heat Minimap</h4>
      {#each [0, 1, 2, 3] as altIndex}
        <div class="alt-minimap-row">
          {#each rows as row}
            {#if row.alternatives && row.alternatives[altIndex]}
              <div
                class="alt-minimap-square {getAlternativeMinimapClass(
                  row.alternatives[altIndex]
                )}"
              ></div>
            {:else}
              <div class="alt-minimap-square"></div>
            {/if}
          {/each}
        </div>
      {/each}
    </div>
  </Card>
</div>

<style>
  .minimap {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    margin-top: 0.5rem;
  }
  .minimap-square {
    width: 10px;
    height: 10px;
    background-color: #eee;
  }

  /* Alternative Heat Minimap Styles */
  .alt-minimap {
    margin-top: 0.5rem;
  }
  .alt-minimap-row {
    display: flex;
    gap: 2px;
    margin-bottom: 2px;
  }
  .alt-minimap-square {
    width: 8px;
    height: 8px;
    background-color: #eee;
  }
  .heat-minimap-low {
    background-color: #dff0d8; /* light green */
  }
  .heat-minimap-medium {
    background-color: #fcf8e3; /* light yellow */
  }
  .heat-minimap-high {
    background-color: #f2dede; /* light red */
  }
  .tests > :global(*){
    flex: 1;
  }

  .summary {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .tests-row {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .diplomes {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.25rem;
  }

  .diplomes > :global(*) {
    flex: 1;
    min-width: 120px;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-base);
    color: var(--text);
    padding: 2px 0;
  }

  .label {
    color: var(--text-muted);
  }

  .alt-minimap {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .minimap-legend {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text-muted);
    margin: 0 0 4px;
  }

  .alt-minimap-row {
    display: flex;
    gap: 1px;
    flex-wrap: wrap;
  }

  .alt-minimap-square {
    width: 8px;
    height: 8px;
    background-color: var(--border);
    border-radius: 1px;
    cursor: default;
  }

  .dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .heat-low  { background-color: var(--success); }
  .heat-medium { background-color: var(--warning); }
  .heat-high { background-color: var(--danger); }
</style>
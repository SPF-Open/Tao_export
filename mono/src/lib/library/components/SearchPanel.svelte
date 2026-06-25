<script lang="ts">
  import DOMPurify from "dompurify";
  import { Search, Timer, ChevronLeft, ChevronRight, FileQuestion } from "lucide-svelte";
  import { Combobox, EmptyState, TextInput } from "$lib/ui";
  import type { ItemType } from "$lib/questions/types.js";
  import type { LibraryQuestion, LibrarySearchFilters } from "$lib/library/types.js";
  import { dbInfo, facets, searchResponse, runSearch, getQuestion } from "$lib/library/store";
  import QuestionDetailModal from "./QuestionDetailModal.svelte";

  const LIMIT = 20;

  let text = $state("");
  let testId = $state<string>("");
  let type = $state<string>("");
  let competency = $state<string>("");
  let page = $state(0);

  let detail = $state<LibraryQuestion | null>(null);
  let detailOpen = $state(false);

  const typeLabels: Record<string, string> = {
    "single-choice": "Single choice",
    "multiple-choice": "Multiple choice",
    text: "Open text",
    instruction: "Instruction",
    matching: "Matching",
    ordering: "Ordering",
    custom: "Custom",
    unknown: "Unknown",
  };

  const testChoices = $derived([
    { label: "All tests", value: "" },
    ...$facets.tests.map((t) => ({ label: t.title, value: String(t.id) })),
  ]);
  const typeChoices = $derived([
    { label: "All types", value: "" },
    ...$facets.types.map((t) => ({ label: typeLabels[t] ?? t, value: t })),
  ]);
  const competencyChoices = $derived([
    { label: "All competencies", value: "" },
    ...$facets.competencies.map((c) => ({ label: c.label ? `${c.code} — ${c.label}` : c.code, value: c.code })),
  ]);

  const filters = $derived<LibrarySearchFilters>({
    text,
    testId: testId ? Number(testId) : undefined,
    type: (type || undefined) as ItemType | undefined,
    competency: competency || undefined,
    limit: LIMIT,
    offset: page * LIMIT,
  });

  // Debounced auto-search whenever the filters change.
  let timer: ReturnType<typeof setTimeout>;
  $effect(() => {
    const f = filters;
    if (!$dbInfo) return;
    clearTimeout(timer);
    timer = setTimeout(() => void runSearch(f), 200);
    return () => clearTimeout(timer);
  });

  // Reset to first page when the query/filters (excluding page) change.
  $effect(() => {
    void text; void testId; void type; void competency;
    page = 0;
  });

  const response = $derived($searchResponse);
  const totalPages = $derived(response ? Math.max(1, Math.ceil(response.total / LIMIT)) : 1);

  function cleanSnippet(html: string): string {
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: ["mark", "b", "i", "em", "strong"], ALLOWED_ATTR: [] });
  }

  async function open(id: number) {
    const q = await getQuestion(id);
    if (q) { detail = q; detailOpen = true; }
  }
</script>

<div class="search">
  {#if !$dbInfo}
    <EmptyState icon={FileQuestion} title="No library open"
      description="Create or open a library to search its questions." />
  {:else}
    <div class="controls">
      <div class="search-box">
        <Search size={16} strokeWidth={1.75} />
        <TextInput bind:value={text} placeholder="Search questions, answers, competencies…" />
      </div>
      <div class="filters">
        <Combobox legend="Test" bind:value={testId} choices={testChoices} />
        <Combobox legend="Type" bind:value={type} choices={typeChoices} />
        {#if $facets.competencies.length}
          <Combobox legend="Competency" bind:value={competency} choices={competencyChoices} />
        {/if}
      </div>
    </div>

    {#if response}
      <div class="stats">
        <span>{response.total} result{response.total === 1 ? "" : "s"}</span>
        <span class="time"><Timer size={13} strokeWidth={2} /> {response.durationMs.toFixed(1)} ms</span>
      </div>

      {#if response.results.length === 0}
        <p class="empty">No questions match your search.</p>
      {:else}
        <ul class="results">
          {#each response.results as r (r.id)}
            <li>
              <button class="result" onclick={() => open(r.id)}>
                <span class="r-head">
                  <span class="r-title">{r.title || "Untitled question"}</span>
                  <span class="r-type">{typeLabels[r.type] ?? r.type}</span>
                </span>
                <span class="r-test">{r.testTitle}</span>
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                <span class="r-snippet">{@html cleanSnippet(r.snippet)}</span>
              </button>
            </li>
          {/each}
        </ul>

        {#if totalPages > 1}
          <div class="pager">
            <button disabled={page === 0} onclick={() => (page = Math.max(0, page - 1))} aria-label="Previous page">
              <ChevronLeft size={16} />
            </button>
            <span>Page {page + 1} / {totalPages}</span>
            <button disabled={page + 1 >= totalPages} onclick={() => (page = page + 1)} aria-label="Next page">
              <ChevronRight size={16} />
            </button>
          </div>
        {/if}
      {/if}
    {/if}
  {/if}
</div>

<QuestionDetailModal bind:open={detailOpen} question={detail} />

<style>
  .search { display: flex; flex-direction: column; gap: 0.75rem; }
  .controls { display: flex; flex-direction: column; gap: 0.6rem; }
  .search-box {
    display: flex; align-items: center; gap: 0.5rem;
    padding-left: 0.6rem; border: 1px solid var(--border);
    border-radius: var(--radius); background: var(--surface); color: var(--text-muted);
  }
  .search-box :global(.text-input) { border: none; background: transparent; }
  .search-box :global(.text-input:focus) { box-shadow: none; }
  .filters { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .filters :global(.combobox) { flex: 1; min-width: 140px; }
  .stats { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); }
  .time { display: inline-flex; align-items: center; gap: 0.3rem; }
  .empty { color: var(--text-muted); font-size: 0.9rem; }
  .results { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
  .result {
    width: 100%; text-align: left; cursor: pointer;
    display: flex; flex-direction: column; gap: 0.25rem;
    padding: 0.7rem 0.85rem; border: 1px solid var(--border);
    border-radius: var(--radius-lg); background: var(--surface-elevated);
    transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
  }
  .result:hover { border-color: rgba(var(--brand-rgb), 0.4); box-shadow: var(--shadow-sm); transform: translateY(-1px); }
  .result:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }
  .r-head { display: flex; justify-content: space-between; gap: 0.5rem; align-items: baseline; }
  .r-title { font-weight: 600; color: var(--text); }
  .r-type { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); white-space: nowrap; }
  .r-test { font-size: 0.78rem; color: var(--text-muted); }
  .r-snippet { font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; }
  .r-snippet :global(mark) { background: rgba(var(--brand-rgb), 0.22); color: var(--text); border-radius: 2px; padding: 0 1px; }
  .pager { display: flex; align-items: center; justify-content: center; gap: 0.75rem; font-size: 0.82rem; color: var(--text-muted); }
  .pager button {
    display: inline-flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border: 1px solid var(--border);
    border-radius: var(--radius); background: var(--surface); color: var(--text); cursor: pointer;
  }
  .pager button:disabled { opacity: 0.4; cursor: not-allowed; }
  .pager button:hover:not(:disabled) { border-color: var(--border-strong); }
  @media (prefers-reduced-motion: reduce) { .result:hover { transform: none; } }
</style>

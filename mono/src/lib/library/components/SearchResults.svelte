<script lang="ts">
  import { Timer, ChevronLeft, ChevronRight, FileQuestion, Plus, Check, Bookmark, List, Grid2x2, LayoutList } from "lucide-svelte";
  import { EmptyState } from "$lib/ui";
  import type { LibraryQuestion } from "$lib/library/types.js";
  import { sanitizeSnippet } from "$lib/library/sanitize";
  import { dbInfo, searchResponse, searchPage, getQuestion, SEARCH_LIMIT } from "$lib/library/store";
  import { heldQuestionIds, toggleHeldQuestion } from "$lib/library/fakeExamStore";
  import QuestionDetailModal from "./QuestionDetailModal.svelte";

  interface Props {
    /** When set, each result shows an "Add" button instead of opening the detail modal on click. */
    onAdd?: (id: number) => void;
    /** Question ids already present in the target (e.g. fake exam) — shown as added. */
    addedIds?: Set<number>;
  }
  let { onAdd, addedIds }: Props = $props();

  type ViewMode = "list" | "table" | "card";
  let viewMode = $state<ViewMode>("list");

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

  let detail = $state<LibraryQuestion | null>(null);
  let detailOpen = $state(false);

  const response = $derived($searchResponse);
  const page = $derived($searchPage);
  const totalPages = $derived(response ? Math.max(1, Math.ceil(response.total / SEARCH_LIMIT)) : 1);

  async function open(id: number) {
    const q = await getQuestion(id);
    if (q) { detail = q; detailOpen = true; }
  }
</script>

<div class="results-wrap">
  {#if !$dbInfo}
    <EmptyState icon={FileQuestion} title="No library open"
      description="Create or open a library to search its questions." />
  {:else if response}
    <div class="stats-header">
      <div class="stats">
        <span>{response.total} result{response.total === 1 ? "" : "s"}</span>
        <span class="time"><Timer size={13} strokeWidth={2} /> {response.durationMs.toFixed(1)} ms</span>
      </div>
      <div class="view-switcher" role="group" aria-label="Result layout">
        <button type="button" class="view-btn" class:active={viewMode === "list"} aria-pressed={viewMode === "list"} onclick={() => (viewMode = "list")} title="List view" aria-label="List view">
          <List size={16} strokeWidth={1.75} />
        </button>
        <button type="button" class="view-btn" class:active={viewMode === "table"} aria-pressed={viewMode === "table"} onclick={() => (viewMode = "table")} title="Table view" aria-label="Table view">
          <LayoutList size={16} strokeWidth={1.75} />
        </button>
        <button type="button" class="view-btn" class:active={viewMode === "card"} aria-pressed={viewMode === "card"} onclick={() => (viewMode = "card")} title="Card view" aria-label="Card view">
          <Grid2x2 size={16} strokeWidth={1.75} />
        </button>
      </div>
    </div>

    {#if response.results.length === 0}
      <p class="empty">No questions match your search.</p>
    {:else}
      {#if viewMode === "list"}
        <ul class="results results-list">
          {#each response.results as r (r.id)}
            {@const added = addedIds?.has(r.id) ?? false}
            {@const held = $heldQuestionIds.has(r.id)}
            <li class="result-row">
              <button type="button" class="result" onclick={() => open(r.id)}>
                <span class="r-head">
                  <span class="r-title">{r.title || "Untitled question"}</span>
                  <span class="r-type">{typeLabels[r.type] ?? r.type}</span>
                </span>
                <span class="r-test">{r.testTitle}</span>
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                <span class="r-snippet">{@html sanitizeSnippet(r.snippet)}</span>
              </button>
              <button type="button" class="hold-btn" class:held onclick={() => toggleHeldQuestion(r.id)} aria-label={held ? "Remove from memory" : "Hold in memory"} title={held ? "Remove from memory" : "Hold in memory for quick add"}>
                <Bookmark size={16} strokeWidth={held ? 2 : 1.5} />
              </button>
              {#if onAdd}
                <button type="button" class="add-btn" class:added disabled={added} onclick={() => onAdd?.(r.id)} aria-label={added ? "Already in exam" : "Add to exam"} title={added ? "Already in exam" : "Add to exam"}>
                  {#if added}<Check size={16} strokeWidth={2} />{:else}<Plus size={16} strokeWidth={2} />{/if}
                </button>
              {/if}
            </li>
          {/each}
        </ul>
      {:else if viewMode === "table"}
        <div class="results-table-wrapper">
          <table class="results-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Type</th>
                <th>Test</th>
                <th>Snippet</th>
                <th aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {#each response.results as r (r.id)}
                {@const added = addedIds?.has(r.id) ?? false}
                {@const held = $heldQuestionIds.has(r.id)}
                <tr class="result-row-table">
                  <td class="table-question">
                    <button type="button" class="table-link" onclick={() => open(r.id)}>
                      {r.title || "Untitled question"}
                    </button>
                  </td>
                  <td>{typeLabels[r.type] ?? r.type}</td>
                  <td>{r.testTitle}</td>
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  <td class="table-snippet">{@html sanitizeSnippet(r.snippet)}</td>
                  <td class="table-actions">
                    <button type="button" class="hold-btn" class:held onclick={() => toggleHeldQuestion(r.id)} aria-label={held ? "Remove from memory" : "Hold in memory"} title={held ? "Remove from memory" : "Hold in memory for quick add"}>
                      <Bookmark size={14} strokeWidth={held ? 2 : 1.5} />
                    </button>
                    {#if onAdd}
                      <button type="button" class="add-btn" class:added disabled={added} onclick={() => onAdd?.(r.id)} aria-label={added ? "Already in exam" : "Add to exam"} title={added ? "Already in exam" : "Add to exam"}>
                        {#if added}<Check size={14} strokeWidth={2} />{:else}<Plus size={14} strokeWidth={2} />{/if}
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <ul class="results results-card">
          {#each response.results as r (r.id)}
            {@const added = addedIds?.has(r.id) ?? false}
            {@const held = $heldQuestionIds.has(r.id)}
            <li class="result-card">
              <button type="button" class="card-content" onclick={() => open(r.id)}>
                <span class="card-type">{typeLabels[r.type] ?? r.type}</span>
                <span class="card-title">{r.title || "Untitled question"}</span>
                <span class="card-test">{r.testTitle}</span>
              </button>
              <div class="card-actions">
                <button type="button" class="hold-btn" class:held onclick={() => toggleHeldQuestion(r.id)} aria-label={held ? "Remove from memory" : "Hold in memory"} title={held ? "Remove from memory" : "Hold in memory for quick add"}>
                  <Bookmark size={14} strokeWidth={held ? 2 : 1.5} />
                </button>
                {#if onAdd}
                  <button type="button" class="add-btn" class:added disabled={added} onclick={() => onAdd?.(r.id)} aria-label={added ? "Already in exam" : "Add to exam"} title={added ? "Already in exam" : "Add to exam"}>
                    {#if added}<Check size={14} strokeWidth={2} />{:else}<Plus size={14} strokeWidth={2} />{/if}
                  </button>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}

      {#if totalPages > 1}
        <div class="pager">
          <button type="button" disabled={page === 0} onclick={() => searchPage.set(Math.max(0, page - 1))} aria-label="Previous page">
            <ChevronLeft size={16} />
          </button>
          <span>Page {page + 1} / {totalPages}</span>
          <button type="button" disabled={page + 1 >= totalPages} onclick={() => searchPage.set(page + 1)} aria-label="Next page">
            <ChevronRight size={16} />
          </button>
        </div>
      {/if}
    {/if}
  {:else}
    <p class="empty">Use the filters on the left to search the library.</p>
  {/if}
</div>

<QuestionDetailModal bind:open={detailOpen} question={detail} />

<style>
  .results-wrap { display: flex; flex-direction: column; gap: 0.75rem; }
  
  .stats-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .stats { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); gap: 1rem; }
  .time { display: inline-flex; align-items: center; gap: 0.3rem; }
  
  .view-switcher { display: inline-flex; gap: 4px; background: var(--surface-elevated); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 4px; }
  .view-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; background: transparent; color: var(--text-muted); cursor: pointer; border-radius: var(--radius); transition: background 150ms ease, color 150ms ease; }
  .view-btn:hover { background: rgba(var(--brand-rgb), 0.08); color: var(--text); }
  .view-btn.active { background: var(--brand); color: var(--primary-foreground); }
  .view-btn:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px rgba(var(--brand-rgb), 0.3); }

  .empty { color: var(--text-muted); font-size: 0.9rem; }
  
  /* LIST VIEW */
  .results { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
  .results-list { gap: 0.5rem; }
  .result-row { display: flex; align-items: stretch; gap: 0.4rem; }
  .result {
    flex: 1; min-width: 0; width: 100%; text-align: left; cursor: pointer;
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
  .r-snippet :global(mark),
  .table-snippet :global(mark) { background: rgba(var(--brand-rgb), 0.22); color: var(--text); border-radius: 2px; padding: 0 1px; }

  /* TABLE VIEW */
  .results-table-wrapper {
    overflow: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface-elevated);
  }

  .results-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 720px;
  }

  .results-table th,
  .results-table td {
    padding: 0.75rem 0.85rem;
    border-bottom: 1px solid var(--border);
    text-align: left;
    vertical-align: top;
    font-size: 0.9rem;
  }

  .results-table thead th {
    background: var(--surface);
    color: var(--text-muted);
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .result-row-table:nth-child(odd) {
    background: color-mix(in srgb, var(--border) 22%, transparent);
  }

  .result-row-table:hover {
    background: rgba(var(--brand-rgb), 0.06);
  }

  .table-link {
    width: 100%;
    text-align: left;
    border: none;
    background: transparent;
    color: var(--text);
    font-weight: 600;
    cursor: pointer;
    padding: 0;
  }

  .table-link:hover,
  .table-link:focus-visible {
    text-decoration: underline;
  }

  .table-snippet {
    color: var(--text-muted);
    line-height: 1.4;
  }

  .table-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .table-actions .hold-btn,
  .table-actions .add-btn { width: 30px; height: 30px; border-radius: var(--radius); }

  .results-table td:last-child {
    white-space: nowrap;
  }

  /* CARD VIEW */
  .results-card { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
  .result-card { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface-elevated); overflow: hidden; transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease; }
  .result-card:hover { border-color: rgba(var(--brand-rgb), 0.4); box-shadow: var(--shadow-sm); transform: translateY(-2px); }
  .card-content { flex: 1; min-width: 0; text-align: left; cursor: pointer; display: flex; flex-direction: column; gap: 0.4rem; padding: 0.8rem; border: none; background: transparent; }
  .card-content:hover { background: rgba(var(--brand-rgb), 0.04); }
  .card-content:focus-visible { outline: none; box-shadow: inset 0 0 0 3px rgba(var(--brand-rgb), 0.18); }
  .card-type { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); }
  .card-title { font-weight: 600; color: var(--text); line-height: 1.3; }
  .card-test { font-size: 0.78rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .card-actions { display: flex; gap: 0.4rem; padding: 0.6rem; border-top: 1px solid var(--border); background: var(--surface); }
  .card-actions .hold-btn,
  .card-actions .add-btn { flex: 1; width: auto; padding: 0.4rem; border-radius: var(--radius); }

  /* SHARED BUTTON STYLES (list, table and card actions) */
  .hold-btn {
    flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
    width: 36px; border: 1px solid var(--border); border-radius: var(--radius-lg);
    background: var(--surface-elevated); color: var(--text-muted); cursor: pointer;
    transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
  }
  .hold-btn:hover { border-color: rgba(var(--brand-rgb), 0.5); color: var(--brand); background: rgba(var(--brand-rgb), 0.06); }
  .hold-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }
  .hold-btn.held { color: var(--brand); border-color: var(--brand); background: rgba(var(--brand-rgb), 0.1); }
  
  .add-btn {
    flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
    width: 36px; border: 1px solid var(--border); border-radius: var(--radius-lg);
    background: var(--surface-elevated); color: var(--text-muted); cursor: pointer;
    transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
  }
  .add-btn:hover:not(:disabled) { border-color: rgba(var(--brand-rgb), 0.5); color: var(--brand); background: rgba(var(--brand-rgb), 0.06); }
  .add-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }
  .add-btn.added { color: var(--success); border-color: var(--success); cursor: default; }
  .add-btn:disabled { opacity: 0.7; }

  /* PAGER */
  .pager { display: flex; align-items: center; justify-content: center; gap: 0.75rem; font-size: 0.82rem; color: var(--text-muted); }
  .pager button {
    display: inline-flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border: 1px solid var(--border);
    border-radius: var(--radius); background: var(--surface); color: var(--text); cursor: pointer;
  }
  .pager button:disabled { opacity: 0.4; cursor: not-allowed; }
  .pager button:hover:not(:disabled) { border-color: var(--border-strong); }

  @media (prefers-reduced-motion: reduce) {
    .result:hover { transform: none; }
    .result-card:hover { transform: none; }
  }
  @media (max-width: 640px) {
    .pager button { width: 44px; height: 44px; }
    .add-btn { width: 44px; }
    .hold-btn { width: 44px; }
    .stats-header { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    .results-card { grid-template-columns: 1fr; }
  }
</style>

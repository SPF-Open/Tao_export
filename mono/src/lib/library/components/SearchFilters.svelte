<script lang="ts">
  import { Search } from "lucide-svelte";
  import { Combobox } from "$lib/ui";
  import type { ItemType } from "$lib/questions/types.js";
  import type { LibrarySearchFilters } from "$lib/library/types.js";
  import {
    dbInfo,
    facets,
    runSearch,
    SEARCH_LIMIT,
    searchText,
    searchTestId,
    searchType,
    searchCompetency,
    searchIndicator,
    searchLanguage,
    searchPage,
  } from "$lib/library/store";

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
  const indicatorChoices = $derived([
    { label: "All indicators", value: "" },
    ...$facets.indicators.map((i) => ({ label: i, value: i })),
  ]);
  const languageChoices = $derived([
    { label: "All languages", value: "" },
    ...$facets.languages.map((l) => ({ label: l, value: l })),
  ]);

  const filters = $derived<LibrarySearchFilters>({
    text: $searchText,
    testId: $searchTestId ? Number($searchTestId) : undefined,
    type: ($searchType || undefined) as ItemType | undefined,
    competency: $searchCompetency || undefined,
    indicator: $searchIndicator || undefined,
    language: $searchLanguage || undefined,
    limit: SEARCH_LIMIT,
    offset: $searchPage * SEARCH_LIMIT,
  });

  // Debounced auto-search whenever any filter (incl. page) changes.
  let timer: ReturnType<typeof setTimeout>;
  $effect(() => {
    const f = filters;
    if (!$dbInfo) return;
    clearTimeout(timer);
    timer = setTimeout(() => void runSearch(f), 200);
    return () => clearTimeout(timer);
  });

  // Reset to the first page whenever a non-page filter changes.
  $effect(() => {
    void $searchText;
    void $searchTestId;
    void $searchType;
    void $searchCompetency;
    void $searchIndicator;
    void $searchLanguage;
    searchPage.set(0);
  });
</script>

<div class="filters">
  <label class="search-box">
    <Search size={15} strokeWidth={1.75} />
    <input type="text" bind:value={$searchText} placeholder="Search text…" />
  </label>

  <Combobox legend="Test" bind:value={$searchTestId} choices={testChoices} />
  <Combobox legend="Type" bind:value={$searchType} choices={typeChoices} />
  {#if $facets.competencies.length}
    <Combobox legend="Competency" bind:value={$searchCompetency} choices={competencyChoices} />
  {/if}
  {#if $facets.indicators.length}
    <Combobox legend="Indicator" bind:value={$searchIndicator} choices={indicatorChoices} />
  {/if}
  {#if $facets.languages.length}
    <Combobox legend="Language" bind:value={$searchLanguage} choices={languageChoices} />
  {/if}
</div>

<style>
  .filters { display: flex; flex-direction: column; gap: 0.5rem; }
  .search-box {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0 0.6rem; border: 1px solid var(--border);
    border-radius: var(--radius-lg); background: var(--surface); color: var(--text-muted);
  }
  .search-box:focus-within { border-color: rgba(var(--brand-rgb), 0.5); box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.12); }
  .search-box input {
    flex: 1; min-width: 0; border: none; background: transparent; outline: none;
    color: var(--text); font-family: var(--font-family); font-size: 0.88rem; padding: 0.5rem 0;
  }
  .filters :global(.combobox) { width: 100%; }
  .filters :global(.combobox-select) { width: 100%; }
</style>

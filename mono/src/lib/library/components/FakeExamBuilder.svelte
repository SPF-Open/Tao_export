<script lang="ts">
  import { ArrowLeft, FileSpreadsheet, GripVertical, X } from "lucide-svelte";
  import type { AssessmentItem } from "$lib/questions/types.js";
  import Question from "$lib/export/template/Question.svelte";
  import { sanitizeRich } from "$lib/library/sanitize";
  import SearchFilters from "./SearchFilters.svelte";
  import SearchResults from "./SearchResults.svelte";
  import {
    activeFakeExam,
    fakeExamBusy,
    openFakeExam,
    renameActiveFakeExam,
    addQuestionsToActiveExam,
    removeFakeExamItem,
    reorderFakeExamItems,
    loadFakeExamAssetUrls,
    fakeExamItemToAssessmentItem,
    exportFakeExamToExcel,
  } from "$lib/library/fakeExamStore";

  interface Props {
    examId: number;
    onBack: () => void;
  }
  let { examId, onBack }: Props = $props();

  let titleDraft = $state("");
  let assetUrls = $state<Map<string, string>>(new Map());

  function revoke(urls: Map<string, string>) {
    for (const url of urls.values()) URL.revokeObjectURL(url);
  }

  $effect(() => {
    void openFakeExam(examId);
  });

  $effect(() => {
    const exam = $activeFakeExam;
    if (exam) titleDraft = exam.title;
  });

  // Reload preview asset URLs whenever the item set changes.
  $effect(() => {
    const exam = $activeFakeExam;
    if (!exam) return;
    let active = true;
    let local = new Map<string, string>();
    void loadFakeExamAssetUrls(exam).then((urls) => {
      if (!active) { revoke(urls); return; }
      local = urls;
      assetUrls = urls;
    });
    return () => {
      active = false;
      revoke(local);
      assetUrls = new Map();
    };
  });

  const addedIds = $derived(
    new Set(($activeFakeExam?.items ?? []).map((i) => i.sourceQuestionId).filter((id): id is number => id != null))
  );

  function cleanHtml(html: string): string {
    let out = html;
    for (const [marker, url] of assetUrls) out = out.split(marker).join(url);
    return sanitizeRich(out);
  }

  const previewItems = $derived<AssessmentItem[]>(
    ($activeFakeExam?.items ?? []).map((item) => {
      const ai = fakeExamItemToAssessmentItem(item);
      return {
        ...ai,
        content: { ...ai.content, html: cleanHtml(ai.content.html ?? "") },
        responses: ai.responses?.map((r) => ({
          ...r,
          options: r.options?.map((o) => ({ ...o, content: { ...o.content, html: cleanHtml(o.content.html ?? "") } })),
        })),
      };
    })
  );

  function onAdd(questionId: number) {
    const exam = $activeFakeExam;
    if (!exam) return;
    void addQuestionsToActiveExam(exam.id, [questionId]);
  }

  function onRenameBlur() {
    const exam = $activeFakeExam;
    if (!exam) return;
    const title = titleDraft.trim() || "Untitled exam";
    if (title !== exam.title) void renameActiveFakeExam(exam.id, title);
  }

  function onRemove(itemId: number) {
    void removeFakeExamItem(itemId);
  }

  function onExport() {
    const exam = $activeFakeExam;
    if (exam) void exportFakeExamToExcel(exam);
  }

  // Drag-to-reorder — mirrors the export page's item-dragging pattern.
  let draggingIndex = $state(-1);
  let hoveredIndex = $state(-1);
  let workingOrder = $state<number[]>([]);

  $effect(() => {
    const exam = $activeFakeExam;
    if (exam) workingOrder = exam.items.map((i) => i.id);
  });

  $effect.pre(() => {
    if (draggingIndex !== -1 && hoveredIndex !== -1 && draggingIndex !== hoveredIndex) {
      const next = [...workingOrder];
      [next[draggingIndex], next[hoveredIndex]] = [next[hoveredIndex], next[draggingIndex]];
      workingOrder = next;
      draggingIndex = hoveredIndex;
    }
  });

  function onDragStart(i: number) {
    draggingIndex = i;
  }

  function onDragEnd() {
    const exam = $activeFakeExam;
    draggingIndex = -1;
    hoveredIndex = -1;
    if (exam) void reorderFakeExamItems(exam.id, workingOrder);
  }

  const orderedItems = $derived(
    workingOrder
      .map((id) => $activeFakeExam?.items.find((i) => i.id === id))
      .filter((i): i is NonNullable<typeof i> => i != null)
  );
  const orderedPreview = $derived(
    workingOrder.map((id) => previewItems.find((p) => p.id === `fake-item-${id}`)).filter((p): p is AssessmentItem => p != null)
  );
</script>

<div class="builder">
  <div class="builder-header">
    <button class="back-btn" onclick={onBack}>
      <ArrowLeft size={15} strokeWidth={1.9} /> All exams
    </button>
    <input
      class="title-input"
      type="text"
      bind:value={titleDraft}
      onblur={onRenameBlur}
      placeholder="Exam title"
    />
    <button class="export-btn" onclick={onExport} disabled={$fakeExamBusy || !$activeFakeExam?.items.length}>
      <FileSpreadsheet size={15} strokeWidth={1.9} /> Export to Excel
    </button>
  </div>

  <div class="builder-grid">
    <section class="picker">
      <h3>Add questions</h3>
      <SearchFilters />
      <div class="picker-results">
        <SearchResults {onAdd} {addedIds} />
      </div>
    </section>

    <section class="preview">
      <h3>Exam preview ({orderedItems.length} question{orderedItems.length === 1 ? "" : "s"})</h3>
      {#if orderedItems.length === 0}
        <p class="empty">No questions yet — add some from the panel on the left.</p>
      {:else}
        <ul class="item-list">
          {#each orderedItems as item, i (item.id)}
            {@const previewItem = orderedPreview[i]}
            <li ondragover={(e) => e.preventDefault()}>
              <div class="item-row">
                <div
                  class="drag-handle"
                  role="button"
                  tabindex="0"
                  draggable="true"
                  ondragstart={() => onDragStart(i)}
                  ondragover={() => (hoveredIndex = i)}
                  ondragend={onDragEnd}
                  aria-label="Reorder question"
                >
                  <GripVertical size={16} strokeWidth={1.75} />
                </div>
                <div class="item-body">
                  {#if previewItem}
                    <Question item={previewItem} show={true} />
                  {/if}
                </div>
                <button class="remove-btn" onclick={() => onRemove(item.id)} aria-label="Remove question" title="Remove from exam">
                  <X size={16} strokeWidth={1.9} />
                </button>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>
</div>

<style>
  .builder { display: flex; flex-direction: column; gap: 1rem; }
  .builder-header { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
  .back-btn {
    display: inline-flex; align-items: center; gap: 0.4rem; flex-shrink: 0;
    padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-lg);
    background: var(--surface-elevated); color: var(--text); font-family: var(--font-family);
    font-size: 0.85rem; cursor: pointer; transition: border-color 150ms ease, color 150ms ease;
  }
  .back-btn:hover { border-color: rgba(var(--brand-rgb), 0.5); color: var(--brand); }
  .back-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }

  .title-input {
    flex: 1; min-width: 160px; padding: 0.55rem 0.8rem; border: 1px solid var(--border);
    border-radius: var(--radius-lg); background: var(--surface); color: var(--text);
    font-family: var(--font-family); font-size: 0.95rem; font-weight: 600;
  }
  .title-input:focus-visible { outline: none; border-color: rgba(var(--brand-rgb), 0.5); box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.12); }

  .export-btn {
    display: inline-flex; align-items: center; gap: 0.4rem; flex-shrink: 0;
    padding: 0.55rem 1rem; border: 1px solid var(--brand); border-radius: var(--radius-lg);
    background: var(--brand); color: var(--primary-foreground); font-weight: 600;
    font-family: var(--font-family); font-size: 0.85rem; cursor: pointer;
    transition: opacity 150ms ease;
  }
  .export-btn:hover:not(:disabled) { opacity: 0.92; }
  .export-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .export-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }

  .builder-grid { display: grid; grid-template-columns: minmax(260px, 320px) 1fr; gap: 1.25rem; align-items: start; }
  h3 { margin: 0 0 0.6rem; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }

  .picker {
    border: 1px solid var(--border); border-radius: var(--radius-xl); background: var(--surface-elevated);
    padding: 0.9rem; display: flex; flex-direction: column; gap: 0.75rem;
    position: sticky; top: 1rem; max-height: calc(100vh - 8rem); overflow: auto;
  }
  .picker-results { overflow: auto; }

  .preview { min-width: 0; }
  .empty { color: var(--text-muted); font-size: 0.9rem; }

  .item-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.25rem; }
  .item-row { display: flex; align-items: flex-start; gap: 0.4rem; }
  .drag-handle {
    flex-shrink: 0; width: 20px; margin-top: 12px; color: var(--text-muted);
    cursor: move; opacity: 0.55; transition: opacity 150ms ease;
  }
  .drag-handle:hover { opacity: 1; color: var(--brand); }
  .item-body { flex: 1; min-width: 0; }
  .remove-btn {
    flex-shrink: 0; margin-top: 8px; display: inline-flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border: 1px solid var(--border); border-radius: var(--radius);
    background: var(--surface-elevated); color: var(--text-muted); cursor: pointer;
    transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
  }
  .remove-btn:hover { border-color: var(--danger); color: var(--danger); background: color-mix(in srgb, var(--danger) 8%, var(--surface-elevated)); }
  .remove-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }

  @media (max-width: 900px) {
    .builder-grid { grid-template-columns: 1fr; }
    .picker { position: static; max-height: none; }
  }
  @media (max-width: 640px) {
    .back-btn, .export-btn { min-height: 44px; }
    .remove-btn { width: 44px; height: 44px; }
  }
</style>

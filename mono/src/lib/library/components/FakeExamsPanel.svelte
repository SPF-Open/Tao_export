<script lang="ts">
  import { onMount } from "svelte";
  import { ClipboardList, Plus, Trash2, FileQuestion, Bookmark, X } from "lucide-svelte";
  import { EmptyState } from "$lib/ui";
  import { dbInfo } from "$lib/library/store";
  import {
    fakeExams,
    fakeExamBusy,
    loadFakeExams,
    createFakeExam,
    deleteFakeExam,
    heldQuestionIds,
    clearHeldQuestions,
    createExamWithHeldQuestions,
    addHeldQuestionsToExam,
  } from "$lib/library/fakeExamStore";
  import FakeExamBuilder from "./FakeExamBuilder.svelte";

  let openId = $state<number | null>(null);
  let newTitle = $state("");

  onMount(() => {
    if ($dbInfo) void loadFakeExams();
  });
  $effect(() => {
    if ($dbInfo) void loadFakeExams();
  });

  async function onCreate() {
    const title = newTitle.trim() || "Untitled exam";
    const exam = await createFakeExam(title);
    if (exam) {
      newTitle = "";
      openId = exam.id;
    }
  }

  async function onCreateWithHeld() {
    const title = newTitle.trim() || "Untitled exam";
    const exam = await createExamWithHeldQuestions(title);
    if (exam) {
      newTitle = "";
      openId = exam.id;
    }
  }

  async function onDelete(id: number, event: MouseEvent) {
    event.stopPropagation();
    if (!confirm("Delete this fake exam? This cannot be undone.")) return;
    await deleteFakeExam(id);
    if (openId === id) openId = null;
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }
</script>

{#if openId != null}
  <FakeExamBuilder examId={openId} onBack={() => (openId = null)} />
{:else if !$dbInfo}
  <EmptyState icon={FileQuestion} title="No library open"
    description="Create or open a library to build fake exams from its questions." />
{:else}
  <div class="exams-wrap">
    {#if $heldQuestionIds.size > 0}
      <div class="held-section">
        <div class="held-header">
          <span class="held-title">
            <Bookmark size={16} strokeWidth={1.5} />
            <span>{$heldQuestionIds.size} question{$heldQuestionIds.size === 1 ? "" : "s"} held in memory</span>
          </span>
          <button type="button" class="clear-held-btn" onclick={() => clearHeldQuestions()} title="Clear held questions">
            <X size={14} strokeWidth={2} />
          </button>
        </div>
        <div class="held-actions">
          <form class="held-create" onsubmit={(e) => { e.preventDefault(); void onCreateWithHeld(); }}>
            <input type="text" bind:value={newTitle} placeholder="New exam title…" />
            <button class="create-btn" type="submit" disabled={$fakeExamBusy}>
              <Plus size={15} strokeWidth={1.9} /> Create & Add
            </button>
          </form>
          {#if $fakeExams.length > 0}
            <div class="held-add-to">
              <label for="exam-select">Or add to existing exam:</label>
              <select id="exam-select" onchange={(e) => { const id = Number(e.currentTarget.value); if (id) void addHeldQuestionsToExam(id); e.currentTarget.value = ""; }} disabled={$fakeExamBusy}>
                <option value="">Select an exam…</option>
                {#each $fakeExams as exam (exam.id)}
                  <option value={exam.id}>{exam.title || "Untitled exam"}</option>
                {/each}
              </select>
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <form class="create-row" onsubmit={(e) => { e.preventDefault(); void onCreate(); }}>
        <input type="text" bind:value={newTitle} placeholder="New exam title…" />
        <button class="create-btn" type="submit" disabled={$fakeExamBusy}>
          <Plus size={15} strokeWidth={1.9} /> Create
        </button>
      </form>
    {/if}

    {#if $fakeExams.length === 0}
      <EmptyState icon={ClipboardList} title="No fake exams yet"
        description="Create one above, then add questions to it from the library." />
    {:else}
      <ul class="exam-list">
        {#each $fakeExams as exam (exam.id)}
          <li>
            <button type="button" class="exam-card" onclick={() => (openId = exam.id)}>
              <span class="ec-head">
                <span class="ec-title">{exam.title || "Untitled exam"}</span>
                <span class="ec-count">{exam.itemCount} question{exam.itemCount === 1 ? "" : "s"}</span>
              </span>
              <span class="ec-meta">Updated {formatDate(exam.updatedAt)}</span>
            </button>
            <button type="button" class="delete-btn" onclick={(e) => onDelete(exam.id, e)} aria-label="Delete exam" title="Delete exam">
              <Trash2 size={15} strokeWidth={1.75} />
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}

<style>
  .exams-wrap { display: flex; flex-direction: column; gap: 1rem; }

  .held-section {
    padding: 0.9rem;
    border: 1.5px solid rgba(var(--brand-rgb), 0.3);
    border-radius: var(--radius-lg);
    background: rgba(var(--brand-rgb), 0.04);
  }

  .held-header {
    display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .held-title {
    display: flex; align-items: center; gap: 0.5rem;
    font-size: 0.9rem; font-weight: 600; color: var(--brand);
  }

  .clear-held-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border: 1px solid rgba(var(--brand-rgb), 0.3);
    border-radius: var(--radius); background: transparent; color: var(--text-muted);
    cursor: pointer; transition: border-color 150ms ease, color 150ms ease;
  }

  .clear-held-btn:hover { border-color: var(--brand); color: var(--brand); }
  .clear-held-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }

  .held-actions { display: flex; flex-direction: column; gap: 0.6rem; }

  .held-create {
    display: flex; gap: 0.5rem;
  }

  .held-create input {
    flex: 1; min-width: 0; padding: 0.6rem 0.75rem; border: 1px solid rgba(var(--brand-rgb), 0.3);
    border-radius: var(--radius-lg); background: var(--surface); color: var(--text);
    font-family: var(--font-family); font-size: 0.9rem;
  }

  .held-create input:focus-visible { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.12); }

  .held-add-to {
    display: flex; flex-direction: column; gap: 0.35rem;
  }

  .held-add-to label {
    font-size: 0.85rem; color: var(--text-muted); font-weight: 500;
  }

  .held-add-to select {
    padding: 0.5rem 0.7rem; border: 1px solid rgba(var(--brand-rgb), 0.3);
    border-radius: var(--radius-lg); background: var(--surface); color: var(--text);
    font-family: var(--font-family); font-size: 0.9rem;
  }

  .held-add-to select:focus-visible { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.12); }
  .held-add-to select:disabled { opacity: 0.5; cursor: not-allowed; }

  .create-row { display: flex; gap: 0.5rem; }
  .create-row input {
    flex: 1; min-width: 0; padding: 0.6rem 0.75rem; border: 1px solid var(--border);
    border-radius: var(--radius-lg); background: var(--surface); color: var(--text);
    font-family: var(--font-family); font-size: 0.9rem;
  }
  .create-row input:focus-visible { outline: none; border-color: rgba(var(--brand-rgb), 0.5); box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.12); }
  .create-btn {
    display: inline-flex; align-items: center; gap: 0.4rem; flex-shrink: 0;
    padding: 0 1rem; border: 1px solid var(--brand); border-radius: var(--radius-lg);
    background: var(--brand); color: var(--primary-foreground); font-weight: 600;
    font-family: var(--font-family); font-size: 0.88rem; cursor: pointer;
    transition: opacity 150ms ease;
  }
  .create-btn:hover:not(:disabled) { opacity: 0.92; }
  .create-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .create-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }

  .exam-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
  .exam-list li { display: flex; align-items: stretch; gap: 0.4rem; }
  .exam-card {
    flex: 1; min-width: 0; text-align: left; cursor: pointer;
    display: flex; flex-direction: column; gap: 0.25rem;
    padding: 0.7rem 0.85rem; border: 1px solid var(--border);
    border-radius: var(--radius-lg); background: var(--surface-elevated);
    transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
  }
  .exam-card:hover { border-color: rgba(var(--brand-rgb), 0.4); box-shadow: var(--shadow-sm); transform: translateY(-1px); }
  .exam-card:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }
  .ec-head { display: flex; justify-content: space-between; gap: 0.5rem; align-items: baseline; }
  .ec-title { font-weight: 600; color: var(--text); }
  .ec-count { font-size: 0.78rem; color: var(--text-muted); white-space: nowrap; }
  .ec-meta { font-size: 0.78rem; color: var(--text-muted); }

  .delete-btn {
    flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
    width: 38px; border: 1px solid var(--border); border-radius: var(--radius-lg);
    background: var(--surface-elevated); color: var(--text-muted); cursor: pointer;
    transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
  }
  .delete-btn:hover { border-color: var(--danger); color: var(--danger); background: color-mix(in srgb, var(--danger) 8%, var(--surface-elevated)); }
  .delete-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }

  @media (prefers-reduced-motion: reduce) {
    .exam-card:hover { transform: none; }
  }
  @media (max-width: 640px) {
    .create-btn { min-height: 44px; }
    .delete-btn { width: 44px; }
    .held-create { flex-direction: column; }
    .held-create input { min-height: 44px; }
  }
</style>

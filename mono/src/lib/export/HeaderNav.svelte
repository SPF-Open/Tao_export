<script lang="ts">
  import {
    ChevronLeft,
    ChevronRight,
  } from 'lucide-svelte';
  
  import {
    questions,
    exams,
    examsIndex,
    windowName,
    currentPage,
    compareMode,
    multiple,
  } from './store';
  import { get } from 'svelte/store';

  const { onExportPDF, onExportJSON } = $props<{
    onExportPDF?: () => void;
    onExportJSON?: () => void;
  }>();

  function moveIndex(n: number) {
    const maxLength = get(exams).length - 1;
    if (!maxLength) return;
    examsIndex.update((i) => {
      i += n;
      if (i < 0) i = maxLength;
      if (i > maxLength) i = 0;
      return i;
    });
  }

  function handlePageChange(page: 'questions' | 'audit' | 'compare') {
    currentPage.set(page);
  }

  // Keyboard shortcuts
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft' && $questions.length > 0) {
      moveIndex(-1);
    } else if (e.key === 'ArrowRight' && $questions.length > 0) {
      moveIndex(1);
    }
  }

  $effect(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<header class="header hide-print">
  <div class="header-center">
    {#if $questions.length > 0}
      <div class="page-tabs" role="tablist">
        <button
          class="page-tab"
          class:active={$currentPage === 'questions'}
          onclick={() => handlePageChange('questions')}
          role="tab"
          aria-selected={$currentPage === 'questions'}
          aria-label="Questions view"
        >
          Questions
        </button>
        <button
          class="page-tab"
          class:active={$currentPage === 'audit'}
          onclick={() => handlePageChange('audit')}
          role="tab"
          aria-selected={$currentPage === 'audit'}
          aria-label="Audit view"
        >
          Audit & Compare
        </button>
        {#if $compareMode && $multiple && $exams.length > 1}
          <button
            class="page-tab"
            class:active={$currentPage === 'compare'}
            onclick={() => handlePageChange('compare')}
            role="tab"
            aria-selected={$currentPage === 'compare'}
            aria-label="Compare view"
          >
            Compare
          </button>
        {/if}
      </div>

      {#if $exams.length > 1}
        <div class="exam-nav">
          <button
            class="nav-btn"
            onclick={() => moveIndex(-1)}
            aria-label="Previous exam (← arrow)"
            title="Previous exam"
          >
            <ChevronLeft size={16} />
          </button>
          <span class="exam-index">{$examsIndex + 1} / {get(exams).length}</span>
          <button
            class="nav-btn"
            onclick={() => moveIndex(+1)}
            aria-label="Next exam (→ arrow)"
            title="Next exam"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      {/if}
    {/if}
  </div>
</header>

<style>
  .header {
    position: sticky;
    top: var(--layout-header-height);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--header-height);
    padding: 0 16px;
    background: var(--surface-elevated);
    border-bottom: 1px solid var(--border);
    gap: 16px;
  }


  .header-center {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 24px;
    min-width: 0;
  }

  .page-tabs {
    display: flex;
    gap: 2px;
    border-radius: var(--radius-lg);
    background: var(--surface);
    padding: 2px;
    border: 1px solid var(--border);
  }

  .page-tab {
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    background: transparent;
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .page-tab:hover {
    color: var(--text);
    background: var(--surface-elevated);
  }

  .page-tab.active {
    color: var(--text);
    background: var(--surface-elevated);
    border: 1px solid var(--border);
  }

  .exam-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    background: var(--surface);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    white-space: nowrap;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--text);
    border-radius: var(--radius);
    cursor: pointer;
    transition: background 0.2s;
  }

  .nav-btn:hover {
    background: var(--border);
  }

  .exam-index {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    min-width: 50px;
    text-align: center;
  }

  @media (max-width: 900px) {
    .header {
      padding: 0 12px;
      gap: 12px;
    }

    .header-center {
      gap: 16px;
    }

    .page-tabs {
      font-size: 12px;
    }

    .page-tab {
      padding: 4px 12px;
    }
  }
</style>

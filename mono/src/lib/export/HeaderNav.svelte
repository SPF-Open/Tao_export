<script lang="ts">
  import {
    Menu,
    ChevronLeft,
    ChevronRight,
    Sun,
    Moon,
    Settings as SettingsIcon,
    Info,
    FileText,
    Download,
  } from 'lucide-svelte';
  
  import {
    showMenu,
    questions,
    exams,
    examsIndex,
    windowName,
    darkMode,
    currentPage,
    compareMode,
    multiple,
  } from './store';
  import { get } from 'svelte/store';

  interface Props {
    onDebugToggle?: (show: boolean) => void;
    onShowDocs?: () => void;
    onShowChangelog?: () => void;
    onExportPDF?: () => void;
    onExportJSON?: () => void;
  }

  const { onShowDocs, onShowChangelog, onExportPDF, onExportJSON } = $props<Props>();

  let showAbout = $state(false);
  let showExportMenu = $state(false);
  let exportFormat = $state('pdf');

  // PKG and BUILD_DATE are defined globally in vite.config.ts
  declare const PKG: { version: string; };
  declare const BUILD_DATE: string;

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

  function toggleDarkMode() {
    darkMode.update((v: boolean) => !v);
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
  <div class="header-left">
    <button
      class="menu-toggle"
      onclick={() => showMenu.update((v: boolean) => !v)}
      aria-label="Toggle menu"
      title="Toggle sidebar (M)"
    >
      <Menu size={18} />
    </button>
    <span class="app-title">TAO Export</span>
  </div>

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

  <div class="header-right">
    <button class="icon-btn" onclick={toggleDarkMode} aria-label="Toggle dark mode" title="Toggle dark mode">
      {#if $darkMode}
        <Sun size={18} />
      {:else}
        <Moon size={18} />
      {/if}
    </button>

    <div class="about-container">
      <button
        class="icon-btn"
        onclick={() => {
          showAbout = !showAbout;
        }}
        aria-label="About"
        title="About"
      >
        <Info size={18} />
      </button>
      {#if showAbout}
        <div class="about-menu">
          <button
            class="about-menu-item"
            onclick={() => {
              onShowDocs?.();
              showAbout = false;
            }}
          >
            <FileText size={14} />
            <span>Documentation</span>
          </button>
          <button
            class="about-menu-item"
            onclick={() => {
              onShowChangelog?.();
              showAbout = false;
            }}
          >
            <FileText size={14} />
            <span>Changelog</span>
          </button>
          <div class="about-menu-divider"></div>
          <div class="about-menu-info">
            <div class="info-row">
              <span class="info-label">Version</span>
              <span class="info-value">{PKG.version}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Build</span>
              <span class="info-value">{BUILD_DATE}</span>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</header>

<style>
  .header {
    position: sticky;
    top: 0;
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

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: fit-content;
  }

  .menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--text);
    border-radius: var(--radius);
    cursor: pointer;
    transition: background 0.2s;
  }

  .menu-toggle:hover {
    background: var(--surface);
  }

  .app-title {
    font-weight: 600;
    font-size: 16px;
    color: var(--text);
    white-space: nowrap;
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

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: fit-content;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--text);
    border-radius: var(--radius);
    cursor: pointer;
    transition: background 0.2s;
  }

  .icon-btn:hover {
    background: var(--surface);
  }

  .header-link {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 500;
    color: var(--accent);
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: var(--radius);
    transition: all 0.2s;
    white-space: nowrap;
  }

  .header-link:hover {
    background: var(--surface);
    text-decoration: underline;
  }

  .export-container {
    position: relative;
  }

  .btn-get-pdf {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: var(--radius);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
    white-space: nowrap;
  }

  .btn-get-pdf:hover {
    opacity: 0.9;
  }

  .export-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    padding: 8px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    min-width: 140px;
    z-index: 200;
    animation: fadeIn 0.15s ease;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .export-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: transparent;
    border: none;
    border-radius: var(--radius);
    color: var(--text);
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s;
    text-align: left;
  }

  .export-menu-item:hover {
    background: var(--surface);
  }

  .export-menu-item.active {
    background: var(--accent);
    background-opacity: 0.1;
    color: var(--accent);
  }

  .debug-container {
    position: relative;
  }

  .debug-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    padding: 12px 16px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    min-width: 160px;
    z-index: 200;
    animation: fadeIn 0.15s ease;
  }

  .debug-item {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 6px 0;
  }

  .debug-item:not(:last-child) {
    border-bottom: 1px solid var(--border);
  }

  .debug-label {
    font-size: 12px;
    color: var(--text-muted);
  }

  .debug-value {
    font-size: 12px;
    font-weight: 500;
    color: var(--text);
  }

  .about-container {
    position: relative;
  }

  .about-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    padding: 8px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    min-width: 180px;
    z-index: 200;
    animation: fadeIn 0.15s ease;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .about-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: transparent;
    border: none;
    border-radius: var(--radius);
    color: var(--text);
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s;
    text-align: left;
  }

  .about-menu-item:hover {
    background: var(--surface);
  }

  .about-menu-divider {
    height: 1px;
    background: var(--border);
    margin: 4px 0;
  }

  .about-menu-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 12px;
    border-top: 1px solid var(--border);
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .info-label {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
  }

  .info-value {
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
    font-family: monospace;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
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

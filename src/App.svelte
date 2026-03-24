<script lang="ts">
  import { slide } from "svelte/transition";
  import Settings from "./lib/Settings.svelte";
  import Tables from "./lib/Tables.svelte";
  import ZipInput from "./lib/ZipInput.svelte";
  import Question from "./template/Question.svelte";

  import "./app.css";

  import {
    compareMode,
    showMenu,
    questions,
    oldQuestions,
    inzage,
    zoom,
    multiple,
    merge,
    examsIndex,
    exams,
    windowName,
    randomizeQuestion,
    randomizeAnswer,
    questionMapping,
    answerMapping,
    showLetter,
    darkMode,
  } from "./store";
  import Log from "./lib/Log.svelte";

  import "@gzlab/uui/main.css";
  import { Switch, Text } from "@gzlab/uui";
  import { get } from "svelte/store";
  import MaintenanceOverlay from "./lib/MaintenanceOverlay.svelte";
  
  let titleHeader = "";
  let rrnHeader = "";

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
</script>

<svelte:head>
    <title>{$windowName}</title> 
</svelte:head>

<MaintenanceOverlay endTime={new Date('2026-01-17')} />
<main>
  <header class="header">
    <div class="header-left">
      <button class="menu-toggle" onclick={() => showMenu.update((v: boolean) => !v)} aria-label="Toggle menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <span class="app-title">TAO Export</span>
    </div>
    
    <div class="header-center">
      {#if $multiple && !$merge}
        <div class="exam-nav">
          <button class="nav-btn" onclick={() => moveIndex(-1)} aria-label="Previous exam">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <span class="exam-index">{$examsIndex + 1} / {get(exams).length}</span>
          <button class="nav-btn" onclick={() => moveIndex(+1)} aria-label="Next exam">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      {/if}
    </div>
    
    <div class="header-right">
      <button class="icon-btn" onclick={toggleDarkMode} aria-label="Toggle dark mode">
        {#if $darkMode}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        {:else}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        {/if}
      </button>
      <a href="/documentation.pdf" target="_blank" class="header-link" aria-label="Documentation">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>Docs</span>
      </a>
      <a
        href="https://github.com/SPF-Open/Tao_export/blob/Prod/CHANGELOG.md"
        target="_blank"
        class="header-link"
        aria-label="Changelog"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
        </svg>
        <span>Changelog</span>
      </a>
    </div>
  </header>

  <Log />
  
  <div class="content" class:sidebar-open={$showMenu}>
    {#if $showMenu}
      <aside class="sidebar" transition:slide={{ duration: 300 }}>
        <div class="sidebar-content">
          <Settings />
          <ZipInput />
          <Tables />
        </div>
      </aside>
    {/if}
    
    <div class="main-area">
      <div class="questions-container" style="zoom:{$zoom};">
        {#if $inzage}
          <div class="inzage-header hide-print">
            <div class="inzage-field">
              <Text bind:value={titleHeader} placeholder="Test name" />
            </div>
            <div class="inzage-field">
              <Text bind:value={rrnHeader} placeholder="RRN" />
            </div>
          </div>
          <div class="inzage-header inzage-header-print">
            <div class="inzage-field-print">
              <span class="inzage-label">Test:</span>
              <span class="inzage-value">{titleHeader}</span>
            </div>
            <div class="inzage-field-print">
              <span class="inzage-label">RRN:</span>
              <span class="inzage-value">{rrnHeader}</span>
            </div>
          </div>
        {/if}

        {#if $questions.length > 0}
          {#each $questions as question}
            <Question {question} />
          {/each}
        {/if}
         
        {#if ($randomizeQuestion || $randomizeAnswer) && $questions.length > 0}
          <div class="mapping-table">
            <h3>Mapping</h3>
            <table class="mapping-main-table">
              <thead>
                <tr>
                  {#if $randomizeQuestion}
                    <th>#</th>
                    <th>Question</th>
                    <th>Orig</th>
                  {/if}
                  {#if $randomizeAnswer}<th>Answers</th>{/if}
                </tr>
              </thead>
              <tbody>
                {#each $questionMapping.filter((m: { type: string }) => m.type !== 'Instruction' && m.type !== 'Instruction QCM' && m.type !== 'Instruction QO') as qm, i}
                  {@const ansMap = $answerMapping.find((a: { title: string }) => a.title.trim() === qm.title.trim())?.mapping || []}
                  <tr>
                    {#if $randomizeQuestion}
                      <td>{qm.currentIndex}</td>
                      <td>{qm.title}</td>
                      <td>{qm.originalIndex}</td>
                    {/if}
                    {#if $randomizeAnswer && ansMap.length > 0}
                      <td class="answer-cell">
                        {#each ansMap as am: { currentIndex: number; originalIndex: number; id: string }}
                          <span class="answer-item" title="Original: {$showLetter ? String.fromCharCode(64 + am.originalIndex) : am.originalIndex}">
                            {am.currentIndex}→{am.originalIndex}
                          </span>{#if am !== ansMap[ansMap.length-1]}, {/if}
                        {/each}
                      </td>
                    {:else if $randomizeAnswer}
                      <td class="answer-cell">-</td>
                    {/if}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
      
      {#if $oldQuestions.length > 0 && $compareMode}
        <div class="questions-container compare-mode">
          {#each $oldQuestions as question}
            <Question {question} />
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <footer class="footer">
    <div class="footer-left">
      <span>&copy; Benoit-Welsch</span>
      <span class="version">v{PKG.version}</span>
    </div>
    <div class="footer-right">
      <span class="build-time">Build time: {BUILD_DATE}</span>
    </div>
  </footer>
</main>

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
    transition: background 0.2s;
  }

  .menu-toggle:hover {
    background: var(--surface);
  }

  .app-title {
    font-weight: 600;
    font-size: 16px;
    color: var(--text);
  }

  .header-center {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .exam-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    background: var(--surface);
    border-radius: var(--radius);
    border: 1px solid var(--border);
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
    color: var(--text-muted);
    border-radius: var(--radius);
    transition: all 0.2s;
  }

  .header-link:hover {
    background: var(--surface);
    color: var(--text);
    text-decoration: none;
  }

  .content {
    display: flex;
    flex: 1;
    min-height: calc(100vh - var(--header-height) - 40px);
  }

  .sidebar {
    width: var(--sidebar-width);
    flex-shrink: 0;
    background: var(--surface);
    border-right: 1px solid var(--border);
    overflow: hidden;
  }

  .sidebar-content {
    position: fixed;
    height: calc(100vh - var(--header-height));
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .main-area {
    flex: 1;
    padding: 0 16px;
    min-width: 0;
  }

  .questions-container {
    max-width: 1080px;
    margin: 0 auto;
  }

  .questions-container.compare-mode {
    margin-top: 32px;
    padding-top: 32px;
    border-top: 2px solid var(--border);
  }

  .inzage-header {
    padding: 12px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface);
    margin-bottom: 24px;
    display: flex;
    justify-content: center;
    gap: 48px;
  }

  .inzage-field {
    flex: 1;
    max-width: 300px;
  }

  .inzage-header-print {
    display: none;
  }

  .inzage-field-print {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .inzage-label {
    font-weight: 600;
    color: var(--text);
  }

  .inzage-value {
    color: var(--text);
  }

  @media print {
    .inzage-header {
      display: none;
    }

    .inzage-header-print {
      display: flex !important;
      justify-content: center;
      gap: 48px;
      padding: 12px 16px;
      border: 1px solid #000;
      border-radius: var(--radius-lg);
      margin-bottom: 24px;
    }

    .inzage-label {
      font-weight: 700;
    }
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    padding: 0 16px;
    background: var(--surface);
    border-top: 1px solid var(--border);
    font-size: 12px;
    color: var(--text-muted);
  }

  .footer-left, .footer-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .version {
    font-weight: 500;
  }

  .mapping-table {
    margin-top: 32px;
    padding: 20px;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface);
  }

  .mapping-table h3 {
    margin: 0 0 16px 0;
    color: var(--text);
    font-size: 16px;
    font-weight: 600;
  }

  .mapping-table table {
    width: 100%;
    border-collapse: collapse;
  }

  .mapping-table th,
  .mapping-table td {
    border: 1px solid var(--border);
    padding: 8px 12px;
    text-align: left;
    font-size: 13px;
  }

  .mapping-table th {
    background: var(--surface);
    font-weight: 600;
    color: var(--text);
  }

  .mapping-main-table {
    width: 100%;
  }

  .answer-cell {
    white-space: nowrap;
  }

  .answer-item {
    display: inline-block;
    background: var(--border);
    padding: 2px 6px;
    margin: 2px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  @media print {
    .header, .sidebar, .footer {
      display: none !important;
    }
    
    .main-area {
      padding: 0;
    }
    
    .questions-container {
      max-width: none;
    }
  }
</style>

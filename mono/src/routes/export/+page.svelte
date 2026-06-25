<script lang="ts">
  import Settings from "$lib/export/Settings.svelte";
  import ZipInput from "$lib/export/ZipInput.svelte";
  import ZipDropZone from "$lib/export/ZipDropZone.svelte";
  import Question from "$lib/export/template/Question.svelte";
  import AuditTab from "$lib/export/audit/AuditTab.svelte";
  import TextInput from "$lib/ui/TextInput.svelte";
  import { EmptyState } from "$lib/ui";
  import { FileArchive } from "lucide-svelte";
  import { sidebarEnabled } from "$lib/sidebar";
  import { showDocsStore, showChangelogStore } from "$lib/about";

  import {
    compareExamIndex1,
    compareExamIndex2,
    showMenu,
    activeItems,
    showItems,
    showInstruction,
    inzage,
    zoom,
    multiple,
    assessments,
    examsIndex,
    windowName,
    randomizeQuestion,
    randomizeAnswer,
    questionMapping,
    answerMapping,
    showLetter,
    currentPage,
  } from "$lib/export/store";
  import { JsonAdapter } from "$lib/questions/adapters/json.js";
  import ExamToolsBadge from "$lib/questions/ExamToolsBadge.svelte";
  import ChangelogModal from "$lib/export/ChangelogModal.svelte";
  import DocumentationModal from "$lib/export/DocumentationModal.svelte";

  import { get } from "svelte/store";


  let titleHeader = $state("");
  let rrnHeader = $state("");
  let showChangelog = $state(false);
  let showDocumentation = $state(false);

  $effect(() => {
    if ($showDocsStore) { showDocumentation = true; showDocsStore.set(false); }
  });
  $effect(() => {
    if ($showChangelogStore) { showChangelog = true; showChangelogStore.set(false); }
  });

  async function exportToJson() {
    const list = get(assessments);
    const index = get(examsIndex);
    const assessment = list[index];
    if (!assessment) return;
    const adapter = new JsonAdapter();
    const blob = await adapter.write(assessment);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${get(windowName).replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportToPdf() {
    window.print();
  }

  function toggleItemShow(itemId: string, show: boolean) {
    showItems.update(m => { const u = new Map(m); u.set(itemId, show); return u; });
  }

  function isItemVisible(itemId: string, itemType: string): boolean {
    if (itemType === 'instruction' && !$showInstruction) {
      return $showItems.get(itemId) === true;
    }
    return $showItems.get(itemId) !== false;
  }

  $effect(() => {
    const visible = $showInstruction;
    const items = $activeItems;
    const map = new Map($showItems);
    let changed = false;
    for (const item of items) {
      if (item.type !== 'instruction') continue;
      if (!visible) {
        if (map.get(item.id) !== false) { map.set(item.id, false); changed = true; }
      } else {
        if (map.has(item.id)) { map.delete(item.id); changed = true; }
      }
    }
    if (changed) showItems.set(map);
  });

  $effect(() => {
    sidebarEnabled.set(true);
    return () => sidebarEnabled.set(false);
  });
</script>

<svelte:head>
    <title>{$windowName}</title> 
</svelte:head>

<main>
  <div class="content" class:sidebar-open={$showMenu}>
    {#if $showMenu}
      <aside class="sidebar" >
        <div class="sidebar-content">
          <div class="mode-switch">
            <button
              class="mode-btn"
              class:active={$currentPage !== 'audit'}
              onclick={() => currentPage.set('questions')}
            >Questions</button>
            <button
              class="mode-btn"
              class:active={$currentPage === 'audit'}
              onclick={() => currentPage.set('audit')}
            >Audit</button>
          </div>
          <Settings />
          <ZipInput onExportPDF={exportToPdf} onExportJSON={exportToJson} />
        </div>
      </aside>
    {/if}
    
    <div class="main-area">
      {#if $currentPage === 'audit'}
        <!-- Audit View -->
        <AuditTab />
      {:else if $currentPage === 'compare' && $multiple && $assessments.length > 1 && $compareExamIndex1 >= 0 && $compareExamIndex2 >= 0}
        <div class="compare-wrapper">
          <!-- Exam Selector -->
          <div class="compare-selector hide-print">
            <div class="selector-group">
              <label for="exam-select-1">Test A:</label>
              <select id="exam-select-1" bind:value={$compareExamIndex1} class="exam-select">
                {#each $assessments as a, i}
                  <option value={i}>{a.title || `Exam ${i + 1}`}</option>
                {/each}
              </select>
            </div>
            <div class="selector-group">
              <label for="exam-select-2">Test B:</label>
              <select id="exam-select-2" bind:value={$compareExamIndex2} class="exam-select">
                {#each $assessments as a, i}
                  <option value={i}>{a.title || `Exam ${i + 1}`}</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="compare-column">
            <div class="compare-label">{$assessments[$compareExamIndex1]?.title || `Test A`}</div>
            <div class="questions-container" style="zoom:{$zoom};">
              {#if $inzage}
                <div class="inzage-header hide-print">
                  <div class="inzage-field">
                    <TextInput bind:value={titleHeader} placeholder="Test name" />
                  </div>
                  <div class="inzage-field">
                    <TextInput bind:value={rrnHeader} placeholder="RRN" />
                  </div>
                </div>
              {/if}
              {#each $assessments[$compareExamIndex1]?.sections.flatMap(s => s.items) ?? [] as item}
                {@const show = isItemVisible(item.id, item.type)}
                <Question {item} {show} onToggleShow={(s) => toggleItemShow(item.id, s)} />
              {/each}
            </div>
          </div>
          <div class="compare-column">
            <div class="compare-label">{$assessments[$compareExamIndex2]?.title || `Test B`}</div>
            <div class="questions-container" style="zoom:{$zoom};">
              {#if $inzage}
                <div class="inzage-header hide-print">
                  <div class="inzage-field">
                    <TextInput bind:value={titleHeader} placeholder="Test name" />
                  </div>
                  <div class="inzage-field">
                    <TextInput bind:value={rrnHeader} placeholder="RRN" />
                  </div>
                </div>
              {/if}
              {#each $assessments[$compareExamIndex2]?.sections.flatMap(s => s.items) ?? [] as item}
                {@const show = isItemVisible(item.id, item.type)}
                <Question {item} {show} onToggleShow={(s) => toggleItemShow(item.id, s)} />
              {/each}
            </div>
          </div>
        </div>
      {:else if $assessments.length === 0}
        <div class="dropzone-center">
          <EmptyState
            icon={FileArchive}
            title="Import a TAO export"
            description="Upload the .zip package exported from TAO to preview and export it."
          >
            {#snippet children()}
              <div class="dropzone-inner">
                <ZipDropZone />
              </div>
            {/snippet}
          </EmptyState>
        </div>
      {:else}
        <div class="questions-container" style="zoom:{$zoom};">
          {#if $inzage}
            <div class="inzage-header hide-print">
              <div class="inzage-field">
                <TextInput bind:value={titleHeader} placeholder="Test name" />
              </div>
              <div class="inzage-field">
                <TextInput bind:value={rrnHeader} placeholder="RRN" />
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

          {#if $activeItems.length > 0}
            {@const activeAssessment = $assessments[$examsIndex]}
            {#if activeAssessment}
              <div class="exam-header hide-print">
                <ExamToolsBadge
                  tools={activeAssessment.metadata.tools}
                  timeLimits={activeAssessment.metadata.timeLimits}
                />
              </div>
            {/if}
            {#each $activeItems as item}
              {@const show = isItemVisible(item.id, item.type)}
              <Question {item} {show} onToggleShow={(s) => toggleItemShow(item.id, s)} />
            {/each}
          {/if}

          {#if ($randomizeQuestion || $randomizeAnswer) && $activeItems.length > 0}
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
                  {#each $questionMapping.filter((m: { type: string }) => m.type !== 'instruction') as qm}
                    {@const ansMap = $answerMapping.find((a: { title: string }) => a.title.trim() === qm.title.trim())?.mapping || []}
                    <tr>
                      {#if $randomizeQuestion}
                        <td>{qm.currentIndex}</td>
                        <td>{qm.title}</td>
                        <td>{qm.originalIndex}</td>
                      {/if}
                      {#if $randomizeAnswer && ansMap.length > 0}
                        <td class="answer-cell">
                          {#each ansMap as am}
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
      {/if}
    </div>
  </div>

  {#if showChangelog}
    <ChangelogModal onClose={() => showChangelog = false} />
  {/if}

  {#if showDocumentation}
    <DocumentationModal onClose={() => showDocumentation = false} />
  {/if}
</main>

<style>
  .content {
    display: flex;
    flex: 1;
    min-height: calc(100vh - var(--layout-header-height) - var(--header-height) - 40px);
  }

  .sidebar {
    position: sticky;
    top: calc(var(--layout-header-height));
    height: calc(100vh - var(--layout-header-height));
    width: var(--sidebar-width);
    background: var(--surface);
    border-right: 1px solid var(--border);
    box-shadow: var(--shadow-lg);
    z-index: 50;
    overflow-y: auto;
    scrollbar-gutter: stable;
  }

  .sidebar-content {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .mode-switch {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
  }

  .mode-btn {
    flex: 1;
    padding: 6px 10px;
    background: transparent;
    border: none;
    border-radius: var(--radius);
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .mode-btn:hover {
    color: var(--text);
  }

  .mode-btn.active {
    background: var(--accent);
    color: var(--accent-foreground);
  }

  .main-area {
    flex: 1;
    padding: 0 16px;
    min-width: 0;
    transition: margin-left 0.3s ease;
  }

  .dropzone-center {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - var(--layout-header-height) - var(--header-height) - 80px);
  }

  .dropzone-inner {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
  }

  .dropzone-inner :global(.file-input-area) {
    padding: 36px 16px;
  }
  
  .questions-container {
    max-width: 1080px;
    margin: 0 auto;
  }

  .exam-header {
    padding: 12px 0 4px;
  }

  .compare-wrapper {
    margin-top: 16px;
    display: flex;
    gap: 24px;
    align-items: flex-start;
  }

  .compare-column {
    flex: 1;
    min-width: 0;
  }

  .compare-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-muted);
    text-align: center;
    padding: 8px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    margin-bottom: 16px;
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
    .sidebar {
      display: none !important;
    }
    
    .main-area {
      padding: 0;
    }
    
    .questions-container {
      max-width: none;
    }
  }

  .compare-selector {
    margin-bottom: 16px;
    padding: 12px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    display: flex;
    gap: 24px;
    align-items: center;
  }

  .selector-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .selector-group label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }

  .exam-select {
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    font-size: 13px;
    cursor: pointer;
  }

  .exam-select:hover {
    border-color: var(--border-strong);
  }

  .exam-select:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-alpha);
  }
</style>

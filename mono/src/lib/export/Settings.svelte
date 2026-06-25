<script lang="ts">
  import Switch from "$lib/ui/Switch.svelte";
  import TextInput from "$lib/ui/TextInput.svelte";
  import ZoomControl from "$lib/ui/ZoomControl.svelte";
  import {
    compareMode,
    inzage,
    showAnswer,
    showInstruction,
    showLetter,
    sort,
    zoom,
    multiple,
    merge,
    randomizeAnswer,
    randomizeQuestion,
    darkMode,
    questions,
  } from "./store";
  import { slide } from "svelte/transition";
  import type { QuestionType } from "./helper";
  import {
    Eye,
    EyeOff,
    Settings,
    HelpCircle,
    FileText,
    Layout,
    List,
    Type,
    Folder,
    Grid,
    GripVertical,
    Shuffle,
    ChevronDown,
  } from "lucide-svelte";
  import Tables from "./Tables.svelte";

  // Load section sectionState from localStorage
  function loadSectionState() {
    if (typeof localStorage === "undefined")
      return {
        general: false,
        filtering: false,
        paperTest: false,
        advanced: false,
      };
    const stored = localStorage.getItem("settings-panels");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migrate old 5-section structure to new structure
        if ("display" in parsed || "manipulation" in parsed) {
          return {
            general: parsed.display ?? false,
            filtering: parsed.filtering ?? false,
            paperTest: parsed.manipulation ?? false,
            advanced: parsed.export ?? parsed.advanced ?? false,
          };
        }
        return parsed;
      } catch {
        return {
          general: true,
          filtering: false,
          paperTest: false,
          advanced: false,
        };
      }
    }
    return {
      general: false,
      filtering: false,
      paperTest: false,
      advanced: false,
    };
  }

  let sectionState = $state(loadSectionState());

  // Save section sectionState to localStorage
  $effect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("settings-panels", JSON.stringify(sectionState));
    }
  });

  // Question list sectionState
  let questionListChecked = $state(true);
  let questionListText = $state("");
  let questionListContainer: HTMLUListElement | null = $state(null);
  let itemDraggingIndex = $state(-1);
  let itemHoveredIndex = $state(-1);
  let itemDragged: QuestionType | null = $state(null);
  let mouseYCoordinate = $state(-1);
  let distanceTopGrabbedVsPointer = $state(-1);

  $effect.pre(() => {
    if (questionListText) {
      const qn = questionListText.split(",").map((n: string) => n.trim());
      questions.update((o) =>
        o.map((q) => ({
          ...q,
          show: qn.includes(q.title.split(" ")[1]),
        })),
      );
    }
  });

  function changeQuestionSelection() {
    questions.update((o) =>
      o.map((q) => ({ ...q, show: questionListChecked })),
    );
  }

  function toggleQuestion(index: number, value: boolean) {
    questions.update((o) =>
      o.map((q, i) => (i === index ? { ...q, show: value } : q)),
    );
  }

  function onDragStart(
    e: DragEvent & { currentTarget: EventTarget & HTMLDivElement },
    i: number,
    question: QuestionType,
  ) {
    mouseYCoordinate = e.clientY;
    itemDragged = question;
    itemDraggingIndex = i;
    distanceTopGrabbedVsPointer =
      e.currentTarget.getBoundingClientRect().y - e.clientY;
  }

  $effect.pre(() => {
    if (
      itemDraggingIndex != -1 &&
      itemHoveredIndex != -1 &&
      itemDraggingIndex != itemHoveredIndex
    ) {
      questions.update((list) => {
        [list[itemDraggingIndex], list[itemHoveredIndex]] = [
          list[itemHoveredIndex],
          list[itemDraggingIndex],
        ];
        return list;
      });
      itemDraggingIndex = itemHoveredIndex;
    }
  });
</script>

<div class="settings-panel">
  <Tables />
  <!-- General Section -->
  <div class="settings-section">
    <button
      class="section-header"
      onclick={() => (sectionState.general = !sectionState.general)}
    >
      <div class="section-title">
        <Settings size={16} />
        <span>General</span>
      </div>
      <div class="section-toggle" class:open={sectionState.general}>
        <ChevronDown size={12} />
      </div>
    </button>
    {#if sectionState.general}
      <div class="section-content" transition:slide={{ duration: 200 }}>
        <div class="setting-row">
          <span class="setting-label">
            <Eye size={14} />
            <span>Show Instructions</span>
          </span>
          <Switch bind:checked={$showInstruction} />
        </div>
        <div class="setting-row">
          <span class="setting-label">
            <List size={14} />
            <span>Sort Questions</span>
          </span>
          <Switch bind:checked={$sort} />
        </div>
      </div>
    {/if}
  </div>

  <!-- Paper Test Section -->
  <div class="settings-section">
    <button
      class="section-header"
      onclick={() => (sectionState.paperTest = !sectionState.paperTest)}
    >
      <div class="section-title">
        <Shuffle size={16} />
        <span>Paper Test</span>
      </div>
      <div class="section-toggle" class:open={sectionState.paperTest}>
        <ChevronDown size={12} />
      </div>
    </button>
    {#if sectionState.paperTest}
      <div class="section-content" transition:slide={{ duration: 200 }}>
        <div class="setting-row">
          <span class="setting-label">
            <Shuffle size={14} />
            <span>Randomize Answers</span>
          </span>
          <Switch bind:checked={$randomizeAnswer} />
        </div>
        <div class="setting-row">
          <span class="setting-label">
            <Shuffle size={14} />
            <span>Randomize Questions</span>
          </span>
          <Switch bind:checked={$randomizeQuestion} />
        </div>
        <div class="setting-row">
          <span class="setting-label">
            <Type size={14} />
            <span>Show Letter (A, B, C)</span>
          </span>
          <Switch bind:checked={$showLetter} />
        </div>
        <div class="setting-row">
          <span class="setting-label">
            <Eye size={14} />
            <span>Show Answers</span>
          </span>
          <Switch bind:checked={$showAnswer} />
        </div>
      </div>
    {/if}
  </div>

  <!-- Advanced Section -->
  <div class="settings-section">
    <button
      class="section-header"
      onclick={() => (sectionState.advanced = !sectionState.advanced)}
    >
      <div class="section-title">
        <Settings size={16} />
        <span>Advanced</span>
      </div>
      <div class="section-toggle" class:open={sectionState.advanced}>
        <ChevronDown size={12} />
      </div>
    </button>
    {#if sectionState.advanced}
      <div class="section-content" transition:slide={{ duration: 200 }}>
        <div class="setting-row">
          <span class="setting-label">
            <FileText size={14} />
            <span>Inzage Mode</span>
          </span>
          <Switch bind:checked={$inzage} />
        </div>
        <div class="setting-row">
          <span class="setting-label">
            <Folder size={14} />
            <span>Multiple Files</span>
          </span>
          <Switch bind:checked={$multiple} />
        </div>
        <div class="setting-row">
          <span class="setting-label">
            <Type size={14} />
            <span>Zoom Level</span>
          </span>
          <ZoomControl bind:value={$zoom} />
        </div>
        {#if $multiple}
          <div class="setting-row sub-setting">
            <span class="setting-label">
              <Layout size={14} />
              <span>Compare Test</span>
            </span>
            <Switch bind:checked={$compareMode} />
          </div>
          <div class="setting-row sub-setting">
            <span class="setting-label">
              <Grid size={14} />
              <span>Merge Files</span>
            </span>
            <Switch bind:checked={$merge} />
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Question Filtering Section -->
  {#if $questions && $questions.length}
    <div class="settings-section">
      <button
        class="section-header"
        onclick={() => (sectionState.filtering = !sectionState.filtering)}
      >
        <div class="section-title">
          <List size={16} />
          <span>Question Filtering</span>
        </div>
        <div class="section-toggle" class:open={sectionState.filtering}>
          <ChevronDown size={12} />
        </div>
      </button>
      {#if sectionState.filtering}
        <div
          class="section-content question-list-section"
          transition:slide={{ duration: 200 }}
        >
          <TextInput
            placeholder="Filter (ex: 12,13,15)"
            bind:value={questionListText}
          />

          <div class="question-list-header">
            <label class="checkbox-label">
              <input
                type="checkbox"
                id="show-all-q"
                bind:checked={questionListChecked}
                onchange={changeQuestionSelection}
              />
              <span>All Questions</span>
            </label>
          </div>

          <ul class="question-list-items" bind:this={questionListContainer}>
            {#each $questions as question, i (question.title + i)}
              <li ondragover={(e) => e.preventDefault()}>
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    id="{question.title}-{i}"
                    checked={question.show}
                    onchange={(e) => toggleQuestion(i, e.currentTarget.checked)}
                  />
                </label>
                <div
                  class="drag-handle"
                  role="button"
                  tabindex="0"
                  draggable="true"
                  ondragstart={(e) => onDragStart(e, i, question)}
                  ondragover={() => (itemHoveredIndex = i)}
                >
                  <GripVertical size={16} />
                </div>
                <label for="{question.title}-{i}" class="question-title"
                  >{question.title}</label
                >
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .settings-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .settings-section {
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .section-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
  }

  .section-header:hover {
    background: var(--surface);
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
  }

  .section-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    transition: transform 0.2s;
  }

  .section-toggle.open {
    transform: rotate(180deg);
  }

  .section-content {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-top: 1px solid var(--border);
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
  }

  .setting-row:not(:last-child) {
    border-bottom: 1px solid var(--border);
  }

  .setting-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text);
  }

  .sub-setting {
    padding-left: 8px;
  }

  .sub-setting .setting-label {
    font-size: 12px;
    color: var(--text-muted);
  }

  .question-list-section {
    flex-direction: column;
    gap: 8px;
    display: flex;
    min-height: 0;
  }

  .question-list-header {
    padding: 6px 0;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .question-list-items {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 13px;
    min-height: 0;
  }

  .question-list-items li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid var(--border-strong);
  }

  .question-list-items li:last-child {
    border-bottom: none;
  }

  .drag-handle {
    width: 16px;
    height: 16px;
    cursor: move;
    opacity: 0.5;
    transition: opacity 0.15s;
  }

  .drag-handle:hover {
    opacity: 1;
  }

  .question-title {
    flex: 1;
    color: var(--text);
    font-size: 13px;
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--primary);
  }

  .checkbox-label span {
    font-size: 13px;
    color: var(--text);
  }

</style>

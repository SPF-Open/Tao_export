<script lang="ts">
  import { Text } from "@gzlab/uui";
  import { questions } from "../store";
  import type { QuestionType } from "./helper";
  let checked = true;
  let text = "";

  $: if (text) {
    const qn = text.split(",").map((n) => n.trim());
    questions.update((o) =>
      o.map((q) => ({
        ...q,
        show: qn.includes(q.title.split(" ")[1]),
      })),
    );
  }

  const OnDragStart = (
    e: DragEvent & { currentTarget: EventTarget & HTMLImageElement },
    i: number,
    question: QuestionType,
  ) => {
    mouseYCoordinate = e.clientY;
    itemDragged = question;
    itemDraggingIndex = i;

    distanceTopGrabbedVsPointer =
      e.currentTarget.getBoundingClientRect().y - e.clientY;
  };

  const changeSelection = () => {
    questions.update((o) => o.map((q) => ({ ...q, show: checked })));
  };

  let mouseYCoordinate: number = -1;
  let distanceTopGrabbedVsPointer: number = -1;

  let itemDraggingIndex: number = -1;
  let itemHoveredIndex: number = -1;
  let itemDragged: QuestionType | null = null;

  $: {
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
  }

  let container = null;
</script>

{#if $questions && $questions.length}
  <div class="table-container">
    <div class="nb-questions">
      <span class="stat qo">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="stat-value">{$questions.filter((q) => q.type === "QO").length}</span>
        <span class="stat-label">QO</span>
        <span class="stat-count">({$questions.filter((q) => q.type === "Instruction QO" && q.show).length})</span>
      </span>
      <span class="stat qcm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 11 12 14 22 4"></polyline>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        <span class="stat-value">{$questions.filter((q) => q.type === "QCM").length}</span>
        <span class="stat-label">QCM</span>
        <span class="stat-count">({$questions.filter((q) => q.type === "QCM" && q.show).length})</span>
      </span>
    </div>
    
    <Text id="SelectQuestion" placeholder="Filter (ex: 12,13,15)" bind:value={text} />
    
    <div class="question-list">
      <div class="list-header">
        <label class="checkbox-label">
          <input
            type="checkbox"
            id="show-all-q"
            bind:checked
            on:change={changeSelection}
          />
          <span>All</span>
        </label>
      </div>
      <ul bind:this={container}>
        {#each $questions as question, i}
          <li on:dragover|preventDefault>
            <label class="checkbox-label">
              <input
                type="checkbox"
                id="{question.title}-{i}"
                bind:checked={question.show}
              />
            </label>
            <img
              src="/reorder-three.svg"
              alt="Drag to reorder"
              draggable="true"
              on:dragstart={(e) => OnDragStart(e, i, question)}
              on:dragover={() => (itemHoveredIndex = i)}
              class="drag-handle"
            />
            <label for="{question.title}-{i}" class="question-title">{question.title}</label>
          </li>
        {/each}
      </ul>
    </div>
  </div>
{/if}

<style>
  .table-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
    min-height: 0;
  }

  .nb-questions {
    display: flex;
    gap: 16px;
    padding: 10px 12px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-muted);
  }

  .stat-value {
    font-weight: 600;
    color: var(--text);
  }

  .stat-label {
    font-weight: 500;
  }

  .stat-count {
    color: var(--text-muted);
    font-size: 11px;
  }

  .stat.qo svg {
    color: #8b5cf6;
  }

  .stat.qcm svg {
    color: #10b981;
  }

  .question-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    min-height: 200px;
    max-height: 45vh;
  }

  .list-header {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    overflow-y: auto;
    flex: 1;
  }

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
  }

  li:last-child {
    border-bottom: none;
  }

  li:hover {
    background: var(--surface);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 13px;
    color: var(--text);
  }

  .checkbox-label input[type="checkbox"] {
    width: 14px;
    height: 14px;
    accent-color: var(--accent);
  }

  .drag-handle {
    width: 16px;
    height: 16px;
    cursor: grab;
    opacity: 0.4;
    transition: opacity 0.15s;
    flex-shrink: 0;
  }

  .drag-handle:hover {
    opacity: 1;
  }

  .question-title {
    font-size: 13px;
    color: var(--text);
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>

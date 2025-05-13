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

  let mouseYCoordinate: number = -1; // pointer y coordinate within client
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
      // swap items
      questions.update((list) => {
        [list[itemDraggingIndex], list[itemHoveredIndex]] = [
          list[itemHoveredIndex],
          list[itemDraggingIndex],
        ];
        return list;
      });
      // balance
      itemDraggingIndex = itemHoveredIndex;
    }
  }

  let container = null;
</script>

{#if $questions && $questions.length}
  <div class="hide-print table">
    <div class="nb-questions hide-print">
      <span class="QO">
        QO : {$questions.filter((q) => q.type === "QO").length}
        ({$questions.filter((q) => q.type === "Instruction QO" && q.show)
          .length})
      </span>
      <span class="QCM">
        QCM : {$questions.filter((q) => q.type === "QCM").length}
        ({$questions.filter((q) => q.type === "QCM" && q.show).length})
      </span>
    </div>
    <Text id="SelectQuestion" placeholder="Filter (ex : 12,13,15)" bind:value={text} />
    <ul bind:this={container}>
      <li>
        <input
          type="checkbox"
          id="show-all-q"
          bind:checked
          on:change={changeSelection}
        />
        <label for="show-all-q">All</label>
      </li>
      {#each $questions as question, i}
        <li on:dragover|preventDefault>
          <input
            type="checkbox"
            id="{question.title}-{i}"
            bind:checked={question.show}
          />
          <img
            src="/reorder-three.svg"
            alt="Drag to reorder"
            draggable="true"
            on:dragstart={(e) => OnDragStart(e, i, question)}
            on:dragover={() => (itemHoveredIndex = i)}
          />
          <label for="{question.title}-{i}">{question.title}</label>
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  .table {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  ul {
    list-style: none;
    padding-left: 2px;
    margin: 0;
    overflow-y: scroll;
    position: relative;
    flex: 1;
    max-height: 48vh;
  }
  li {
    display: flex;
    gap: 0.2rem;
    align-items: center;
  }
  li img {
    margin-bottom: -0.2rem;
    width: 1.2rem;
    height: 1.2rem;
    cursor: grab;
  }
</style>

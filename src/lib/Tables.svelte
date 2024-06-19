<script lang="ts">
  import { questions } from '../store';
  let checked = true;
  let text = '';

  $: if (text) {
    const qn = text.split(',').map((n) => n.trim());
    questions.update((o) =>
      o.map((q) => ({
        ...q,
        show: qn.includes(q.title.split(' ')[1]),
      })),
    );
  }

  const changeSelection = () => {
    questions.update((o) => o.map((q) => ({ ...q, show: checked })));
  };

  let mouseYCoordinate = null; // pointer y coordinate within client
  let distanceTopGrabbedVsPointer = null;

  let draggingItem = null;
  let draggingItemId = null;
  let draggingItemIndex = null;

  let hoveredItemIndex = null;

  $: {
    // prevents the ghost flickering at the top
    if (mouseYCoordinate == null || mouseYCoordinate == 0) {
      // showGhost = false;
    }
  }

  $: {
    if (
      draggingItemIndex != null &&
      hoveredItemIndex != null &&
      draggingItemIndex != hoveredItemIndex
    ) {
      // swap items
      questions.update((list) => {
        [list[draggingItemIndex], list[hoveredItemIndex]] = [
          list[hoveredItemIndex],
          list[draggingItemIndex],
        ];
        return list;
      });
      // balance
      draggingItemIndex = hoveredItemIndex;
    }
  }

  let container = null;
</script>

{#if !$questions || $questions.length}
  <div class="hide-print table">
    <h3>Show/Hide Question</h3>
    <div>
      <input
        type="text"
        id="SelectQuestion"
        placeholder="ex : 12,13,15"
        bind:value={text}
      />
    </div>
    <ul bind:this={container}>
      {#if mouseYCoordinate}
        <li
          class="item ghost"
          style="top: {mouseYCoordinate +
            distanceTopGrabbedVsPointer}px; background: {draggingItem.value};"
        >
          {draggingItem.value}
        </li>
      {/if}
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
            alt=""
            draggable="true"
            on:dragstart={(e) => {
              mouseYCoordinate = e.clientY;
              //console.log('dragstart', mouseYCoordinate);

              draggingItem = question;
              draggingItemIndex = i;
              draggingItemId = i;

              distanceTopGrabbedVsPointer =
                e.target.getBoundingClientRect().y - e.clientY;
            }}
            on:drag={(e) => {
              mouseYCoordinate = e.clientY;
            }}
            on:dragover={(e) => {
              hoveredItemIndex = i;
            }}
            on:dragend={(e) => {
              draggingItemId = null; // makes item visible
              hoveredItemIndex = null; // prevents instant swap
            }}
          />
          <label for="{question.title}-{i}">{question.title}</label>
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  .table{
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  input[type='text'] {
    width: 99%;
  }
  h3 {
    margin: 0;
    font-size: 18px;
  }
  ul {
    list-style: none;
    padding-left: 2px;
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
  .ghost {
    margin-bottom: 10px;
    pointer-events: none;
    z-index: 99;
    position: absolute;
    top: 0;
    left: 10;
    background-color: white;
  }
</style>

<script lang="ts">
  import type { QuestionType } from "./helper";

  export let questions: QuestionType[] = [];
  let checked = true;

  let text = "";

  $: if (text) {
    const qn = text.split(",").map((n) => n.trim());
    questions = questions.map((q, n) => ({
      ...q,
      show: qn.includes(q.title.split(" ")[1]),
    }));
  }

  const changeSelection = () => {
    console.log("changeSelection", checked);
    questions = questions.map((q) => ({ ...q, show: checked }));
  };
</script>

{#if !questions || questions.length}
  <div class="hide-print">
    <h3>Show/Hide Question</h3>
    <div>
      <input type="text" id="SelectQuestion" bind:value={text} />
      <label for="SelectQuestion">ex : 12,13,15</label>
    </div>
    <ul>
      <li>
        <input type="checkbox" bind:checked on:change={changeSelection} />
        <span>All</span>
      </li>
      {#each questions as question (question.title)}
        <li>
          <input type="checkbox" bind:checked={question.show} />
          <span>{question.title}</span>
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  label {
    margin-left: 4px;
    filter: opacity(0.5);
  }
  h3 {
    margin: 0;
  }
  ul {
    list-style: none;
    padding-left: 0;
    overflow-y: scroll;
    max-height: 45vh;
  }
</style>

<script lang="ts">
  import type { QuestionType } from './helper';

  export let questions: QuestionType[] = [];
  let checked = true;

  let text = '';

  $: if (text) {
    const qn = text.split(',').map((n) => n.trim());
    questions = questions.map((q) => ({
      ...q,
      show: qn.includes(q.title.split(' ')[1]),
    }));
  }

  const changeSelection = () => {
    console.log('changeSelection', checked);
    questions = questions.map((q) => ({ ...q, show: checked }));
  };
</script>

{#if !questions || questions.length}
  <div class="hide-print">
    <h3>Show/Hide Question</h3>
    <div>
      <input type="text" id="SelectQuestion" placeholder="ex : 12,13,15" bind:value={text} />
    </div>
    <ul>
      <li>
        <input type="checkbox" id="show-all-q" bind:checked on:change={changeSelection} />
        <label for="show-all-q">All</label>
      </li>
      {#each questions as question,i (question.title)}
        <li>
          <input type="checkbox" id="{question.title}-{i}" bind:checked={question.show} />
          <label for="{question.title}-{i}">{question.title}</label>
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
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
    max-height: 40vh;
  }
</style>

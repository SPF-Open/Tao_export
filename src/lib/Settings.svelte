<script lang="ts">
  import { slide } from 'svelte/transition';

  export let hideAnswer = false;
  export let showInstruction = true;
  export let showLetter = false;
  export let compare = false;
  export let inzage = false;
  export let sort = false;

  export let showExtra = false;
</script>

<h4>Main</h4>
<div class="">
  <fieldset class="hide-print">
    <legend>Answer</legend>
    <input
      type="radio"
      id="show-answer"
      value={false}
      name="answer"
      bind:group={hideAnswer}
    />
    <label for="show-answer">Show</label>
    <input
      type="radio"
      id="hide-answer"
      value={true}
      name="answer"
      bind:group={hideAnswer}
    />
    <label for="hide-answer">Hide</label>
  </fieldset>
  <fieldset class="hide-print">
    <legend>Instruction</legend>
    <input
      type="radio"
      id="hide-instruction"
      value={true}
      name="Instruction"
      bind:group={showInstruction}
    />
    <label for="hide-instruction">Show</label>
    <input
      type="radio"
      id="show-instruction"
      value={false}
      name="Instruction"
      bind:group={showInstruction}
    />
    <label for="show-instruction">Hide</label>
  </fieldset>
</div>
<h4>
  <span>Extra</span>
  <button
    class="hide-extra"
    class:rotate={showExtra}
    on:click={() => (showExtra = !showExtra)}>></button
  >
</h4>
{#if showExtra}
  <div transition:slide>
    <fieldset class="hide-print">
      <legend>Letter</legend>
      <input
        type="radio"
        id="hide-letter"
        value={true}
        name="Letter"
        bind:group={showLetter}
      />
      <label for="hide-letter">Show</label>
      <input
        type="radio"
        id="show-letter"
        value={false}
        name="Letter"
        bind:group={showLetter}
      />
      <label for="show-letter">Hide</label>
    </fieldset>

    <fieldset class="hide-print">
      <legend>Compare test</legend>
      <input
        type="radio"
        id="compare-enable"
        value={true}
        name="Compare"
        bind:group={compare}
      />
      <label for="compare-enable">Show</label>
      <input
        type="radio"
        id="compare-disable"
        value={false}
        name="Compare"
        bind:group={compare}
      />
      <label for="compare-disable">Hide</label>
    </fieldset>

    <fieldset class="hide-print">
      <legend>Inzage mode</legend>
      <input
        type="radio"
        id="inzage-enable"
        value={true}
        name="Inzage"
        bind:group={inzage}
      />
      <label for="inzage-enable">Enable</label>
      <input
        type="radio"
        id="inzage-disable"
        value={false}
        name="Inzage"
        bind:group={inzage}
      />
      <label for="inzage-disable">Disable</label>
    </fieldset>
    <fieldset>
      <legend>Sort question</legend>
      <input
        type="radio"
        name="OrderByTitle"
        id="orderByTitle-on"
        value="true"
        bind:group={sort}
      />
      <label for="orderByTitle-on">Enable</label>

      <input
        type="radio"
        name="OrderByTitle"
        id="orderByTitle-off"
        value={false}
        bind:group={sort}
      />
      <label for="orderByTitle-off">Disable</label>
    </fieldset>
  </div>
{/if}

<style>
  fieldset {
    margin: 0;
    padding: 3px 5px;
    font-size: 14px;
  }
  h4 {
    margin: 2px 0;
    padding: 0;
    font-size: 14px;
  }

  .hide-extra {
    rotate: 90deg;
  }
</style>

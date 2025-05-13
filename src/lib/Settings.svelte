<script lang="ts">
  import { Switch } from "@gzlab/uui";
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
  } from "../store";
  import { slide } from "svelte/transition";

  let state = $state({ main: true, extra: false, file: false });
</script>

<h4>🏠 Main</h4>
{#if state.main}
  <div class="options" class:show={state.main}>
    <legend>Answer</legend>
    <Switch bind:checked={$showAnswer} />
    <legend>Instruction</legend>
    <Switch bind:checked={$showInstruction} />
  </div>
{/if}

<h4>
  <span> ✨ Extra </span>
  <Switch bind:checked={state.extra} />
</h4>
{#if state.extra}
  <div class="options">
    <legend>Letter</legend>
    <Switch bind:checked={$showLetter} />
    <legend>Compare test</legend>
    <Switch bind:checked={$compareMode} />
    <legend>Inzage mode</legend>
    <Switch bind:checked={$inzage} />
    <legend>Sort question</legend>
    <Switch bind:checked={$sort} />
    <legend>Font size</legend>
    <input type="range" min="0.8" max="1.5" step="0.1" bind:value={$zoom} />
  </div>
{/if}
<h4>
  <span> 📁 Files </span>
  <Switch bind:checked={state.file} />
</h4>
{#if state.file}
  <div class="options">
    <legend>Mutiple file</legend>
    <Switch bind:checked={$multiple} />
    {#if $multiple}
      <div class="options">
        <legend>Merge file</legend>
        <Switch bind:checked={$merge} />
      </div>
    {/if}
  </div>
{/if}

<style>
  h4 {
    margin: 2px 0;
    padding: 0;
    font-size: 14px;
    display: grid;
    grid-template-columns: repeat(2, calc(100px - 4px));
    align-items: center;
    gap: 5px;
  }
  h4 > span {
    margin-top: -4px;
  }
  .options {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, 100px);
    grid-gap: 2px;
  }
  .options > div {
    grid-column: 1/-1;
  }
</style>

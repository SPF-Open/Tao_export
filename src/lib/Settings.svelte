<script lang="ts">
  import { Switch } from '@gzlab/uui/index';
  import {
    compareMode,
    inzage,
    showAnswer,
    showInstruction,
    showLetter,
    sort,
    zoom,
  } from '../store';
</script>

<h4>🏠 Main</h4>
<div class="options">
  <legend>Answer</legend>
  <Switch bind:checked={$showAnswer} />
  <legend>Instruction</legend>
  <Switch bind:checked={$showInstruction} />
</div>
<h4>
  <span>✨ Extra</span>
</h4>
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

<style>
  h4 {
    margin: 2px 0;
    padding: 0;
    font-size: 14px;
    display: flex;
    gap: 5px;
  }
  .options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    grid-gap: 2px;
  }
</style>

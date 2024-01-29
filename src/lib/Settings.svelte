<script lang="ts">
  import { ToggleSwitch } from '@lv00/sveltelib';

  export let showAnswer = true;
  export let showInstruction = true;
  export let showLetter = false;
  export let compare = false;
  export let inzage = false;
  export let sort = false;

</script>

<h4>🏠 Main</h4>
<div class="options hide-print">
  <legend>Answer</legend>
  <ToggleSwitch bind:checked={showAnswer} />
  <legend>Instruction</legend>
  <ToggleSwitch bind:checked={showInstruction} />
</div>
<h4>
  <span>✨ Extra</span>
</h4>
  <div class="options">
    <legend>Letter</legend>
    <ToggleSwitch bind:checked={showLetter} />
    <legend>Compare test</legend>
    <ToggleSwitch bind:checked={compare} />
    <legend>Inzage mode</legend>
    <ToggleSwitch bind:checked={inzage} />
    <legend>Sort question</legend>
    <ToggleSwitch bind:checked={sort}  />
  </div>
<style>
  h4 {
    margin: 2px 0;
    padding: 0;
    font-size: 14px;
    display: flex;
    gap: 5px;
  }
  .options{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    grid-gap: 2px;
  }
</style>

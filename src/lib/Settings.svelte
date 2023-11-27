<script lang="ts">
  export let hideAnswer = false;
  export let showInstruction = true;
  export let showLetter = false;
  export let compare = false;
  export let inzage = false;

</script>

<fieldset class="hide-print">
  <legend>Answer</legend>
  <input
    type="radio"
    id="show-answer"
    checked
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
    checked
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

<fieldset class="hide-print">
  <legend>Letter</legend>
  <input
    type="radio"
    id="hide-letter"
    checked
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
    checked
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
    checked
    name="Inzage"
    bind:group={inzage}
  />
  <label for="inzage-disable">Disable</label>
</fieldset>

<style>
  fieldset {
    margin: 0;
    padding: 5px;
  }
</style>

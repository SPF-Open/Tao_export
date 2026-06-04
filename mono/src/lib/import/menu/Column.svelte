<script>
  import {
    titleColumn,
    promptColumn,
    correctColumn,
    competencyColumn,
    dimensionColumn,
    indicatorColumn,
    TemplateColumn,
    followTemplate,
  } from "../helper/store";

  import OptionnalLetterPicker from "../container/OptionnalLetterPicker.svelte";
  import Char from "$lib/ui/Char.svelte";
  import Fieldset from "../container/Fieldset.svelte";

  let disabled = $state(true);

  followTemplate.subscribe((format) => {
    disabled = format !== TemplateColumn.OTHER;
  });
</script>

<Fieldset title="Column">
  <div class="columnPicker">
    <div class="sub">
      <label for="">Title</label>
      <Char bind:value={$titleColumn} {disabled} />
      <label for="">Prompt</label>
      <Char bind:value={$promptColumn} {disabled} />
      <label for="">Answer</label>
      <Char bind:value={$correctColumn} {disabled} />
    </div>
    <div class="line"></div>
    <div class="sub">
      <div>
        <label for="">Competency</label>
        <OptionnalLetterPicker bind:value={$competencyColumn} />
      </div>
      <div>
        <label for="">Dimension</label>
        <OptionnalLetterPicker bind:value={$dimensionColumn} />
      </div>
      <div>
        <label for="">Indicator</label>
        <OptionnalLetterPicker bind:value={$indicatorColumn} />
      </div>
    </div>
  </div>
</Fieldset>

<style>
  .columnPicker {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    flex: 1;
  }
  .columnPicker > div {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    align-items: center;
  }
  .line {
    background-color: var(--border);
    width: 1px;
  }
  .columnPicker .sub {
    flex-direction: column;
    flex: 1;
    justify-content: space-evenly;
  }
</style>

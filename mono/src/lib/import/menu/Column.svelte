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

<Fieldset title="Columns">
  <div class="grid">
    <span class="lbl">Title</span>
    <Char bind:value={$titleColumn} {disabled} />
    <span class="lbl">Prompt</span>
    <Char bind:value={$promptColumn} {disabled} />
    <span class="lbl">Answer</span>
    <Char bind:value={$correctColumn} {disabled} />

    <div class="divider"></div>

    <span class="lbl">Competency</span>
    <OptionnalLetterPicker bind:value={$competencyColumn} />
    <span class="lbl">Dimension</span>
    <OptionnalLetterPicker bind:value={$dimensionColumn} />
    <span class="lbl">Indicator</span>
    <OptionnalLetterPicker bind:value={$indicatorColumn} />
  </div>
</Fieldset>

<style>
  .grid {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 6px 12px;
    width: 100%;
  }

  .lbl {
    font-size: var(--font-size-base);
    color: var(--text-muted);
  }

  .divider {
    grid-column: 1 / -1;
    border-top: 1px solid var(--border);
    margin: 2px 0;
  }
</style>

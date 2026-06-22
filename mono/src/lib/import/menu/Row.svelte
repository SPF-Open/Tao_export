<script lang="ts">
  import Numeric from "$lib/ui/Numeric.svelte";
  import { alternative, rowOffset, skipRow } from "../helper/store";
</script>

<div class="rows">
  <div class="field">
    <label for="row-offset">First data row</label>
    <Numeric id="row-offset" name="First data row" bind:value={$rowOffset} size="sm" min={0} max={99} />
  </div>
  <div class="field">
    <label for="row-alternative">Answers per question</label>
    <Numeric id="row-alternative" name="Answers per question" bind:value={$alternative} size="sm" min={0} max={99} />
  </div>
  <div class="field">
    <label for="row-skip">Rows to skip between questions</label>
    <Numeric id="row-skip" name="Rows to skip" bind:value={$skipRow} size="sm" min={0} max={99} />
  </div>
</div>

<style>
  .rows {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  label {
    font-size: var(--font-size-base);
    color: var(--text);
  }
</style>

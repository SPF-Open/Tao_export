<script>
  import Numeric from "$lib/ui/Numeric.svelte";

  import {
    alternative,
    followTemplate,
    rowOffset,
    skipRow,
    TemplateColumn,
  } from "../helper/store";
  import Fieldset from "../container/Fieldset.svelte";

</script>

<Fieldset title="Row">
  <label for="">Offset</label>
  <Numeric
    name="Row offset"
    bind:value={$rowOffset}
    size="sm"
    max={99}
  />
  <label for="">Alternative</label>
  <Numeric
    name="Alternative"
    bind:value={$alternative}
    size="sm"
    max={99}
  />
  <label for="">Skip</label>
  <Numeric
    name="Alternative"
    bind:value={$skipRow}
    size="sm"
    max={99}
  />
</Fieldset>

<style>
  label {
    margin-top: -2px;
  }
</style>

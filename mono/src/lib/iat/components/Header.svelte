<script lang="ts">
  import { file } from "$lib/iat/store";
  import { locale, locales } from "$lib/iat/i18n";
  import { Card, Combobox, FileInput } from "$lib/ui";

  let files = $state<File[]>([]);

  $effect(() => {
    file.set(files[0] ?? null);
  });
</script>

<div class="hide-print">
  <Card>
    {#snippet title()}
      IAT Analysis
    {/snippet}
    <div class="header-body">
      <FileInput
        bind:file={files}
        accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
      />
      <Combobox
        legend="Language"
        choices={locales.map((l) => ({ label: l.toUpperCase(), value: l }))}
        bind:value={$locale}
      />
    </div>
  </Card>
</div>

<style>
  .header-body {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;
  }
</style>

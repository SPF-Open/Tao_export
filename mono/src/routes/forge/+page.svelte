<script lang="ts">
  import Calendar from "$lib/forge/Calendar/Calendar.svelte";
  import { Language, lang } from "$lib/forge/store";
  import { Combobox } from "$lib/ui";
</script>

<main>
  <h1>Forge</h1>
  <div class="options">
    <Combobox
      legend="Language"
      choices={[
        { label: "FR", value: Language.FR },
        { label: "NL", value: Language.NL },
        { label: "DE", value: Language.DE },
      ]}
      bind:value={$lang}
    />
  </div>
  <Calendar />
</main>

<style>
  main {
    padding: 1rem;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 1rem;
  }

  .options {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 1rem;
  }
</style>

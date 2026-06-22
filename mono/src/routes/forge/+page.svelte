<script lang="ts">
  import { Hammer } from "lucide-svelte";
  import Calendar from "$lib/forge/Calendar/Calendar.svelte";
  import { Language, lang } from "$lib/forge/store";
  import { Combobox, PageHeader } from "$lib/ui";
</script>

<svelte:head>
  <title>Forge — TAO</title>
  <meta name="description" content="Forge — compose and schedule exams in the TAO toolkit." />
</svelte:head>

<main>
  <PageHeader
    icon={Hammer}
    eyebrow="Compose"
    title="Forge"
    subtitle="Create and schedule exams from scratch or from existing templates."
  >
    {#snippet actions()}
      <Combobox
        legend="Language"
        choices={[
          { label: "FR", value: Language.FR },
          { label: "NL", value: Language.NL },
          { label: "DE", value: Language.DE },
        ]}
        bind:value={$lang}
      />
    {/snippet}
  </PageHeader>

  <Calendar />
</main>

<style>
  main {
    padding: 1.5rem;
    max-width: 1100px;
    margin: 0 auto;
  }
</style>

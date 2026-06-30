<script lang="ts">
  import { Hammer } from "lucide-svelte";
  import Calendar from "$lib/forge/Calendar/Calendar.svelte";
  import { Language, lang } from "$lib/forge/store";
  import { Combobox, PageHeader, SidebarLayout } from "$lib/ui";
</script>

<svelte:head>
  <title>Forge — TAO</title>
  <meta name="description" content="Forge — compose and schedule exams in the TAO toolkit." />
</svelte:head>

<SidebarLayout sidebarLabel="Forge settings">
  {#snippet sidebar()}
    <p class="sidebar-label">Language</p>
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

  <PageHeader
    icon={Hammer}
    eyebrow="Compose"
    title="Forge"
    subtitle="Create and schedule exams from scratch or from existing templates."
  />

  <Calendar />
</SidebarLayout>

<style>
  .sidebar-label {
    margin: 0 0 4px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
</style>

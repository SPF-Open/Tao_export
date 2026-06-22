<script lang="ts">
  import { ClipboardCheck } from "lucide-svelte";
  import { file, pagesData } from "$lib/iat/store";
  import DynamicTable from "$lib/iat/components/DynamicTable.svelte";
  import Header from "$lib/iat/components/Header.svelte";
  import Summary from "$lib/iat/components/Summary.svelte";
  import { PageHeader } from "$lib/ui";
</script>

<svelte:head>
  <title>IAT — TAO</title>
  <meta name="description" content="Interactive Assessment Tool — analyse exam item statistics in the TAO toolkit." />
</svelte:head>

<main class:center={!$file}>
  <div class="hide-print">
    <PageHeader
      icon={ClipboardCheck}
      eyebrow="Analyse"
      title="IAT"
      subtitle="Interactive Assessment Tool — review item difficulty, discrimination and alternative statistics."
    />
  </div>

  <Header />

  {#if $pagesData}
    <Summary />
    <DynamicTable pagesData={$pagesData} />
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin: 0.3rem;
    min-height: calc(100vh - 0.6rem);
  }
  @media print {
    main {
      margin: 0rem;
      max-width: calc(100vw - 0.6rem);
    }
  }
</style>

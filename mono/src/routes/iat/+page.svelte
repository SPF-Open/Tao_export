<script lang="ts">
  import { ClipboardCheck } from "lucide-svelte";
  import { file, pagesData } from "$lib/iat/store";
  import DynamicTable from "$lib/iat/components/DynamicTable.svelte";
  import Header from "$lib/iat/components/Header.svelte";
  import Summary from "$lib/iat/components/Summary.svelte";
  import { EmptyState, PageHeader, SidebarLayout } from "$lib/ui";
</script>

<svelte:head>
  <title>IAT — TAO</title>
  <meta name="description" content="Interactive Assessment Tool — analyse exam item statistics in the TAO toolkit." />
</svelte:head>

<SidebarLayout sidebarLabel="IAT settings">
  {#snippet sidebar()}
    <Header />
  {/snippet}

  <div class="hide-print">
    <PageHeader
      icon={ClipboardCheck}
      eyebrow="Analyse"
      title="IAT"
      subtitle="Interactive Assessment Tool — review item difficulty, discrimination and alternative statistics."
    />
  </div>

  {#if $pagesData}
    <Summary />
    <DynamicTable pagesData={$pagesData} />
  {:else}
    <EmptyState
      icon={ClipboardCheck}
      title="Load an IAT statistics workbook"
      description="Upload the Excel export (Speed_Pages / Questions / Alternatives sheets) from the sidebar to analyse item statistics."
    />
  {/if}
</SidebarLayout>

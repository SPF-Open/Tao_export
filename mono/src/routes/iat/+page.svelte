<script lang="ts">
  import { file, pagesData } from "$lib/iat/store";
  import DynamicTable from "$lib/iat/components/DynamicTable.svelte";
  import Header from "$lib/iat/components/Header.svelte";
  import Summary from "$lib/iat/components/Summary.svelte";
</script>

<main class:center={!$file}>
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

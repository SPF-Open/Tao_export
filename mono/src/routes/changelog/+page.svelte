<script lang="ts">
  import { Markdown, PageHeader } from "$lib/ui";
  import { History } from "lucide-svelte";

  const SITE_URL = "https://tao.lv0.eu";
  const PAGE_TITLE = "Changelog — TAO";
  const PAGE_DESC = "Release notes and version history for the TAO toolkit.";

  let source = $state("");
  let loading = $state(true);
  let failed = $state(false);

  // ssr is disabled app-wide, so this always runs in the browser.
  $effect(() => {
    fetch("/export/CHANGELOG.md")
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.text();
      })
      .then((text) => {
        source = text;
        loading = false;
      })
      .catch(() => {
        failed = true;
        loading = false;
      });
  });
</script>

<svelte:head>
  <title>{PAGE_TITLE}</title>
  <meta name="description" content={PAGE_DESC} />
  <link rel="canonical" href={`${SITE_URL}/changelog`} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="TAO" />
  <meta property="og:title" content={PAGE_TITLE} />
  <meta property="og:description" content={PAGE_DESC} />
  <meta property="og:url" content={`${SITE_URL}/changelog`} />
  <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={PAGE_TITLE} />
  <meta name="twitter:description" content={PAGE_DESC} />
</svelte:head>

<main>
  <PageHeader
    icon={History}
    eyebrow="Releases"
    title="Changelog"
    subtitle="What changed in each version of the TAO toolkit."
  />

  {#if loading}
    <p class="status">Loading…</p>
  {:else if failed}
    <p class="status">The changelog could not be loaded.</p>
  {:else}
    <article class="changelog-body">
      <Markdown {source} />
    </article>
  {/if}
</main>

<style>
  main {
    padding: 1.5rem 1.5rem 3rem;
    max-width: 820px;
    margin: 0 auto;
  }

  .changelog-body {
    margin-top: 0.5rem;
  }

  .status {
    color: var(--text-muted);
    padding: 2rem 0;
  }
</style>

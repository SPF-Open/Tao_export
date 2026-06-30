<script lang="ts">
  import { page } from "$app/state";
  import { Markdown, PageHeader } from "$lib/ui";
  import { getDoc } from "$lib/docs";
  import { ArrowLeft, ArrowRight, BookOpen } from "lucide-svelte";

  const SITE_URL = "https://tao.lv0.eu";

  const slug = $derived(page.params.slug ?? "");
  const meta = $derived(getDoc(slug));

  let source = $state("");
  let loading = $state(true);
  let failed = $state(false);

  // Re-fetch the markdown whenever the slug changes. ssr is disabled app-wide,
  // so this always runs in the browser.
  $effect(() => {
    const current = slug;
    if (!getDoc(current)) {
      loading = false;
      return;
    }
    loading = true;
    failed = false;
    source = "";
    fetch(`/docs/${current}.md`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.text();
      })
      .then((text) => {
        if (slug === current) {
          source = text;
          loading = false;
        }
      })
      .catch(() => {
        if (slug === current) {
          failed = true;
          loading = false;
        }
      });
  });
</script>

<svelte:head>
  <title>{meta ? `${meta.title} — TAO docs` : "Documentation — TAO"}</title>
  <meta
    name="description"
    content={meta ? meta.description : "Documentation for the TAO toolkit."}
  />
  <link rel="canonical" href={`${SITE_URL}/docs/${slug}`} />
</svelte:head>

<main>
  <a class="back-link" href="/docs">
    <ArrowLeft size={15} strokeWidth={1.75} />
    <span>All documentation</span>
  </a>

  {#if meta}
    <PageHeader
      icon={meta.icon}
      eyebrow={meta.eyebrow}
      title={meta.title}
      subtitle={meta.description}
    />

    {#if loading}
      <p class="status">Loading…</p>
    {:else if failed}
      <p class="status">This documentation could not be loaded.</p>
    {:else}
      <article class="doc-body">
        <Markdown {source} />
      </article>
    {/if}
  {:else}
    <PageHeader
      icon={BookOpen}
      eyebrow="Help"
      title="Page not found"
      subtitle="There is no documentation for this page."
    />
    <a class="cta" href="/docs">
      <span>Browse all documentation</span>
      <ArrowRight size={15} strokeWidth={1.75} />
    </a>
  {/if}
</main>

<style>
  main {
    padding: 1.5rem 1.5rem 3rem;
    max-width: 820px;
    margin: 0 auto;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 1.25rem;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.15s;
  }

  .back-link:hover {
    color: var(--text);
  }

  .doc-body {
    margin-top: 0.5rem;
  }

  .status {
    color: var(--text-muted);
    padding: 2rem 0;
  }

  .cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 0.5rem;
    font-weight: 500;
    color: var(--brand);
    text-decoration: none;
  }
</style>

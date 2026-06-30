<script lang="ts">
  import { page } from "$app/state";
  import { Markdown, PageHeader } from "$lib/ui";
  import { getDoc } from "$lib/docs";
  import { docLang, LANG_LABELS, type DocLang } from "$lib/docLang";
  import { ArrowLeft, ArrowRight, BookOpen } from "lucide-svelte";

  const SITE_URL = "https://tao.lv0.eu";

  const slug = $derived(page.params.slug ?? "");
  const meta = $derived(getDoc(slug));

  let source = $state("");
  let loading = $state(true);
  let failed = $state(false);

  async function fetchDoc(lang: DocLang, s: string) {
    const res = await fetch(`/docs/${lang}/${s}.md`);
    if (!res.ok) {
      if (lang !== "en") return fetchDoc("en", s);
      throw new Error("Not found");
    }
    return res.text();
  }

  $effect(() => {
    const current = slug;
    const lang = $docLang;
    if (!getDoc(current)) {
      loading = false;
      return;
    }
    loading = true;
    failed = false;
    source = "";
    fetchDoc(lang, current)
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
  <div class="top-bar">
    <a class="back-link" href="/docs">
      <ArrowLeft size={15} strokeWidth={1.75} />
      <span>All documentation</span>
    </a>

    <div class="lang-switcher" role="group" aria-label="Language">
      {#each Object.entries(LANG_LABELS) as [lang, label]}
        <button
          class="lang-btn"
          class:active={$docLang === lang}
          onclick={() => docLang.set(lang as DocLang)}
          aria-pressed={$docLang === lang}
        >
          {label}
        </button>
      {/each}
    </div>
  </div>

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

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.15s;
  }

  .back-link:hover {
    color: var(--text);
  }

  .lang-switcher {
    display: flex;
    gap: 2px;
    padding: 3px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
  }

  .lang-btn {
    padding: 3px 10px;
    border: none;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .lang-btn:hover {
    color: var(--text);
  }

  .lang-btn.active {
    background: var(--surface-elevated);
    color: var(--text);
    box-shadow: var(--shadow-sm);
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

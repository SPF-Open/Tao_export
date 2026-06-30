<script lang="ts">
  import { PageHeader } from "$lib/ui";
  import { docs, stackDocs } from "$lib/docs";
  import { BookOpen, ArrowUpRight } from "lucide-svelte";

  const SITE_URL = "https://tao.lv0.eu";
  const PAGE_TITLE = "Documentation — TAO";
  const PAGE_DESC =
    "Documentation for every TAO tool: import, forge, export, format, IAT, library and audit.";

  function onCardMove(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }
</script>

<svelte:head>
  <title>{PAGE_TITLE}</title>
  <meta name="description" content={PAGE_DESC} />
  <link rel="canonical" href={`${SITE_URL}/docs`} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="TAO" />
  <meta property="og:title" content={PAGE_TITLE} />
  <meta property="og:description" content={PAGE_DESC} />
  <meta property="og:url" content={`${SITE_URL}/docs`} />
  <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={PAGE_TITLE} />
  <meta name="twitter:description" content={PAGE_DESC} />
</svelte:head>

<main>
  <PageHeader
    icon={BookOpen}
    eyebrow="Help"
    title="Documentation"
    subtitle="Guides for every tool in the TAO toolkit. Pick a page to get started."
  />

  <nav class="doc-grid" aria-label="Documentation pages">
    {#each docs as doc, i (doc.slug)}
      {@const Icon = doc.icon}
      <a
        href={`/docs/${doc.slug}`}
        class="doc-card"
        style={`animation-delay:${i * 60}ms`}
        onpointermove={onCardMove}
      >
        <span class="doc-icon" aria-hidden="true">
          <Icon size={20} strokeWidth={1.75} />
        </span>
        <div class="doc-text">
          <span class="doc-eyebrow">{doc.eyebrow}</span>
          <h2 class="doc-title">{doc.title}</h2>
          <p class="doc-desc">{doc.description}</p>
        </div>
        <ArrowUpRight class="doc-arrow" size={18} strokeWidth={1.75} />
      </a>
    {/each}
  </nav>

  <section class="stack-section" aria-label="Stack documentation">
    <h2 class="section-label">Stack</h2>
    <nav class="doc-grid">
      {#each stackDocs as doc, i (doc.slug)}
        {@const Icon = doc.icon}
        <a
          href={`/docs/${doc.slug}`}
          class="doc-card"
          style={`animation-delay:${(docs.length + i) * 60}ms`}
          onpointermove={onCardMove}
        >
          <span class="doc-icon" aria-hidden="true">
            <Icon size={20} strokeWidth={1.75} />
          </span>
          <div class="doc-text">
            <span class="doc-eyebrow">{doc.eyebrow}</span>
            <h2 class="doc-title">{doc.title}</h2>
            <p class="doc-desc">{doc.description}</p>
          </div>
          <ArrowUpRight class="doc-arrow" size={18} strokeWidth={1.75} />
        </a>
      {/each}
    </nav>
  </section>
</main>

<style>
  main {
    padding: 2rem 1.5rem 3rem;
    max-width: 960px;
    margin: 0 auto;
  }

  .doc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .doc-card {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;
    padding: 1.1rem;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-sm);
    text-decoration: none;
    overflow: hidden;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    animation: doc-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .doc-card::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      220px circle at var(--mx, 50%) var(--my, 50%),
      rgba(var(--brand-rgb), 0.08),
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
  }

  .doc-card:hover,
  .doc-card:focus-visible {
    transform: translateY(-3px);
    border-color: rgba(var(--brand-rgb), 0.5);
    box-shadow: var(--shadow-lg);
    outline: none;
  }

  .doc-card:hover::after,
  .doc-card:focus-visible::after {
    opacity: 1;
  }

  .doc-card:focus-visible {
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  .doc-icon {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: var(--radius-lg);
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-muted);
    transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
  }

  .doc-card:hover .doc-icon,
  .doc-card:focus-visible .doc-icon {
    color: var(--brand);
    background: rgba(var(--brand-rgb), 0.08);
    border-color: rgba(var(--brand-rgb), 0.3);
  }

  .doc-text {
    min-width: 0;
  }

  .doc-eyebrow {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .doc-title {
    margin: 0.15rem 0 0.3rem;
    font-size: 1.05rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--text);
  }

  .doc-desc {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.5;
    color: var(--text-muted);
  }

  .doc-card :global(.doc-arrow) {
    position: absolute;
    top: 1rem;
    right: 1rem;
    color: var(--text-muted);
    opacity: 0;
    transform: translate(-3px, 3px);
    transition: opacity 0.2s ease, transform 0.2s ease, color 0.2s ease;
  }

  .doc-card:hover :global(.doc-arrow),
  .doc-card:focus-visible :global(.doc-arrow) {
    opacity: 1;
    transform: translate(0, 0);
    color: var(--brand);
  }

  .stack-section {
    margin-top: 2.5rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
  }

  .section-label {
    margin: 0 0 1rem;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  @keyframes doc-rise {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .doc-card {
      animation: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .doc-card:hover,
    .doc-card:focus-visible {
      transform: none;
    }
  }
</style>

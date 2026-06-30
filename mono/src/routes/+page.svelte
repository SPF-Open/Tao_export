<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    ArrowUpRight,
    Upload,
    Download,
    Hammer,
    Bold,
    ClipboardCheck,
    Library,
    ScanSearch,
    Route as RouteIcon,
  } from 'lucide-svelte';
  import type { ComponentType } from 'svelte';
  import DotCanvas from '$lib/ui/DotCanvas.svelte';

  // Production origin — used to build absolute URLs for SEO/social metadata.
  // Change this if the app is deployed somewhere other than tao.lv0.eu.
  const SITE_URL = 'https://tao.lv0.eu';
  const PAGE_TITLE = 'TAO — Exam toolkit by lv0.eu';
  const PAGE_DESC =
    'TAO is a unified exam toolkit: import raw data, forge questions, run interactive assessments, and export formatted results — all in one place.';

  // Track the pointer over each card: the spotlight follows the cursor, and the
  // card tilts very slightly toward it for a parallax / depth feel.
  const MAX_TILT = 6; // degrees
  function onCardMove(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    el.style.setProperty('--mx', `${px}px`);
    el.style.setProperty('--my', `${py}px`);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Normalise to -0.5..0.5 around the card centre.
    const nx = px / rect.width - 0.5;
    const ny = py / rect.height - 0.5;
    el.style.setProperty('--ry', `${nx * MAX_TILT * 2}deg`);
    el.style.setProperty('--rx', `${-ny * MAX_TILT * 2}deg`);
  }

  function onCardLeave(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }

  interface Route {
    path: string;
    title: string;
    description: string;
    eyebrow: string;
    icon: ComponentType;
    available: boolean;
  }

  const routes: Route[] = [
    {
      path: '/import',
      title: 'Import',
      eyebrow: 'Excel to TAO',
      description: 'Load a workbook, map the question columns, preview parsed items, and prepare a clean TAO question set.',
      icon: Upload,
      available: true,
    },
    {
      path: '/forge',
      title: 'Forge',
      eyebrow: 'Question builder',
      description: 'Compose and schedule exams from scratch or from existing templates with language-aware tooling.',
      icon: Hammer,
      available: true,
    },
    {
      path: '/export',
      title: 'Export',
      eyebrow: 'ZIP to PDF/JSON',
      description: 'Load ZIP exam archives, configure settings, preview questions and answers, and export formatted result tables.',
      icon: Download,
      available: true,
    },
    {
      path: '/format',
      title: 'Format',
      eyebrow: 'Bold prompts',
      description: 'Upload a TAO QTI export and get the same ZIP back with every question prompt wrapped in bold, ready to re-import.',
      icon: Bold,
      available: true,
    },
    {
      path: '/iat',
      title: 'IAT',
      eyebrow: 'Item analysis',
      description: 'Review item difficulty, discrimination, and alternative statistics after an exam session.',
      icon: ClipboardCheck,
      available: true,
    },
    {
      path: '/library',
      title: 'Library',
      eyebrow: 'Question bank',
      description: 'Build a portable SQLite question database from TAO exports, then search it instantly — all in your browser.',
      icon: Library,
      available: true,
    },
    {
      path: '/audit',
      title: 'Audit',
      eyebrow: 'Compliance review',
      description: 'Compare a TAO export against an Excel source: match questions and flag critical, major and minor differences by severity.',
      icon: ScanSearch,
      available: true,
    },
  ];

  const workflow = [
    { label: 'Import', value: 'map columns' },
    { label: 'Forge', value: 'compose exam' },
    { label: 'Export', value: 'print results' },
    { label: 'IAT', value: 'analyse quality' },
  ];

  // Number keys 1–4 launch the matching module — a small command-palette touch.
  onMount(() => {
    function onKey(e: KeyboardEvent) {
      // Ignore when typing in a field or using modifier combos.
      const target = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > routes.length) return;
      const route = routes[n - 1];
      if (route?.available) {
        e.preventDefault();
        goto(route.path);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

<svelte:head>
  <title>{PAGE_TITLE}</title>
  <meta name="description" content={PAGE_DESC} />
  <meta
    name="keywords"
    content="TAO, exam toolkit, exam authoring, exam export, exam import, question forge, interactive assessment, IAT, lv0.eu"
  />
  <link rel="canonical" href={SITE_URL} />

  <!-- Crawler directives: welcome general + AI search bots -->
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <meta name="googlebot" content="index, follow" />
  <meta name="GPTBot" content="index, follow" />
  <meta name="ChatGPT-User" content="index, follow" />
  <meta name="OAI-SearchBot" content="index, follow" />
  <meta name="ClaudeBot" content="index, follow" />
  <meta name="anthropic-ai" content="index, follow" />
  <meta name="PerplexityBot" content="index, follow" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="TAO" />
  <meta property="og:title" content={PAGE_TITLE} />
  <meta property="og:description" content={PAGE_DESC} />
  <meta property="og:url" content={SITE_URL} />
  <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="TAO — Exam toolkit" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={PAGE_TITLE} />
  <meta name="twitter:description" content={PAGE_DESC} />
  <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />

  <!-- Structured data for search & AI engines -->
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TAO',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    description: PAGE_DESC,
    publisher: { '@type': 'Organization', name: 'lv0.eu', url: 'https://lv0.eu' }
  })}</` + `script>`}
</svelte:head>

<DotCanvas />
<div class="halo" aria-hidden="true"></div>

<main>
  <header class="hero">
    <div class="hero-copy">
      <div class="brand">
        <span class="logomark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="26" height="26" fill="none">
            <circle cx="16" cy="16" r="13" stroke="currentColor" stroke-width="1.4" opacity="0.35" />
            <circle cx="16" cy="8.5" r="2.1" fill="currentColor" />
            <circle cx="22.5" cy="19.5" r="2.1" fill="currentColor" opacity="0.65" />
            <circle cx="9.5" cy="19.5" r="2.1" fill="currentColor" opacity="0.65" />
            <path d="M16 8.5 L22.5 19.5 L9.5 19.5 Z" stroke="currentColor" stroke-width="1.2" opacity="0.5" />
          </svg>
        </span>
        <h1 class="wordmark" data-text="TAO">TAO</h1>
      </div>
      <p class="subtitle">Exams, end to end</p>
      <p class="hero-description">
        Import question, build or review exams, export printable archives, and analyse item
        performance from one quiet workspace.
      </p>
      <div class="meta-readout" aria-hidden="true">
        <span class="status-dot"></span>
        <span class="meta-item">exam workflow</span>
        <span class="meta-sep">·</span>
        <span class="meta-item">{routes.length} modules</span>
        <span class="meta-sep">·</span>
        <span class="meta-item">press <kbd>1</kbd>–<kbd>{routes.length}</kbd> to launch</span>
      </div>
    </div>

    <aside class="hero-panel" aria-label="TAO workflow summary">
      <div class="panel-topline">
        <span>Typical run</span>
        <span class="panel-status">Start anywhere</span>
      </div>
      <div class="workflow-strip" aria-label="Typical exam workflow">
        <RouteIcon size={16} strokeWidth={1.8} />
        {#each workflow as step}
          <span>
            <strong>{step.label}</strong>
            <small>{step.value}</small>
          </span>
        {/each}
      </div>
    </aside>
  </header>

  <section class="module-shell" aria-label="TAO modules">
    <div class="section-heading">
      <div>
        <p>Open a tool</p>
        <h2>Choose a module</h2>
      </div>
      <span>Number keys launch the matching module.</span>
    </div>

    <nav class="route-grid">
      {#each routes as route, i (route.path)}
        <a
          href={route.available ? route.path : undefined}
          class="route-card"
          class:unavailable={!route.available}
          aria-disabled={!route.available}
          tabindex={route.available ? 0 : -1}
          style="--delay:{i * 70}ms;"
          onpointermove={onCardMove}
          onpointerleave={onCardLeave}
        >
          <span class="route-icon">
            <route.icon size={20} strokeWidth={1.75} />
          </span>
          {#if route.available}
            <kbd class="route-key" aria-hidden="true">{i + 1}</kbd>
          {/if}
          <div class="route-body">
            <span class="route-eyebrow">{route.eyebrow}</span>
            <h3 class="route-title">{route.title}</h3>
            <p class="route-description">{route.description}</p>
          </div>
          {#if route.available}
            <ArrowUpRight class="route-arrow" size={18} />
          {:else}
            <span class="badge">Coming soon</span>
          {/if}
        </a>
      {/each}
    </nav>
  </section>
</main>

<style>
  /* --brand / --brand-rgb are now global tokens in layout.css. */

  /* One restrained glow behind the hero — not a rainbow. */
  .halo {
    position: fixed;
    top: 18%;
    left: 50%;
    width: 640px;
    height: 640px;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(var(--brand-rgb), 0.14), transparent 62%);
    filter: blur(40px);
    pointer-events: none;
    z-index: 0;
  }

  main {
    position: relative;
    z-index: 1;
    min-height: calc(100vh - 36px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
  }

  /* ── Hero ─────────────────────────────────────────────── */
  .hero {
    width: 100%;
    max-width: 1280px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(320px, 460px);
    align-items: center;
    gap: 2rem;
    margin-bottom: 1.15rem;
    animation: rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .hero-copy {
    text-align: left;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.85rem;
  }

  .logomark {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 14px;
    color: var(--brand);
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
  }

  .wordmark {
    position: relative;
    margin: 0;
    font-size: clamp(2.75rem, 9vw, 4rem);
    font-weight: 700;
    letter-spacing: -0.045em;
    line-height: 1;
    color: var(--text);
  }

  /* One-shot brand light sweep across the letters on load. */
  .wordmark::after {
    content: attr(data-text);
    position: absolute;
    inset: 0;
    background: linear-gradient(
      100deg,
      transparent 38%,
      rgba(var(--brand-rgb), 0.95) 50%,
      transparent 62%
    );
    background-size: 250% 100%;
    background-position: 120% 0;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    pointer-events: none;
    animation: sheen 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both;
  }

  @keyframes sheen {
    from { background-position: 120% 0; }
    to   { background-position: -60% 0; }
  }

  .subtitle {
    color: var(--text);
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1.6;
    max-width: 34rem;
    margin: 1.1rem 0 0;
  }

  .hero-description {
    color: var(--text-muted);
    font-size: 0.95rem;
    line-height: 1.65;
    max-width: 36rem;
    margin: 0.45rem 0 0;
  }

  /* ── Tech meta readout ────────────────────────────────── */
  .meta-readout {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1.1rem;
    padding: 0.3rem 0.7rem;
    border: 1px solid var(--border);
    border-radius: 9999px;
    background: var(--surface);
    font-family: 'SF Mono', 'Roboto Mono', ui-monospace, monospace;
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--brand);
    box-shadow: 0 0 0 0 rgba(var(--brand-rgb), 0.55);
    animation: pulse 2.4s ease-out infinite;
  }

  @keyframes pulse {
    0%   { box-shadow: 0 0 0 0 rgba(var(--brand-rgb), 0.5); }
    70%  { box-shadow: 0 0 0 6px rgba(var(--brand-rgb), 0); }
    100% { box-shadow: 0 0 0 0 rgba(var(--brand-rgb), 0); }
  }

  .meta-sep {
    opacity: 0.5;
  }

  .meta-readout kbd {
    font-family: inherit;
    font-size: 0.65rem;
    padding: 0.05rem 0.3rem;
    border: 1px solid var(--border-strong);
    border-radius: 4px;
    color: var(--text);
    background: var(--surface-elevated);
  }

  .hero-panel {
    position: relative;
    overflow: hidden;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    background:
      linear-gradient(135deg, rgba(var(--brand-rgb), 0.08), transparent 42%),
      var(--surface-elevated);
    box-shadow: var(--shadow-sm);
  }

  .hero-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(var(--brand-rgb), 0.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(var(--brand-rgb), 0.055) 1px, transparent 1px);
    background-size: 26px 26px;
    mask-image: linear-gradient(to bottom, #000, transparent 78%);
    pointer-events: none;
  }

  .panel-topline,
  .workflow-strip {
    position: relative;
    z-index: 1;
  }

  .panel-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    color: var(--text-muted);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .panel-status {
    color: var(--brand);
  }

  .workflow-strip {
    display: grid;
    grid-template-columns: auto repeat(4, minmax(0, 1fr));
    align-items: center;
    gap: 0.7rem;
    margin-top: 1rem;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface);
  }

  .workflow-strip :global(svg) {
    color: var(--text-muted);
  }

  .workflow-strip span {
    min-width: 0;
  }

  .workflow-strip strong,
  .workflow-strip small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .workflow-strip strong {
    color: var(--text);
    font-size: 0.76rem;
  }

  .workflow-strip small {
    margin-top: 0.16rem;
    color: var(--text-muted);
    font-size: 0.68rem;
  }

  .module-shell {
    width: 100%;
    max-width: 1280px;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    background: color-mix(in srgb, var(--surface) 72%, transparent);
    box-shadow: var(--shadow-sm);
    animation: rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: 90ms;
  }

  .section-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .section-heading p,
  .section-heading h2 {
    margin: 0;
  }

  .section-heading p {
    color: var(--brand);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .section-heading h2 {
    margin-top: 0.2rem;
    color: var(--text);
    font-size: 1.15rem;
    line-height: 1.2;
  }

  .section-heading > span {
    color: var(--text-muted);
    font-size: 0.82rem;
    text-align: right;
  }

  /* ── Route grid ───────────────────────────────────────── */
  .route-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1rem;
    width: 100%;
    perspective: 1200px;
  }

  .route-card {
    --rx: 0deg;
    --ry: 0deg;
    --lift: 0px;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-sm);
    text-decoration: none;
    color: var(--text);
    overflow: hidden;
    isolation: isolate;
    transform-style: preserve-3d;
    transform: rotateX(var(--rx)) rotateY(var(--ry)) translateY(var(--lift));
    transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.18s ease;
    animation: rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: var(--delay);
  }

  /* Single-accent border-beam that sweeps the hairline on hover. */
  @property --beam {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }

  .route-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: conic-gradient(
      from var(--beam),
      transparent 0deg,
      rgba(var(--brand-rgb), 0.75) 38deg,
      transparent 110deg
    );
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.25s ease;
    pointer-events: none;
    z-index: 1;
  }

  .route-card:not(.unavailable):hover::before,
  .route-card:not(.unavailable):focus-visible::before {
    opacity: 1;
    animation: beam 2.6s linear infinite;
  }

  @keyframes beam {
    to { --beam: 360deg; }
  }

  /* subtle brand-tinted spotlight that follows the cursor */
  .route-card::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      260px circle at var(--mx, 50%) var(--my, 0%),
      rgba(var(--brand-rgb), 0.1),
      transparent 60%
    );
    opacity: 0;
    transition: opacity 0.25s ease;
    pointer-events: none;
    z-index: 0;
  }

  .route-card:not(.unavailable):hover {
    --lift: -3px;
    border-color: rgba(var(--brand-rgb), 0.45);
    box-shadow: var(--shadow-lg);
  }

  .route-card:not(.unavailable):hover::after,
  .route-card:not(.unavailable):focus-visible::after {
    opacity: 1;
  }

  .route-card:focus-visible {
    outline: none;
    border-color: rgba(var(--brand-rgb), 0.6);
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  .route-card.unavailable {
    cursor: default;
    pointer-events: none;
  }
  .route-card.unavailable * {
    opacity: 0.6;
  }

  .route-icon {
    position: relative;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-lg);
    color: var(--text-muted);
    background: var(--surface);
    border: 1px solid var(--border);
    transform: translateZ(38px);
    transition: color 0.25s ease, background 0.25s ease, border-color 0.25s ease;
  }

  .route-card:not(.unavailable):hover .route-icon {
    color: var(--brand);
    background: rgba(var(--brand-rgb), 0.08);
    border-color: rgba(var(--brand-rgb), 0.25);
  }

  .route-body {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    transform: translateZ(20px);
  }

  .route-eyebrow {
    color: var(--brand);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .route-title {
    font-size: 1.05rem;
    font-weight: 650;
    margin: 0;
    color: var(--text);
  }

  .route-description {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.55;
  }

  .route-key {
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    z-index: 2;
    display: grid;
    place-items: center;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 0.3rem;
    font-family: 'SF Mono', 'Roboto Mono', ui-monospace, monospace;
    font-size: 0.7rem;
    line-height: 1;
    color: var(--text-muted);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    transform: translateZ(28px);
    opacity: 0.55;
    transition: opacity 0.2s ease;
  }

  .route-card:not(.unavailable):hover .route-key,
  .route-card:not(.unavailable):focus-visible .route-key {
    opacity: 0;
  }

  .route-card :global(.route-arrow) {
    position: absolute;
    top: 1.4rem;
    right: 1.4rem;
    z-index: 2;
    color: var(--text-muted);
    opacity: 0;
    transform: translate(-4px, 4px) translateZ(28px);
    transition: opacity 0.25s ease, transform 0.25s ease, color 0.25s ease;
  }

  .route-card:not(.unavailable):hover :global(.route-arrow) {
    opacity: 1;
    transform: translate(0, 0) translateZ(28px);
    color: var(--brand);
  }

  @keyframes rise {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .badge {
    align-self: flex-start;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.2rem 0.55rem;
    border-radius: 9999px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-muted);
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  @media (max-width: 920px) {
    main {
      justify-content: flex-start;
    }

    .hero {
      grid-template-columns: 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .hero-copy {
      text-align: center;
    }

    .brand {
      justify-content: center;
    }

    .subtitle,
    .hero-description {
      margin-left: auto;
      margin-right: auto;
    }
  }

  @media (max-width: 640px) {
    main {
      padding: 1.2rem 0.75rem;
    }

    .meta-readout {
      flex-wrap: wrap;
      justify-content: center;
      border-radius: var(--radius-lg);
    }

    .workflow-strip {
      grid-template-columns: 1fr;
    }

    .workflow-strip :global(svg) {
      display: none;
    }

    .workflow-strip strong,
    .workflow-strip small {
      white-space: normal;
    }

    .module-shell {
      padding: 0.75rem;
    }

    .section-heading {
      align-items: flex-start;
      flex-direction: column;
      gap: 0.35rem;
    }

    .section-heading > span {
      text-align: left;
    }

    .route-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero,
    .module-shell,
    .route-card { animation: none !important; opacity: 1; }
    .route-card {
      transform: none !important;
      transition: box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .route-card::before { animation: none !important; }
    .wordmark::after { animation: none !important; opacity: 0; }
    .status-dot { animation: none !important; }
  }
</style>

<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { fly, fade } from "svelte/transition";
  import {
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    ArrowLeft,
    ArrowDown,
    ArrowUpRight,
    Upload,
    Hammer,
    Download,
    ScanSearch,
    ClipboardCheck,
    Library,
    FileSpreadsheet,
    FileArchive,
    FileText,
    Braces,
    ShieldCheck,
    ChartNoAxesColumn,
    Lock,
    Globe,
    ServerOff,
    Users,
    Layers,
  } from "lucide-svelte";
  import DotCanvas from "$lib/ui/DotCanvas.svelte";
  import { docs } from "$lib/docs";

  const SITE_URL = "https://tao.lv0.eu";
  const PAGE_TITLE = "TAO — Presentation";
  const PAGE_DESC =
    "A guided tour of TAO, the unified exam toolkit: import, build, export, audit and analyse exams end to end — all in the browser.";

  // ── Deck state ──────────────────────────────────────────
  // Short labels drive the progress dots, the counter and the slide count.
  const slides = [
    "Cover",
    "Problem",
    "Vision",
    "Audience",
    "Modules",
    "Journey",
    "How it works",
    "Strengths",
    "Close",
  ];
  const TOTAL = slides.length;

  let current = $state(0);
  let reduce = $state(false);

  function go(i: number) {
    current = Math.max(0, Math.min(TOTAL - 1, i));
  }
  const next = () => go(current + 1);
  const prev = () => go(current - 1);

  const pad = (n: number) => String(n).padStart(2, "0");

  // The exam pipeline, laid out as a serpentine: the top row reads left→right,
  // turns down on the right, then the bottom row reads right→left.
  const pipeline = [
    { step: 1, name: "Import", sub: "Excel in", icon: Upload },
    { step: 2, name: "Forge", sub: "Build", icon: Hammer },
    { step: 3, name: "Export", sub: "PDF / JSON", icon: Download },
    { step: 4, name: "Audit", sub: "Validate", icon: ScanSearch },
    { step: 5, name: "IAT", sub: "Analyse", icon: ClipboardCheck },
    { step: 6, name: "Library", sub: "Archive", icon: Library },
  ];
  const topRow = pipeline.slice(0, 3); // 1 → 2 → 3, left to right
  // Bottom row is placed left-to-right but reads right-to-left (6 ← 5 ← 4),
  // so Audit (step 4) sits under Export (step 3) for the turn.
  const bottomRow = [pipeline[5], pipeline[4], pipeline[3]];

  const strengths = [
    { icon: Layers, label: "End to end", note: "One tool, whole lifecycle" },
    {
      icon: Lock,
      label: "Private by default",
      note: "Nothing leaves the device",
    },
    {
      icon: ShieldCheck,
      label: "Compliance-grade",
      note: "Critical / major / minor audit",
    },
    {
      icon: ChartNoAxesColumn,
      label: "Built-in analysis",
      note: "Psychometric item stats",
    },
    {
      icon: FileArchive,
      label: "Portable banks",
      note: "Encrypted .taodb libraries",
    },
  ];

  // NOTE: confirm / replace these with the real roadmap before presenting.
  const roadmap = [
    { state: "done", label: "Library mode — build exams from the bank" },
    { state: "done", label: "Forge — templating & scheduling" },
    { state: "done", label: "Audit — severity-tiered reporting" },
    { state: "next", label: "Deeper item-analysis metrics" },
    { state: "next", label: "Broader export & format options" },
  ];

  onMount(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduce = mq.matches;
    const onChange = (e: MediaQueryListEvent) => (reduce = e.matches);
    mq.addEventListener("change", onChange);

    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case " ":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          prev();
          break;
        case "Home":
          e.preventDefault();
          go(0);
          break;
        case "End":
          e.preventDefault();
          go(TOTAL - 1);
          break;
        case "Escape":
          goto("/");
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("keydown", onKey);
    };
  });

  // Svelte transitions aren't covered by the CSS reduced-motion query, so gate
  // their parameters on the runtime flag.
  const enter = $derived(
    reduce ? { duration: 0 } : { y: 22, duration: 460, opacity: 0 },
  );
  const leave = $derived(reduce ? { duration: 0 } : { duration: 200 });
</script>

<svelte:head>
  <title>{PAGE_TITLE}</title>
  <meta name="description" content={PAGE_DESC} />
  <link rel="canonical" href={`${SITE_URL}/slides`} />
  <meta
    name="robots"
    content="index, follow, max-image-preview:large, max-snippet:-1"
  />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="TAO" />
  <meta property="og:title" content={PAGE_TITLE} />
  <meta property="og:description" content={PAGE_DESC} />
  <meta property="og:url" content={`${SITE_URL}/slides`} />
  <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="TAO — Exam toolkit" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={PAGE_TITLE} />
  <meta name="twitter:description" content={PAGE_DESC} />
  <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
</svelte:head>

<DotCanvas glow={90} />
<div class="halo" aria-hidden="true"></div>

<!-- A single pipeline node card -->
{#snippet pnode(item: (typeof pipeline)[number])}
  {@const Icon = item.icon}
  <div class="pnode" style="--step:{item.step}">
    <span class="pnode-icon"><Icon size={20} strokeWidth={1.75} /></span>
    <div class="pnode-text">
      <span class="pnode-num">Step {item.step}</span>
      <span class="pnode-name">{item.name}</span>
      <span class="pnode-sub">{item.sub}</span>
    </div>
  </div>
{/snippet}

<!-- Serpentine exam pipeline: row 1 → , turn ↓ , row 2 ← -->
{#snippet serpentine()}
  <div class="serp" aria-label="Exam pipeline">
    <div class="srow">
      {@render pnode(topRow[0])}
      <span class="parrow right" style="--step:1" aria-hidden="true"
        ><ArrowRight size={22} strokeWidth={2.4} /></span
      >
      {@render pnode(topRow[1])}
      <span class="parrow right" style="--step:2" aria-hidden="true"
        ><ArrowRight size={22} strokeWidth={2.4} /></span
      >
      {@render pnode(topRow[2])}
    </div>

    <div class="turn-row" aria-hidden="true">
      <span class="turn" style="--step:3">
        <span class="turn-line"></span>
        <ArrowDown size={20} strokeWidth={2.4} />
      </span>
    </div>

    <div class="srow">
      {@render pnode(bottomRow[0])}
      <span class="parrow left" style="--step:5" aria-hidden="true"
        ><ArrowLeft size={22} strokeWidth={2.4} /></span
      >
      {@render pnode(bottomRow[1])}
      <span class="parrow left" style="--step:4" aria-hidden="true"
        ><ArrowLeft size={22} strokeWidth={2.4} /></span
      >
      {@render pnode(bottomRow[2])}
    </div>
  </div>
{/snippet}

<main class="deck">
  <div class="viewport">
    {#key current}
      <section
        class="slide"
        aria-roledescription="slide"
        aria-label={`${current + 1} of ${TOTAL}: ${slides[current]}`}
        in:fly={enter}
        out:fade={leave}
      >
        {#if current === 0}
          <!-- 1 · Cover -->
          <div class="slide-body center cover">
            <div class="brand r" style="--i:0">
              <span class="logomark" aria-hidden="true">
                <svg viewBox="0 0 32 32" width="30" height="30" fill="none">
                  <circle
                    cx="16"
                    cy="16"
                    r="13"
                    stroke="currentColor"
                    stroke-width="1.4"
                    opacity="0.35"
                  />
                  <circle cx="16" cy="8.5" r="2.1" fill="currentColor" />
                  <circle
                    cx="22.5"
                    cy="19.5"
                    r="2.1"
                    fill="currentColor"
                    opacity="0.65"
                  />
                  <circle
                    cx="9.5"
                    cy="19.5"
                    r="2.1"
                    fill="currentColor"
                    opacity="0.65"
                  />
                  <path
                    d="M16 8.5 L22.5 19.5 L9.5 19.5 Z"
                    stroke="currentColor"
                    stroke-width="1.2"
                    opacity="0.5"
                  />
                </svg>
              </span>
              <h1 class="wordmark">TAO</h1>
            </div>
            <p class="lead r" style="--i:1">Exams, end to end.</p>
            <p class="sub r" style="--i:2">A unified exam toolkit</p>
            <p class="hint r" style="--i:3">press <kbd>→</kbd> to start</p>
          </div>
        {:else if current === 1}
          <!-- 2 · Problem -->
          <div class="slide-body">
            <span class="eyebrow r" style="--i:0">The context</span>
            <h2 class="title r" style="--i:1">Exams are scattered work</h2>
            <p class="message r" style="--i:2">
              Building, reviewing and analysing exams means juggling Excel, the
              TAO platform, PDFs and spreadsheets — across disconnected tools.
            </p>
            <div class="chips r" style="--i:3">
              <span class="chip" style="--rot:-5deg"
                ><FileSpreadsheet size={16} /> Excel banks</span
              >
              <span class="chip" style="--rot:4deg"
                ><FileArchive size={16} /> QTI packages</span
              >
              <span class="chip" style="--rot:-3deg"
                ><FileText size={16} /> Print PDFs</span
              >
              <span class="chip" style="--rot:6deg"
                ><Braces size={16} /> Result data</span
              >
              <span class="chip muted" style="--rot:-2deg"
                >…by eye, no single home</span
              >
            </div>
          </div>
        {:else if current === 2}
          <!-- 3 · Vision -->
          <div class="slide-body">
            <span class="eyebrow r" style="--i:0">The vision</span>
            <h2 class="title r" style="--i:1">One quiet workspace</h2>
            <p class="message r" style="--i:2">
              Import, build, export, audit and analyse exams from a single
              browser-based workspace — nothing leaves the machine.
            </p>
            <ul class="points r" style="--i:3">
              <li>The full exam lifecycle in one place</li>
              <li>100% client-side — zero upload</li>
              <li>Privacy-first by design</li>
              <li>Calm, premium, distraction-free</li>
            </ul>
          </div>
        {:else if current === 3}
          <!-- 4 · Audience -->
          <div class="slide-body">
            <span class="eyebrow r" style="--i:0">Who it's for</span>
            <h2 class="title r" style="--i:1">Built for the test team</h2>
            <p class="message r" style="--i:2">
              Made specifically for the SPF Finances testing team and the people
              around the exam cycle.
            </p>
            <div class="roles r" style="--i:3">
              <div class="role">
                <Users size={18} strokeWidth={1.75} /><span>Authors</span>
              </div>
              <div class="role">
                <ShieldCheck size={18} strokeWidth={1.75} /><span
                  >Reviewers / QA</span
                >
              </div>
              <div class="role">
                <FileText size={18} strokeWidth={1.75} /><span
                  >Administrators</span
                >
              </div>
              <div class="role">
                <ChartNoAxesColumn size={18} strokeWidth={1.75} /><span
                  >Item analysts</span
                >
              </div>
            </div>
            <p class="aside r" style="--i:4">
              Multilingual context — FR · NL · DE
            </p>
          </div>
        {:else if current === 4}
          <!-- 5 · Modules -->
          <div class="slide-body">
            <span class="eyebrow r" style="--i:0">The toolkit</span>
            <h2 class="title r" style="--i:1">Seven modules, one toolkit</h2>
            <p class="message r" style="--i:2">
              Each module owns one job in the exam lifecycle.
            </p>
            <div class="modules r" style="--i:3">
              {#each docs as d (d.slug)}
                {@const Icon = d.icon}
                <div class="module">
                  <span class="module-icon"
                    ><Icon size={18} strokeWidth={1.75} /></span
                  >
                  <div class="module-text">
                    <span class="module-eyebrow">{d.eyebrow}</span>
                    <span class="module-name">{d.title}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {:else if current === 5}
          <!-- 6 · Journey -->
          <div class="slide-body wide">
            <span class="eyebrow r" style="--i:0">The path</span>
            <h2 class="title r" style="--i:1">
              From raw data to delivered exam
            </h2>
            <p class="message r" style="--i:2">
              The modules chain into a natural pipeline.
            </p>
            {@render serpentine()}
            <p class="aside r" style="--i:6">
              Each step hands clean data to the next — move forward at your own
              pace.
            </p>
          </div>
        {:else if current === 6}
          <!-- 7 · How it works -->
          <div class="slide-body">
            <span class="eyebrow r" style="--i:0">Under the hood</span>
            <h2 class="title r" style="--i:1">Everything in the browser</h2>
            <p class="message r" style="--i:2">
              No backend, no database, no upload — the heavy lifting runs
              locally.
            </p>
            <div class="dataflow r" style="--i:3">
              <span class="df-node"><FileArchive size={15} /> File</span>
              <ArrowRight class="df-arrow" size={15} strokeWidth={2} />
              <span class="df-node">Parse</span>
              <ArrowRight class="df-arrow" size={15} strokeWidth={2} />
              <span class="df-node"><Globe size={15} /> Render</span>
              <ArrowRight class="df-arrow" size={15} strokeWidth={2} />
              <span class="df-node"><FileText size={15} /> Export</span>
              <span class="df-node off"><ServerOff size={15} /> No server</span>
            </div>
            <ul class="points tight r" style="--i:4">
              <li>ZIP parsing &amp; Excel reading in-page</li>
              <li>Full SQLite in the browser for the Library</li>
              <li>PDF via print · JSON · encrypted <code>.taodb</code></li>
              <li>Works offline after first load</li>
            </ul>
          </div>
        {:else if current === 7}
          <!-- 8 · Strengths -->
          <div class="slide-body">
            <span class="eyebrow r" style="--i:0">Why it stands out</span>
            <h2 class="title r" style="--i:1">Few tools do all of this</h2>
            <p class="message r" style="--i:2">
              Cover the whole lifecycle and keep data on-device.
            </p>
            <div class="strengths r" style="--i:3">
              {#each strengths as s}
                {@const Icon = s.icon}
                <div class="strength">
                  <span class="strength-icon"
                    ><Icon size={18} strokeWidth={1.75} /></span
                  >
                  <span class="strength-label">{s.label}</span>
                  <span class="strength-note">{s.note}</span>
                </div>
              {/each}
            </div>
          </div>
        {:else}
          <!-- 11 · Close -->
          <div class="slide-body center cover">
            <span class="logomark big r" style="--i:0" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="26" height="26" fill="none">
                <circle
                  cx="16"
                  cy="16"
                  r="13"
                  stroke="currentColor"
                  stroke-width="1.4"
                  opacity="0.35"
                />
                <circle cx="16" cy="8.5" r="2.1" fill="currentColor" />
                <circle
                  cx="22.5"
                  cy="19.5"
                  r="2.1"
                  fill="currentColor"
                  opacity="0.65"
                />
                <circle
                  cx="9.5"
                  cy="19.5"
                  r="2.1"
                  fill="currentColor"
                  opacity="0.65"
                />
                <path
                  d="M16 8.5 L22.5 19.5 L9.5 19.5 Z"
                  stroke="currentColor"
                  stroke-width="1.2"
                  opacity="0.5"
                />
              </svg>
            </span>
            <h2 class="title r" style="--i:1">Exams, end to end.</h2>
            <p class="message center-msg r" style="--i:2">
              One workspace for the whole exam lifecycle — quiet, private,
              complete.
            </p>
            <a class="cta r" style="--i:3" href="/">
              Open TAO <ArrowUpRight size={17} strokeWidth={2} />
            </a>
            <p class="hint r" style="--i:4">
              tao.lv0.eu · built for the SPF Finances test team
            </p>
          </div>
        {/if}
      </section>
    {/key}
  </div>

  <footer class="controls hide-print">
    <button
      class="nav-btn"
      onclick={prev}
      disabled={current === 0}
      aria-label="Previous slide"
    >
      <ChevronLeft size={20} strokeWidth={1.75} />
    </button>

    <div class="dots" role="tablist" aria-label="Slides">
      {#each slides as label, i}
        <button
          class="dot"
          class:active={i === current}
          role="tab"
          aria-selected={i === current}
          aria-label={`Slide ${i + 1}: ${label}`}
          title={label}
          onclick={() => go(i)}
        ></button>
      {/each}
    </div>

    <button
      class="nav-btn"
      onclick={next}
      disabled={current === TOTAL - 1}
      aria-label="Next slide"
    >
      <ChevronRight size={20} strokeWidth={1.75} />
    </button>

    <span class="counter" aria-hidden="true"
      >{pad(current + 1)} / {pad(TOTAL)}</span
    >
  </footer>
</main>

<style>
  .halo {
    position: fixed;
    top: 30%;
    left: 50%;
    width: 680px;
    height: 680px;
    transform: translate(-50%, -50%);
    background: radial-gradient(
      circle,
      rgba(var(--brand-rgb), 0.13),
      transparent 62%
    );
    filter: blur(46px);
    pointer-events: none;
    z-index: 0;
  }

  .deck {
    position: relative;
    z-index: 1;
    height: calc(100dvh - var(--layout-header-height, 36px));
    display: flex;
    flex-direction: column;
  }

  .viewport {
    position: relative;
    flex: 1;
    min-height: 0;
  }

  .slide {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: clamp(1.5rem, 5vw, 4rem);
  }

  .slide-body {
    width: 100%;
    max-width: 880px;
    text-align: left;
  }

  .slide-body.wide {
    max-width: 1040px;
  }

  .slide-body.center {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* ── Shared type scale ─────────────────────────────────── */
  .eyebrow {
    display: inline-block;
    color: var(--brand);
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 0.9rem;
  }

  .title {
    margin: 0;
    color: var(--text);
    font-size: clamp(1.8rem, 4.6vw, 3rem);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.05;
  }

  .message {
    color: var(--text-muted);
    font-size: clamp(1rem, 1.7vw, 1.2rem);
    line-height: 1.6;
    max-width: 44rem;
    margin: 1.1rem 0 0;
  }

  .message.center-msg {
    margin-left: auto;
    margin-right: auto;
  }

  .aside {
    color: var(--text-muted);
    font-size: 0.9rem;
    margin: 1.4rem 0 0;
  }

  /* ── Cover / close ─────────────────────────────────────── */
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 1rem;
  }

  .logomark {
    display: grid;
    place-items: center;
    width: 60px;
    height: 60px;
    border-radius: 16px;
    color: var(--brand);
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
  }

  .logomark.big {
    width: 52px;
    height: 52px;
    margin-bottom: 1.6rem;
  }

  .wordmark {
    margin: 0;
    font-size: clamp(3rem, 11vw, 5rem);
    font-weight: 700;
    letter-spacing: -0.045em;
    line-height: 1;
    color: var(--text);
  }

  .lead {
    margin: 1.6rem 0 0;
    color: var(--text);
    font-size: clamp(1.15rem, 2.4vw, 1.6rem);
    font-weight: 600;
  }

  .sub {
    margin: 0.5rem 0 0;
    color: var(--text-muted);
    font-size: 1rem;
  }

  .hint {
    margin: 2rem 0 0;
    color: var(--text-muted);
    font-size: 0.82rem;
  }

  .hint kbd,
  .cover kbd {
    font-family: "SF Mono", "Roboto Mono", ui-monospace, monospace;
    font-size: 0.72rem;
    padding: 0.1rem 0.4rem;
    border: 1px solid var(--border-strong);
    border-radius: 5px;
    color: var(--text);
    background: var(--surface-elevated);
  }

  .cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin: 1.8rem 0 0;
    padding: 0.7rem 1.3rem;
    border-radius: var(--radius-lg);
    background: var(--primary);
    color: var(--primary-foreground);
    border: 1px solid var(--primary);
    font-weight: 600;
    font-size: 0.95rem;
    text-decoration: none;
    transition:
      opacity 0.2s ease,
      box-shadow 0.2s ease;
  }

  .cta:hover {
    opacity: 0.92;
    box-shadow: var(--shadow-lg);
  }

  .cta:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.35);
  }

  /* ── Points / lists ────────────────────────────────────── */
  .points {
    list-style: none;
    margin: 1.6rem 0 0;
    padding: 0;
    display: grid;
    gap: 0.7rem;
  }

  .points.tight {
    margin-top: 1.2rem;
    gap: 0.5rem;
  }

  .points li {
    position: relative;
    padding-left: 1.4rem;
    color: var(--text);
    font-size: 1rem;
    line-height: 1.5;
  }

  .points li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.55em;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--brand);
  }

  .points code {
    font-family: "SF Mono", "Roboto Mono", ui-monospace, monospace;
    font-size: 0.85em;
    padding: 0.05rem 0.3rem;
    border-radius: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
  }

  /* ── Problem chips ─────────────────────────────────────── */
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    margin-top: 1.8rem;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 0.85rem;
    border-radius: 9999px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-muted);
    font-size: 0.85rem;
    transform: rotate(var(--rot, 0deg));
  }

  .chip.muted {
    color: var(--text-muted);
    opacity: 0.7;
    font-style: italic;
  }

  /* ── Audience roles ────────────────────────────────────── */
  .roles {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.8rem;
    margin-top: 1.8rem;
  }

  .role {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.1rem 0.6rem;
    border-radius: var(--radius-xl);
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
    color: var(--text-muted);
    font-size: 0.85rem;
    font-weight: 600;
    text-align: center;
    transition:
      color 0.2s ease,
      border-color 0.2s ease;
  }

  .role:hover {
    color: var(--brand);
    border-color: rgba(var(--brand-rgb), 0.35);
  }

  .role :global(svg) {
    color: var(--brand);
  }

  /* ── Modules grid ──────────────────────────────────────── */
  .modules {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.7rem;
    margin-top: 1.6rem;
  }

  .module {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.8rem 0.9rem;
    border-radius: var(--radius-lg);
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
    transition:
      border-color 0.2s ease,
      transform 0.2s ease;
  }

  .module:hover {
    border-color: rgba(var(--brand-rgb), 0.35);
    transform: translateY(-2px);
  }

  .module-icon {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    border-radius: var(--radius-lg);
    color: var(--text-muted);
    background: var(--surface);
    border: 1px solid var(--border);
    transition: color 0.2s ease;
  }

  .module:hover .module-icon {
    color: var(--brand);
  }

  .module-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .module-eyebrow {
    color: var(--brand);
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .module-name {
    color: var(--text);
    font-size: 0.95rem;
    font-weight: 600;
  }

  /* ── Serpentine pipeline ───────────────────────────────── */
  /* All three rows share one column template so the cards line up in a grid
     and the turn arrow sits exactly under the top-right card. */
  .serp {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin: 2rem 0 0;
  }

  .srow,
  .turn-row {
    display: grid;
    grid-template-columns: 1fr 48px 1fr 48px 1fr;
    align-items: center;
  }

  .pnode {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 1.05rem 1.2rem;
    border-radius: var(--radius-xl);
    background: var(--surface-elevated);
    border: 1px solid rgba(var(--brand-rgb), 0.32);
    box-shadow: var(--shadow-sm);
    animation: pop 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: calc(var(--step) * 95ms);
  }

  .pnode-icon {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    flex-shrink: 0;
    border-radius: var(--radius-lg);
    color: var(--brand);
    background: rgba(var(--brand-rgb), 0.08);
    border: 1px solid rgba(var(--brand-rgb), 0.25);
  }

  .pnode-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .pnode-num {
    font-family: "SF Mono", "Roboto Mono", ui-monospace, monospace;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .pnode-name {
    font-size: 1.1rem;
    font-weight: 650;
    color: var(--text);
  }

  .pnode-sub {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .parrow {
    display: grid;
    place-items: center;
    color: rgba(var(--brand-rgb), 0.75);
    animation: pop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: calc(var(--step) * 95ms + 40ms);
  }

  /* Continuous directional drift to suggest the flow direction. */
  .parrow.right :global(svg) {
    animation: nudge-r 1.7s ease-in-out infinite;
  }

  .parrow.left :global(svg) {
    animation: nudge-l 1.7s ease-in-out infinite;
  }

  .turn-row {
    height: 40px;
  }

  .turn {
    grid-column: 5;
    justify-self: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    color: rgba(var(--brand-rgb), 0.75);
    animation: pop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: calc(3 * 95ms + 40ms);
  }

  .turn-line {
    width: 2px;
    height: 14px;
    background: linear-gradient(
      to bottom,
      var(--border),
      rgba(var(--brand-rgb), 0.6)
    );
  }

  .turn :global(svg) {
    animation: nudge-d 1.7s ease-in-out infinite;
  }

  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes nudge-r {
    0%,
    100% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(4px);
    }
  }

  @keyframes nudge-l {
    0%,
    100% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(-4px);
    }
  }

  @keyframes nudge-d {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(3px);
    }
  }

  /* ── Dataflow ──────────────────────────────────────────── */
  .dataflow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
    margin-top: 1.8rem;
  }

  .df-node {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.85rem;
    border-radius: var(--radius-lg);
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
    color: var(--text);
    font-size: 0.88rem;
    font-weight: 600;
  }

  .df-node.off {
    margin-left: 0.4rem;
    background: var(--surface);
    color: var(--text-muted);
    text-decoration: line-through;
    text-decoration-color: var(--border-strong);
    box-shadow: none;
  }

  .dataflow :global(.df-arrow) {
    color: var(--border-strong);
  }

  /* ── Strengths ─────────────────────────────────────────── */
  .strengths {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 0.8rem;
    margin-top: 1.8rem;
  }

  .strength {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 1rem;
    border-radius: var(--radius-xl);
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
    border-top: 2px solid rgba(var(--brand-rgb), 0.55);
  }

  .strength-icon {
    color: var(--brand);
  }

  .strength-label {
    color: var(--text);
    font-size: 0.95rem;
    font-weight: 650;
  }

  .strength-note {
    color: var(--text-muted);
    font-size: 0.8rem;
    line-height: 1.4;
  }

  /* ── Roadmap timeline ──────────────────────────────────── */
  .timeline {
    position: relative;
    list-style: none;
    margin: 1.8rem 0 0;
    padding: 0 0 0 1.4rem;
    display: grid;
    gap: 0.85rem;
  }

  .timeline::before {
    content: "";
    position: absolute;
    left: 5px;
    top: 6px;
    bottom: 6px;
    width: 1px;
    background: var(--border);
  }

  .tl-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }

  .tl-dot {
    position: absolute;
    left: -1.4rem;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: var(--bg);
    border: 1.5px solid var(--border-strong);
  }

  .tl-item.done .tl-dot {
    background: var(--brand);
    border-color: var(--brand);
  }

  .tl-label {
    color: var(--text);
    font-size: 0.98rem;
  }

  .tl-tag {
    margin-left: auto;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
    padding: 0.15rem 0.5rem;
    border-radius: 9999px;
    border: 1px solid var(--border);
    background: var(--surface);
  }

  .tl-item.done .tl-tag {
    color: var(--brand);
    border-color: rgba(var(--brand-rgb), 0.4);
  }

  /* ── Controls ──────────────────────────────────────────── */
  .controls {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    padding: 1rem;
  }

  .nav-btn {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: var(--radius-lg);
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    color: var(--text-muted);
    cursor: pointer;
    transition:
      color 0.15s,
      border-color 0.15s,
      background 0.15s;
  }

  .nav-btn:hover:not(:disabled) {
    color: var(--brand);
    border-color: rgba(var(--brand-rgb), 0.4);
  }

  .nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .nav-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.2);
  }

  .dots {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    padding: 0;
    border-radius: 50%;
    border: none;
    background: var(--border-strong);
    cursor: pointer;
    transition:
      background 0.2s ease,
      transform 0.2s ease,
      width 0.2s ease;
  }

  .dot:hover {
    background: var(--text-muted);
  }

  .dot.active {
    width: 22px;
    border-radius: 9999px;
    background: var(--brand);
  }

  .dot:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.25);
  }

  .counter {
    position: absolute;
    right: 1.2rem;
    font-family: "SF Mono", "Roboto Mono", ui-monospace, monospace;
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    color: var(--text-muted);
  }

  /* ── Entrance stagger (replays on each slide via {#key}) ── */
  .r {
    animation: rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: calc(var(--i, 0) * 70ms);
  }

  .module,
  .strength,
  .tl-item,
  .chip {
    animation: rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: var(--d, 0ms);
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ── Responsive ────────────────────────────────────────── */
  @media (max-width: 720px) {
    .roles {
      grid-template-columns: repeat(2, 1fr);
    }
    .counter {
      display: none;
    }
    .chip {
      transform: none;
    }

    /* Collapse the serpentine into a single readable column (1 → 6). */
    .srow {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
    .parrow,
    .turn-row {
      display: none;
    }
    /* Bottom row is authored 6 ← 5 ← 4; reverse it so it reads 4 → 5 → 6. */
    .srow:last-child {
      display: flex;
      flex-direction: column-reverse;
      gap: 0.5rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .r,
    .module,
    .strength,
    .tl-item,
    .chip,
    .pnode,
    .parrow,
    .turn {
      animation: none !important;
    }
    .parrow :global(svg),
    .turn :global(svg) {
      animation: none !important;
    }
    .chip {
      transform: rotate(var(--rot, 0deg));
    }
  }
</style>

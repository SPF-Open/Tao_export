<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
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
    CloudOff,
    Sparkles,
    Cpu,
    AlertTriangle,
  } from "lucide-svelte";
  import DotCanvas from "$lib/ui/DotCanvas.svelte";
  import { docs } from "$lib/docs";

  const SITE_URL = "https://tao.lv0.eu";
  const PAGE_TITLE = "TAO — Presentation";
  const PAGE_DESC =
    "A guided tour of TAO, the unified exam toolkit: import, build, export, audit and analyse exams end to end — all in the browser.";

  // ── Deck state ──────────────────────────────────────────
  const slides = [
    "Cover",
    "Problem",
    "Vision",
    "Audience",
     "Modules",
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

  // ── Content data ────────────────────────────────────────
  // The exam pipeline, laid out as a serpentine: top row left→right, turn down,
  // bottom row right→left.
  const pipeline = [
    { step: 1, name: "Import", sub: "Excel in", icon: Upload },
    { step: 2, name: "Forge", sub: "Build", icon: Hammer },
    { step: 3, name: "Export", sub: "PDF / JSON", icon: Download },
    { step: 4, name: "Audit", sub: "Validate", icon: ScanSearch },
    { step: 5, name: "IAT", sub: "Analyse", icon: ClipboardCheck },
    { step: 6, name: "Library", sub: "Archive", icon: Library },
  ];
  const topRow = pipeline.slice(0, 3);
  const bottomRow = [pipeline[5], pipeline[4], pipeline[3]];

  // ── The "scattered work" chaos scene ──────────────────────
  // A messy, overlapping heap of source files — the four real sources plus a
  // little junk-drawer clutter — jittering as if about to topple.
  const messCards = [
    { icon: FileSpreadsheet, label: "Excel banks", rot: -8, z: 5, bad: true },
    { icon: FileArchive, label: "QTI packages", rot: 5, z: 4 },
    { icon: FileText, label: "Print PDFs", rot: -4, z: 6, bad: true },
    { icon: Braces, label: "Result data", rot: 7, z: 4 },
    { icon: FileSpreadsheet, label: "bank_v3_FINAL.xlsx", rot: 3, z: 2, ghost: true },
    { icon: FileText, label: "draft_v7.pdf", rot: -6, z: 1, ghost: true },
  ];

  // Excel-style error glyphs and version-soup, scattered over the heap.
  const glitchTags = [
    { t: "#REF!", x: "4%", y: "2%", d: 0 },
    { t: "v2_final_FINAL", x: "64%", y: "-2%", d: 0.5 },
    { t: "broken link", x: "80%", y: "44%", d: 1 },
    { t: "merge conflict", x: "-2%", y: "60%", d: 0.7 },
    { t: "#VALUE!", x: "46%", y: "72%", d: 1.3 },
    { t: "missing sheet", x: "28%", y: "-6%", d: 0.2 },
    { t: "NaN", x: "54%", y: "38%", d: 1.6 },
  ];

  // Warning triangles pulsing over the pile.
  const warnMarks = [
    { x: "18%", y: "16%", d: 0 },
    { x: "70%", y: "58%", d: 0.6 },
    { x: "86%", y: "8%", d: 1 },
  ];

  const visionPoints = [
    { icon: Layers, text: "The full exam lifecycle in one place" },
    { icon: CloudOff, text: "100% client-side — zero upload" },
    { icon: ShieldCheck, text: "Privacy-first by design" },
    { icon: Sparkles, text: "Calm, premium, distraction-free" },
  ];

  const roles = [
    { icon: Users, label: "Authors" },
    { icon: ShieldCheck, label: "Reviewers / QA" },
    { icon: FileText, label: "Administrators" },
    { icon: ChartNoAxesColumn, label: "Item analysts" },
  ];

  const flowNodes = [
    { icon: FileArchive, label: "File" },
    { icon: Cpu, label: "Parse" },
    { icon: Globe, label: "Render" },
    { icon: FileText, label: "Export" },
  ];

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

  // ── Cursor-reactive cards: spotlight follows the pointer, card tilts toward it.
  const MAX_TILT = 7;
  function onCardMove(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    el.style.setProperty("--mx", `${px}px`);
    el.style.setProperty("--my", `${py}px`);
    if (reduce) return;
    const nx = px / r.width - 0.5;
    const ny = py / r.height - 0.5;
    el.style.setProperty("--ry", `${nx * MAX_TILT * 2}deg`);
    el.style.setProperty("--rx", `${-ny * MAX_TILT * 2}deg`);
  }
  function onCardLeave(e: PointerEvent) {
    const el = e.currentTarget as HTMLElement;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

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

  // Dramatic slide entrance: blur + scale + lift. Gated on reduced motion.
  function zoom(_node: Element) {
    return {
      duration: reduce ? 0 : 540,
      easing: cubicOut,
      css: (t: number, u: number) =>
        `opacity:${t}; transform: translateY(${u * 34}px) scale(${0.94 + 0.06 * t}); filter: blur(${u * 6}px);`,
    };
  }
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

<!-- TAO logomark (ringed triad). The ring slowly spins. -->
{#snippet logomark(size: number)}
  <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
    <circle
      class="ring"
      cx="16"
      cy="16"
      r="13"
      stroke="currentColor"
      stroke-width="1.4"
      opacity="0.35"
    />
    <circle cx="16" cy="8.5" r="2.1" fill="currentColor" />
    <circle cx="22.5" cy="19.5" r="2.1" fill="currentColor" opacity="0.65" />
    <circle cx="9.5" cy="19.5" r="2.1" fill="currentColor" opacity="0.65" />
    <path
      d="M16 8.5 L22.5 19.5 L9.5 19.5 Z"
      stroke="currentColor"
      stroke-width="1.2"
      opacity="0.5"
    />
  </svg>
{/snippet}

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
        in:zoom
        out:fade={leave}
      >
        {#if current === 0}
          <!-- 1 · Cover -->
          <div class="slide-body center cover">
            <div class="brand r" style="--i:0">
              <span class="logomark spin" aria-hidden="true"
                >{@render logomark(30)}</span
              >
              <h1 class="wordmark" data-text="TAO">TAO</h1>
            </div>
            <p class="lead r" style="--i:1">Exams, end to end.</p>
            <p class="sub r" style="--i:3">A unified exam toolkit</p>
            <p class="hint r" style="--i:4">press <kbd>→</kbd> to start</p>
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

            <!-- The mess: a jittering heap of files, errors and version-soup. -->
            <div class="chaos" aria-hidden="true">
              <div class="pile">
                <div class="pile-halo"></div>

                <div class="heap">
                  {#each messCards as c, i}
                    {@const Icon = c.icon}
                    <div
                      class="paper"
                      class:ghost={c.ghost}
                      style="--rot:{c.rot}deg; --z:{c.z}; --d:{i * 90}ms"
                    >
                      <span class="paper-icon"
                        ><Icon size={17} strokeWidth={1.75} /></span
                      >
                      <span class="paper-name">{c.label}</span>
                      {#if c.bad}
                        <span class="paper-badge"
                          ><AlertTriangle size={12} strokeWidth={2.6} /></span
                        >
                      {/if}
                    </div>
                  {/each}

                  <!-- One card breaks loose and tumbles out of the pile. -->
                  <div class="paper falling">
                    <span class="paper-icon"
                      ><FileText size={17} strokeWidth={1.75} /></span
                    >
                    <span class="paper-name">results_old.csv</span>
                  </div>
                </div>

                {#each glitchTags as g}
                  <span class="glitch" style="left:{g.x}; top:{g.y}; --d:{g.d}s"
                    >{g.t}</span
                  >
                {/each}

                {#each warnMarks as w}
                  <span class="warnmark" style="left:{w.x}; top:{w.y}; --d:{w.d}s"
                    ><AlertTriangle size={16} strokeWidth={2.6} /></span
                  >
                {/each}
              </div>
            </div>

            <p class="aside r" style="--i:6">
              …stitched together by eye, with no single home.
            </p>
          </div>
        {:else if current === 2}
          <!-- 3 · Vision -->
          <div class="slide-body wide">
            <span class="eyebrow r" style="--i:0">The vision</span>
            <h2 class="title r" style="--i:1">One quiet workspace</h2>
            <p class="message r" style="--i:2">
              Import, build, export, audit and analyse exams from a single
              browser-based workspace — nothing leaves the machine.
            </p>
            <div class="vgrid">
              {#each visionPoints as p, i}
                {@const Icon = p.icon}
                <div class="in" style="--d:{300 + i * 80}ms">
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div
                    class="fx vcard"
                    onpointermove={onCardMove}
                    onpointerleave={onCardLeave}
                  >
                    <span class="vcard-icon"
                      ><Icon size={20} strokeWidth={1.75} /></span
                    >
                    <span class="vcard-text">{p.text}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {:else if current === 3}
          <!-- 4 · Audience -->
          <div class="slide-body wide">
            <span class="eyebrow r" style="--i:0">Who it's for</span>
            <h2 class="title r" style="--i:1">Built for the test team</h2>
            <p class="message r" style="--i:2">
              Made specifically for the SPF Finances testing team and the people
              around the exam cycle.
            </p>
            <div class="roles">
              {#each roles as role, i}
                {@const Icon = role.icon}
                <div class="in" style="--d:{300 + i * 80}ms">
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div
                    class="fx role"
                    onpointermove={onCardMove}
                    onpointerleave={onCardLeave}
                  >
                    <span class="role-icon"
                      ><Icon size={22} strokeWidth={1.75} /></span
                    >
                    <span>{role.label}</span>
                  </div>
                </div>
              {/each}
            </div>
            <p class="aside r" style="--i:6">
              Multilingual context — FR · NL · DE
            </p>
          </div>
        {:else if current === 4}
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
        {:else if current === 5}
          <!-- 7 · How it works -->
          <div class="slide-body wide">
            <span class="eyebrow r" style="--i:0">Under the hood</span>
            <h2 class="title r" style="--i:1">Everything in the browser</h2>
            <p class="message r" style="--i:2">
              No backend, no database, no upload — the heavy lifting runs
              locally.
            </p>
            <div class="dataflow">
              {#each flowNodes as n, i}
                {@const Icon = n.icon}
                <div class="in" style="--d:{300 + i * 90}ms">
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div
                    class="fx df-node"
                    onpointermove={onCardMove}
                    onpointerleave={onCardLeave}
                  >
                    <span class="df-icon"
                      ><Icon size={18} strokeWidth={1.75} /></span
                    >
                    <span>{n.label}</span>
                  </div>
                </div>
                {#if i < flowNodes.length - 1}
                  <span
                    class="df-arrow-wrap"
                    style="--d:{340 + i * 90}ms"
                    aria-hidden="true"
                  >
                    <ArrowRight size={20} strokeWidth={2.4} />
                  </span>
                {/if}
              {/each}
              <div class="in" style="--d:{300 + flowNodes.length * 90}ms">
                <div class="df-node off">
                  <ServerOff size={18} strokeWidth={1.75} /> No server
                </div>
              </div>
            </div>
            <ul class="points tight r" style="--i:6">
              <li>ZIP parsing &amp; Excel reading in-page</li>
              <li>Full SQLite in the browser for the Library</li>
              <li>PDF via print · JSON · encrypted <code>.taodb</code></li>
              <li>Works offline after first load</li>
            </ul>
          </div>
        {:else if current === 6}
          <!-- 8 · Strengths -->
          <div class="slide-body wide">
            <span class="eyebrow r" style="--i:0">Why it stands out</span>
            <h2 class="title r" style="--i:1">Few tools do all of this</h2>
            <p class="message r" style="--i:2">
              Cover the whole lifecycle and keep data on-device.
            </p>
            <div class="strengths">
              {#each strengths as s, i}
                {@const Icon = s.icon}
                <div class="in" style="--d:{280 + i * 70}ms">
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div
                    class="fx strength"
                    onpointermove={onCardMove}
                    onpointerleave={onCardLeave}
                  >
                    <span class="strength-bar"></span>
                    <span class="strength-icon"
                      ><Icon size={20} strokeWidth={1.75} /></span
                    >
                    <span class="strength-label">{s.label}</span>
                    <span class="strength-note">{s.note}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {:else}
          <!-- 9 · Close -->
          <div class="slide-body center cover">
            <span class="logomark big spin r" style="--i:0" aria-hidden="true"
              >{@render logomark(26)}</span
            >
            <h2 class="title r" style="--i:1">Exams, end to end.</h2>
            <p class="message center-msg r" style="--i:3">
              One workspace for the whole exam lifecycle — quiet, private,
              complete.
            </p>
            <a class="cta r" style="--i:4" href="/">
              Open TAO <ArrowUpRight size={17} strokeWidth={2} />
            </a>
            <p class="hint r" style="--i:5">
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
  @property --beam {
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
  }

  .halo {
    position: fixed;
    top: 30%;
    left: 50%;
    width: 680px;
    height: 680px;
    transform: translate(-50%, -50%);
    background: radial-gradient(
      circle,
      rgba(var(--brand-rgb), 0.14),
      transparent 62%
    );
    filter: blur(46px);
    pointer-events: none;
    z-index: 0;
    animation: halo-drift 16s ease-in-out infinite;
  }

  @keyframes halo-drift {
    0%,
    100% {
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      transform: translate(-46%, -55%) scale(1.14);
    }
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
    padding: clamp(1.25rem, 5vw, 4rem);
    overflow: auto;
  }

  .slide-body {
    width: 100%;
    max-width: 880px;
    text-align: left;
  }

  .slide-body.wide {
    max-width: 1060px;
  }

  .slide-body.center {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* ── Shared type scale ─────────────────────────────────── */
  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--brand);
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 0.9rem;
  }

  .eyebrow::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--brand);
    box-shadow: 0 0 0 0 rgba(var(--brand-rgb), 0.5);
    animation: pulse 2.4s ease-out infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(var(--brand-rgb), 0.5);
    }
    70% {
      box-shadow: 0 0 0 7px rgba(var(--brand-rgb), 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(var(--brand-rgb), 0);
    }
  }

  .title {
    position: relative;
    margin: 0;
    padding-bottom: 0.55rem;
    color: var(--text);
    font-size: clamp(1.9rem, 4.8vw, 3.1rem);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.05;
  }

  .title::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    height: 3px;
    width: 0;
    border-radius: 3px;
    background: linear-gradient(
      90deg,
      var(--brand),
      rgba(var(--brand-rgb), 0.15)
    );
    animation: underline 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.25s forwards;
  }

  .center .title::after {
    left: 50%;
    transform: translateX(-50%);
  }

  @keyframes underline {
    to {
      width: 3.4rem;
    }
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

  /* ── Flowing wave line ─────────────────────────────────── */
  .wave {
    width: min(100%, 620px);
    height: 46px;
    margin: 1.4rem 0 0;
  }

  .center .wave {
    margin-left: auto;
    margin-right: auto;
  }

  .wave svg {
    width: 100%;
    height: 100%;
    overflow: visible;
    animation: wave-breathe 4.5s ease-in-out infinite;
  }

  .wave-path {
    fill: none;
    stroke: rgba(var(--brand-rgb), 0.55);
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-dasharray: 10 14;
    filter: drop-shadow(0 0 6px rgba(var(--brand-rgb), 0.45));
    animation: wave-flow 1.1s linear infinite;
  }

  .wave.broken .wave-path {
    stroke: var(--border-strong);
    stroke-dasharray: 3 20;
    filter: none;
    opacity: 0.7;
    animation-duration: 2.4s;
  }

  @keyframes wave-flow {
    to {
      stroke-dashoffset: -24;
    }
  }

  @keyframes wave-breathe {
    0%,
    100% {
      transform: scaleY(1);
    }
    50% {
      transform: scaleY(1.25);
    }
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

  .logomark .ring {
    transform-origin: 16px 16px;
    animation: spin 9s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .wordmark {
    position: relative;
    margin: 0;
    font-size: clamp(3rem, 11vw, 5rem);
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
    animation: sheen 1.6s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both;
  }

  @keyframes sheen {
    from {
      background-position: 120% 0;
    }
    to {
      background-position: -60% 0;
    }
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
    margin: 1.6rem 0 0;
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
    position: relative;
    overflow: hidden;
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
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  /* Light sweep travelling across the button forever. */
  .cta::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      100deg,
      transparent 30%,
      rgba(255, 255, 255, 0.35) 50%,
      transparent 70%
    );
    background-size: 250% 100%;
    background-position: 150% 0;
    animation: cta-sheen 2.6s ease-in-out infinite;
  }

  @keyframes cta-sheen {
    to {
      background-position: -80% 0;
    }
  }

  .cta:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .cta:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.35);
  }

  /* ── Points / lists ────────────────────────────────────── */
  .points {
    list-style: none;
    margin: 1.4rem 0 0;
    padding: 0;
    display: grid;
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

  /* ── Interactive card FX (tilt + spotlight + beam border) ─ */
  .fx {
    --rx: 0deg;
    --ry: 0deg;
    --lift: 0px;
    position: relative;
    overflow: hidden;
    isolation: isolate;
    height: 100%;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-sm);
    transform-style: preserve-3d;
    transform: perspective(900px) rotateX(var(--rx)) rotateY(var(--ry))
      translateY(var(--lift));
    transition:
      transform 0.18s ease,
      border-color 0.25s ease,
      box-shadow 0.25s ease;
  }

  .fx:hover {
    --lift: -4px;
    border-color: rgba(var(--brand-rgb), 0.45);
    box-shadow: var(--shadow-lg);
  }

  /* cursor-following brand spotlight */
  .fx::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      220px circle at var(--mx, 50%) var(--my, 50%),
      rgba(var(--brand-rgb), 0.13),
      transparent 60%
    );
    opacity: 0;
    transition: opacity 0.25s ease;
    pointer-events: none;
    z-index: 0;
  }

  .fx:hover::after {
    opacity: 1;
  }

  /* single-accent beam that sweeps the hairline on hover */
  .fx::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: conic-gradient(
      from var(--beam),
      transparent 0deg,
      rgba(var(--brand-rgb), 0.75) 40deg,
      transparent 120deg
    );
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.25s ease;
    pointer-events: none;
    z-index: 1;
  }

  .fx:hover::before {
    opacity: 1;
    animation: beam 2.6s linear infinite;
  }

  @keyframes beam {
    to {
      --beam: 360deg;
    }
  }

  .fx > * {
    position: relative;
    z-index: 2;
  }

  /* Staggered entrance wrapper (replays each slide via {#key}) */
  .in {
    animation: pop 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: var(--d, 0ms);
  }

  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(16px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* ── "Scattered work" chaos scene ──────────────────────── */
  /* Local alarm tint — theme-aware (danger isn't exposed as RGB tokens). */
  .chaos {
    --warn-rgb: 220, 38, 38;
    position: relative;
    margin-top: 1.6rem;
  }

  :global(.dark) .chaos {
    --warn-rgb: 239, 68, 68;
  }

  .pile {
    position: relative;
    height: clamp(220px, 34vh, 320px);
    /* The whole heap trembles in periodic nervous shudders. */
    animation: panic 5s ease-in-out infinite;
  }

  .pile-halo {
    position: absolute;
    inset: 8% 12%;
    background: radial-gradient(
      circle,
      rgba(var(--warn-rgb), 0.12),
      transparent 65%
    );
    filter: blur(34px);
    z-index: 0;
    animation: alarm 3.6s ease-in-out infinite;
  }

  @keyframes alarm {
    0%,
    100% {
      opacity: 0.45;
    }
    50% {
      opacity: 1;
    }
  }

  /* Overlapping pile of file cards, centred in the stage. */
  .heap {
    position: absolute;
    inset: 0;
    display: flex;
    flex-wrap: wrap;
    align-content: center;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  .paper {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin: -6px -12px;
    padding: 0.65rem 0.9rem;
    border-radius: var(--radius-lg);
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-lg);
    color: var(--text);
    font-family: "SF Mono", "Roboto Mono", ui-monospace, monospace;
    font-size: 0.82rem;
    font-weight: 600;
    white-space: nowrap;
    z-index: var(--z, 1);
    transform: rotate(var(--rot, 0deg));
    animation:
      paper-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both,
      jitter 4.5s ease-in-out infinite;
    animation-delay: var(--d, 0ms), calc(var(--d, 0ms) + 500ms);
  }

  .paper.ghost {
    opacity: 0.55;
    box-shadow: var(--shadow);
    color: var(--text-muted);
  }

  .paper-icon {
    display: grid;
    place-items: center;
    color: var(--text-muted);
  }

  .paper-badge {
    display: grid;
    place-items: center;
    position: absolute;
    top: -7px;
    right: -7px;
    width: 19px;
    height: 19px;
    border-radius: 50%;
    color: var(--danger-foreground);
    background: var(--danger);
    box-shadow: var(--shadow-sm);
    animation: throb 1.6s ease-in-out infinite;
  }

  /* The loose card that tumbles out of the heap. */
  .paper.falling {
    position: absolute;
    left: 50%;
    top: 18%;
    margin: 0;
    z-index: 7;
    color: var(--text-muted);
    border-color: var(--border-strong);
    animation: tumble 4.4s cubic-bezier(0.5, 0, 0.7, 1) infinite;
  }

  @keyframes tumble {
    0% {
      transform: translate(-50%, 0) rotate(-4deg);
      opacity: 0;
    }
    12% {
      opacity: 1;
    }
    100% {
      transform: translate(40%, 150%) rotate(82deg);
      opacity: 0;
    }
  }

  @keyframes paper-in {
    from {
      opacity: 0;
      transform: translateY(-14px) rotate(var(--rot, 0deg)) scale(0.94);
    }
    to {
      opacity: 1;
      transform: rotate(var(--rot, 0deg));
    }
  }

  /* Each card wobbles a touch on its own rhythm. */
  @keyframes jitter {
    0%,
    100% {
      transform: rotate(var(--rot, 0deg)) translate(0, 0);
    }
    50% {
      transform: rotate(calc(var(--rot, 0deg) + 1.4deg)) translate(2px, -2px);
    }
  }

  /* Nervous, mostly-still shudder for the whole pile. */
  @keyframes panic {
    0%,
    86%,
    100% {
      transform: translate(0, 0) rotate(0deg);
    }
    88% {
      transform: translate(-3px, 1px) rotate(-0.5deg);
    }
    90% {
      transform: translate(3px, -2px) rotate(0.5deg);
    }
    92% {
      transform: translate(-3px, 1px) rotate(-0.4deg);
    }
    94% {
      transform: translate(2px, -1px) rotate(0.3deg);
    }
    96% {
      transform: translate(-1px, 1px) rotate(-0.2deg);
    }
  }

  /* Excel-error / version-soup tags floating over the heap. */
  .glitch {
    position: absolute;
    z-index: 6;
    padding: 0.12rem 0.42rem;
    border-radius: 5px;
    font-family: "SF Mono", "Roboto Mono", ui-monospace, monospace;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--danger);
    background: rgba(var(--warn-rgb), 0.1);
    border: 1px solid rgba(var(--warn-rgb), 0.32);
    white-space: nowrap;
    animation:
      float-tag 6s ease-in-out infinite,
      flicker 3.4s steps(1, end) infinite;
    animation-delay: var(--d, 0s);
  }

  @keyframes float-tag {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-7px);
    }
  }

  @keyframes flicker {
    0%,
    92%,
    100% {
      opacity: 1;
    }
    94%,
    98% {
      opacity: 0.25;
    }
    96% {
      opacity: 1;
    }
  }

  .warnmark {
    position: absolute;
    z-index: 6;
    display: grid;
    place-items: center;
    color: var(--danger);
    filter: drop-shadow(0 1px 2px rgba(var(--warn-rgb), 0.4));
    animation: throb 1.9s ease-in-out infinite;
    animation-delay: var(--d, 0s);
  }

  @keyframes throb {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.18);
      opacity: 1;
    }
  }

  /* ── Vision cards ──────────────────────────────────────── */
  .vgrid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.9rem;
    margin-top: 1.8rem;
    perspective: 1000px;
  }

  .vcard {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding: 1.15rem 1.2rem;
  }

  .vcard-icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: var(--radius-lg);
    color: var(--brand);
    background: rgba(var(--brand-rgb), 0.08);
    border: 1px solid rgba(var(--brand-rgb), 0.22);
  }

  .vcard-text {
    font-size: 1.02rem;
    font-weight: 550;
    color: var(--text);
    line-height: 1.4;
  }

  /* ── Audience roles ────────────────────────────────────── */
  .roles {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.9rem;
    margin-top: 1.8rem;
    perspective: 1000px;
  }

  .role {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.65rem;
    padding: 1.4rem 0.7rem;
    color: var(--text);
    font-size: 0.92rem;
    font-weight: 600;
    text-align: center;
  }

  .role-icon {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    color: var(--brand);
    background: rgba(var(--brand-rgb), 0.08);
    border: 1px solid rgba(var(--brand-rgb), 0.22);
  }

  /* ── Modules grid ──────────────────────────────────────── */
  .modules {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.9rem;
    margin-top: 1.6rem;
    perspective: 1200px;
  }

  .module {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 1.05rem 1.1rem;
  }

  .module-icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: var(--radius-lg);
    color: var(--text-muted);
    background: var(--surface);
    border: 1px solid var(--border);
    transition:
      color 0.25s ease,
      background 0.25s ease,
      border-color 0.25s ease;
  }

  .module:hover .module-icon {
    color: var(--brand);
    background: rgba(var(--brand-rgb), 0.08);
    border-color: rgba(var(--brand-rgb), 0.25);
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
    font-size: 1rem;
    font-weight: 600;
  }

  .module :global(.module-arrow) {
    margin-left: auto;
    color: var(--text-muted);
    opacity: 0;
    transform: translate(-4px, 4px);
    transition:
      opacity 0.25s ease,
      transform 0.25s ease,
      color 0.25s ease;
  }

  .module:hover :global(.module-arrow) {
    opacity: 1;
    transform: translate(0, 0);
    color: var(--brand);
  }

  /* ── Serpentine pipeline ───────────────────────────────── */
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
    perspective: 1000px;
  }

  .df-node {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.05rem;
    color: var(--text);
    font-size: 0.95rem;
    font-weight: 600;
  }

  .df-icon {
    display: grid;
    place-items: center;
    color: var(--brand);
  }

  .df-node.off {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: 0.4rem;
    padding: 0.75rem 1.05rem;
    border-radius: var(--radius-xl);
    background: var(--surface);
    border: 1px dashed var(--border-strong);
    color: var(--text-muted);
    font-size: 0.95rem;
    font-weight: 600;
    text-decoration: line-through;
    text-decoration-color: var(--border-strong);
  }

  .df-arrow-wrap {
    display: grid;
    place-items: center;
    color: rgba(var(--brand-rgb), 0.75);
    animation: fade-in 0.4s ease both;
    animation-delay: var(--d, 0ms);
  }

  .df-arrow-wrap :global(svg) {
    animation: nudge-r 1.7s ease-in-out infinite;
  }

  /* ── Strengths ─────────────────────────────────────────── */
  .strengths {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 0.9rem;
    margin-top: 1.8rem;
    perspective: 1200px;
  }

  .strength {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 1.2rem 1.1rem;
  }

  .strength-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 3px;
    width: 0;
    border-radius: 0 3px 3px 0;
    background: linear-gradient(
      90deg,
      var(--brand),
      rgba(var(--brand-rgb), 0.2)
    );
    animation: bar-fill 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
    z-index: 2;
  }

  @keyframes bar-fill {
    to {
      width: 100%;
    }
  }

  .strength-icon {
    color: var(--brand);
    margin-top: 0.3rem;
  }

  .strength-label {
    color: var(--text);
    font-size: 1rem;
    font-weight: 650;
  }

  .strength-note {
    color: var(--text-muted);
    font-size: 0.82rem;
    line-height: 1.4;
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

  /* ── Text entrance stagger ─────────────────────────────── */
  .r {
    animation: rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: calc(var(--i, 0) * 70ms);
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
  @media (max-width: 860px) {
    .vgrid {
      grid-template-columns: 1fr;
    }
    .roles {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 720px) {
    .counter {
      display: none;
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
    .srow:last-child {
      display: flex;
      flex-direction: column-reverse;
      gap: 0.5rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .r,
    .in,
    .pile,
    .pile-halo,
    .paper,
    .paper-badge,
    .glitch,
    .warnmark,
    .pnode,
    .parrow,
    .turn,
    .df-arrow-wrap,
    .halo,
    .logomark .ring,
    .wave svg,
    .wave-path,
    .strength-bar,
    .title::after,
    .wordmark::after,
    .cta::after,
    .eyebrow::before {
      animation: none !important;
    }
    .paper {
      transform: rotate(var(--rot, 0deg));
    }
    /* The tumbling card has no resting state — hide it when motion is off. */
    .paper.falling {
      display: none;
    }
    .strength-bar {
      width: 100%;
    }
    .title::after {
      width: 3.4rem;
    }
  }
</style>

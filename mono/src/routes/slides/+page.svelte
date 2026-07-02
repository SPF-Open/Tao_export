<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { goto, replaceState } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { ChevronLeft, ChevronRight } from "lucide-svelte";
  import DotCanvas from "$lib/ui/DotCanvas.svelte";
  import { slides, TOTAL } from "$lib/slides/data";
  import SlideCover from "$lib/slides/SlideCover.svelte";
  import SlideProblem from "$lib/slides/SlideProblem.svelte";
  import SlideVision from "$lib/slides/SlideVision.svelte";
  import SlideAudience from "$lib/slides/SlideAudience.svelte";
  import SlideJourney from "$lib/slides/SlideJourney.svelte";
  import SlideHow from "$lib/slides/SlideHow.svelte";
  import SlideStrengths from "$lib/slides/SlideStrengths.svelte";
  import SlideClose from "$lib/slides/SlideClose.svelte";
  import "$lib/slides/slides.css";

  const SITE_URL = "https://tao.lv0.eu";
  const PAGE_TITLE = "TAO — Presentation";
  const PAGE_DESC =
    "A guided tour of TAO, the unified exam toolkit: import, build, export, audit and analyse exams end to end — all in the browser.";

  // One component per slide, in deck order (matches `slides` in data.ts).
  const slideComponents = [
    SlideCover,
    SlideProblem,
    SlideVision,
    SlideAudience,
    SlideJourney,
    SlideHow,
    SlideStrengths,
    SlideClose,
  ];

  // ── Deck state ──────────────────────────────────────────
  let current = $state(0);
  let reduce = $state(false);

  const CurrentSlide = $derived(slideComponents[current]);

  function go(i: number) {
    current = Math.max(0, Math.min(TOTAL - 1, i));
    // Mirror the active slide in the URL (?slide=N, 1-based) so a reload or a
    // shared link lands on the same slide. Shallow routing — no navigation.
    if (browser) {
      try {
        replaceState(`?slide=${current + 1}`, {});
      } catch {
        // Router not initialised yet — the URL syncs on the next change.
      }
    }
  }
  const next = () => go(current + 1);
  const prev = () => go(current - 1);

  const pad = (n: number) => String(n).padStart(2, "0");

  onMount(() => {
    // Restore the slide from ?slide=N on load / reload / shared link.
    const param = new URLSearchParams(window.location.search).get("slide");
    const n = param ? parseInt(param, 10) : NaN;
    if (Number.isFinite(n)) go(n - 1);

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
        <CurrentSlide />
      </section>
    {/key}
  </div>

  <footer class="controls hide-print">
    <button
      type="button"
      class="nav-btn"
      onclick={prev}
      disabled={current === 0}
      aria-label="Previous slide"
    >
      <ChevronLeft size={20} strokeWidth={1.75} />
    </button>

    <div class="dots" role="tablist" aria-label="Slides">
      {#each slides as label, i (label)}
        <button
          type="button"
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
      type="button"
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

  @media (max-width: 720px) {
    .counter {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .halo {
      animation: none !important;
    }
  }
</style>

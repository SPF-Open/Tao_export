<script lang="ts">
  import { AlertTriangle, FileText } from "lucide-svelte";
  import { messCards, glitchTags, warnMarks } from "./data.js";
</script>

<div class="slide-body">
  <span class="eyebrow r" style="--i:0">The context</span>
  <h2 class="title r" style="--i:1">Exams are scattered work</h2>
  <p class="message r" style="--i:2">
    Building, reviewing and analysing exams means juggling Excel, the TAO
    platform, PDFs and spreadsheets — across disconnected tools.
  </p>

  <!-- The mess: a jittering heap of files, errors and version-soup. -->
  <div class="chaos" aria-hidden="true">
    <div class="pile">
      <div class="pile-halo"></div>

      <div class="heap">
        {#each messCards as c, i (c.label)}
          {@const Icon = c.icon}
          <div
            class="paper"
            class:ghost={c.ghost}
            style="--rot:{c.rot}deg; --z:{c.z}; --d:{i * 90}ms"
          >
            <span class="paper-icon"><Icon size={17} strokeWidth={1.75} /></span>
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
          <span class="paper-icon"><FileText size={17} strokeWidth={1.75} /></span>
          <span class="paper-name">results_old.csv</span>
        </div>
      </div>

      {#each glitchTags as g (g.t)}
        <span class="glitch" style="left:{g.x}; top:{g.y}; --d:{g.d}s">{g.t}</span>
      {/each}

      {#each warnMarks as w (w.x)}
        <span class="warnmark" style="left:{w.x}; top:{w.y}; --d:{w.d}s"
          ><AlertTriangle size={16} strokeWidth={2.6} /></span
        >
      {/each}
    </div>
  </div>

  <p class="aside r" style="--i:6">…stitched together by eye, with no single home.</p>
</div>

<style>
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
    background: radial-gradient(circle, rgba(var(--warn-rgb), 0.12), transparent 65%);
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

  @media (prefers-reduced-motion: reduce) {
    .pile,
    .pile-halo,
    .paper,
    .paper-badge,
    .glitch,
    .warnmark {
      animation: none !important;
    }
    .paper {
      transform: rotate(var(--rot, 0deg));
    }
    /* The tumbling card has no resting state — hide it when motion is off. */
    .paper.falling {
      display: none;
    }
  }
</style>

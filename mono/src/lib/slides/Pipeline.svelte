<script lang="ts">
  // Serpentine exam pipeline: row 1 → , turn ↓ , row 2 ←
  import { ArrowRight, ArrowLeft, ArrowDown } from "lucide-svelte";
  import { topRow, bottomRow, type PipelineStep } from "./data.js";
</script>

{#snippet pnode(item: PipelineStep)}
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

<style>
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
    animation: deck-pop 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
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
    animation: deck-pop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
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
    animation: deck-pop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: calc(3 * 95ms + 40ms);
  }

  .turn-line {
    width: 2px;
    height: 14px;
    background: linear-gradient(to bottom, var(--border), rgba(var(--brand-rgb), 0.6));
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

  /* Collapse the serpentine into a single readable column (1 → 6). */
  @media (max-width: 720px) {
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
      /* Override the base `align-items: center` so cards fill the column
         width like the grid-based top row does. */
      align-items: stretch;
      gap: 0.5rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pnode,
    .parrow,
    .turn,
    .parrow.right :global(svg),
    .parrow.left :global(svg),
    .turn :global(svg) {
      animation: none !important;
    }
  }
</style>

<script lang="ts">
  import { ArrowRight, ServerOff } from "lucide-svelte";
  import { flowNodes } from "./data.js";
  import { tilt } from "$lib/utils/tilt.js";
</script>

<div class="slide-body wide">
  <span class="eyebrow r" style="--i:0">Under the hood</span>
  <h2 class="title r" style="--i:1">Everything in the browser</h2>
  <p class="message r" style="--i:2">
    No backend, no database, no upload — the heavy lifting runs locally.
  </p>
  <div class="dataflow">
    {#each flowNodes as n, i (n.label)}
      {@const Icon = n.icon}
      <div class="in" style="--d:{300 + i * 90}ms">
        <div class="fx df-node" use:tilt>
          <span class="df-icon"><Icon size={18} strokeWidth={1.75} /></span>
          <span>{n.label}</span>
        </div>
      </div>
      {#if i < flowNodes.length - 1}
        <span class="df-arrow-wrap" style="--d:{340 + i * 90}ms" aria-hidden="true">
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

<style>
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
    animation: deck-fade-in 0.4s ease both;
    animation-delay: var(--d, 0ms);
  }

  .df-arrow-wrap :global(svg) {
    animation: nudge-r 1.7s ease-in-out infinite;
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

  @media (prefers-reduced-motion: reduce) {
    .df-arrow-wrap,
    .df-arrow-wrap :global(svg) {
      animation: none !important;
    }
  }
</style>

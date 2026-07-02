<script lang="ts">
  import { strengths } from "./data.js";
  import { tilt } from "$lib/utils/tilt.js";
</script>

<div class="slide-body wide">
  <span class="eyebrow r" style="--i:0">Why it stands out</span>
  <h2 class="title r" style="--i:1">Few tools do all of this</h2>
  <p class="message r" style="--i:2">
    Cover the whole lifecycle and keep data on-device.
  </p>
  <div class="strengths">
    {#each strengths as s, i (s.label)}
      {@const Icon = s.icon}
      <div class="in" style="--d:{280 + i * 70}ms">
        <div class="fx strength" use:tilt>
          <span class="strength-bar"></span>
          <span class="strength-icon"><Icon size={20} strokeWidth={1.75} /></span>
          <span class="strength-label">{s.label}</span>
          <span class="strength-note">{s.note}</span>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
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
    background: linear-gradient(90deg, var(--brand), rgba(var(--brand-rgb), 0.2));
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

  @media (prefers-reduced-motion: reduce) {
    .strength-bar {
      animation: none !important;
      width: 100%;
    }
  }
</style>

<script lang="ts">
  import { visionPoints } from "./data.js";
  import { tilt } from "$lib/utils/tilt.js";
</script>

<div class="slide-body wide">
  <span class="eyebrow r" style="--i:0">The vision</span>
  <h2 class="title r" style="--i:1">One quiet workspace</h2>
  <p class="message r" style="--i:2">
    Import, build, export, audit and analyse exams from a single browser-based
    workspace — nothing leaves the machine.
  </p>
  <div class="vgrid">
    {#each visionPoints as p, i (p.text)}
      {@const Icon = p.icon}
      <div class="in" style="--d:{300 + i * 80}ms">
        <div class="fx vcard" use:tilt>
          <span class="vcard-icon"><Icon size={20} strokeWidth={1.75} /></span>
          <span class="vcard-text">{p.text}</span>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
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

  @media (max-width: 860px) {
    .vgrid {
      grid-template-columns: 1fr;
    }
  }
</style>

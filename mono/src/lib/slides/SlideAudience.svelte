<script lang="ts">
  import { roles } from "./data.js";
  import { tilt } from "$lib/utils/tilt.js";
</script>

<div class="slide-body wide">
  <span class="eyebrow r" style="--i:0">Who it's for</span>
  <h2 class="title r" style="--i:1">Built for the test team</h2>
  <p class="message r" style="--i:2">
    Made specifically for the SPF Finances testing team and the people around
    the exam cycle.
  </p>
  <div class="roles">
    {#each roles as role, i (role.label)}
      {@const Icon = role.icon}
      <div class="in" style="--d:{300 + i * 80}ms">
        <div class="fx role" use:tilt>
          <span class="role-icon"><Icon size={22} strokeWidth={1.75} /></span>
          <span>{role.label}</span>
        </div>
      </div>
    {/each}
  </div>
  <p class="aside r" style="--i:6">Multilingual context — FR · NL · DE</p>
</div>

<style>
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

  @media (max-width: 860px) {
    .roles {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>

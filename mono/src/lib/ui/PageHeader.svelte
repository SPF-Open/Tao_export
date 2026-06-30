<script lang="ts">
  import type { ComponentType } from 'svelte';

  interface Props {
    title: string;
    subtitle?: string;
    eyebrow?: string;
    /** A lucide-svelte icon component rendered in the brand tile. */
    icon?: ComponentType;
    align?: 'left' | 'center';
    /** Optional trailing controls (toolbar, buttons). */
    actions?: import('svelte').Snippet;
  }

  let { title, subtitle = '', eyebrow = '', icon, align = 'left', actions }: Props = $props();
  const Icon = $derived(icon);
</script>

<header class="page-header align-{align}">
  <div class="ph-main">
    {#if Icon}
      <span class="ph-icon" aria-hidden="true">
        <Icon size={22} strokeWidth={1.75} />
      </span>
    {/if}
    <div class="ph-text">
      {#if eyebrow}
        <span class="ph-eyebrow">
          <span class="ph-dot"></span>
          {eyebrow}
        </span>
      {/if}
      <h1 class="ph-title">{title}</h1>
      {#if subtitle}
        <p class="ph-subtitle">{subtitle}</p>
      {/if}
    </div>
  </div>
  {#if actions}
    <div class="ph-actions">
      {@render actions()}
    </div>
  {/if}
</header>

<style>
  .page-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
    margin-top: 0.5rem;
    animation: ph-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .align-center {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .ph-main {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    min-width: 0;
  }

  .align-center .ph-main {
    flex-direction: column;
  }

  .ph-icon {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    flex-shrink: 0;
    border-radius: var(--radius-lg);
    color: var(--brand);
    background: rgba(var(--brand-rgb), 0.1);
    border: 1px solid rgba(var(--brand-rgb), 0.22);
  }

  .ph-text {
    min-width: 0;
  }

  .ph-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .ph-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--brand);
  }

  .ph-title {
    margin: 0.15rem 0 0;
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.1;
    color: var(--text);
  }

  .ph-subtitle {
    margin: 0.3rem 0 0;
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--text-muted);
  }

  .ph-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  @keyframes ph-rise {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .page-header { animation: none; }
  }
</style>

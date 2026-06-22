<script lang="ts">
  import type { ComponentType } from 'svelte';

  interface Props {
    title: string;
    description?: string;
    /** A lucide-svelte icon component rendered in the brand tile. */
    icon?: ComponentType;
    /** Optional CTA / dropzone content. */
    children?: import('svelte').Snippet;
  }

  let { title, description = '', icon, children }: Props = $props();
  const Icon = $derived(icon);
</script>

<div class="empty-state">
  <span class="es-halo" aria-hidden="true"></span>
  {#if Icon}
    <span class="es-icon" aria-hidden="true">
      <Icon size={26} strokeWidth={1.5} />
    </span>
  {/if}
  <h2 class="es-title">{title}</h2>
  {#if description}
    <p class="es-description">{description}</p>
  {/if}
  {#if children}
    <div class="es-body">
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .empty-state {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.5rem;
    padding: 2rem 1rem;
    animation: es-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .es-halo {
    position: absolute;
    top: 30%;
    left: 50%;
    width: 360px;
    height: 360px;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(var(--brand-rgb), 0.12), transparent 65%);
    filter: blur(30px);
    pointer-events: none;
    z-index: 0;
  }

  .es-icon {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    margin-bottom: 0.4rem;
    border-radius: var(--radius-xl);
    color: var(--brand);
    background: rgba(var(--brand-rgb), 0.1);
    border: 1px solid rgba(var(--brand-rgb), 0.22);
  }

  .es-title {
    position: relative;
    z-index: 1;
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--text);
  }

  .es-description {
    position: relative;
    z-index: 1;
    margin: 0;
    max-width: 26rem;
    font-size: 0.9rem;
    line-height: 1.55;
    color: var(--text-muted);
  }

  .es-body {
    position: relative;
    z-index: 1;
    width: 100%;
    margin-top: 1rem;
  }

  @keyframes es-rise {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .empty-state { animation: none; }
  }
</style>

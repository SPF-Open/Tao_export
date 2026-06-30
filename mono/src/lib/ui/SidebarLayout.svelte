<script lang="ts">
  import type { Snippet } from "svelte";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { sidebarEnabled, sidebarOpen } from "$lib/sidebar";

  function sidebarFly() {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return { x: -320, duration: reduce ? 0 : 200, easing: cubicOut };
  }

  interface Props {
    /** Sidebar body (filters, settings, navigation, inputs). */
    sidebar?: Snippet;
    /** Main content (a PageHeader + the primary surface). */
    children?: Snippet;
    sidebarLabel?: string;
  }

  let { sidebar, children, sidebarLabel = "Section navigation" }: Props = $props();

  // This route has a sidebar; the global header burger + backdrop (in
  // +layout.svelte) control its open state and the mobile drawer overlay.
  $effect(() => {
    sidebarEnabled.set(true);
    return () => sidebarEnabled.set(false);
  });
</script>

<div class="content">
  {#if $sidebarOpen}
    <aside class="sidebar" aria-label={sidebarLabel} transition:fly={sidebarFly()}>
      <div class="sidebar-content">
        {@render sidebar?.()}
      </div>
    </aside>
  {/if}

  <div class="main-area">
    {@render children?.()}
  </div>
</div>

<style>
  .content {
    display: flex;
    flex: 1;
    min-height: calc(100vh - var(--layout-header-height));
  }

  .sidebar {
    position: sticky;
    top: var(--layout-header-height);
    height: calc(100vh - var(--layout-header-height));
    width: var(--sidebar-width);
    background: var(--surface);
    border-right: 1px solid var(--border);
    box-shadow: var(--shadow-lg);
    z-index: 50;
    overflow-y: auto;
    scrollbar-gutter: stable;
    flex-shrink: 0;
  }

  .sidebar-content {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 100%;
  }

  .main-area {
    flex: 1;
    min-width: 0;
    padding: 0 16px 2rem;
  }

  /* Phones: the sidebar becomes a left overlay drawer above the global backdrop. */
  @media (max-width: 640px) {
    .sidebar {
      position: fixed;
      left: 0;
      top: var(--layout-header-height);
      width: min(86vw, var(--sidebar-width));
      z-index: 60;
      box-shadow: var(--shadow-xl);
    }
    .main-area {
      padding: 0 12px 2rem;
    }
  }

  @media print {
    .sidebar {
      display: none !important;
    }
    .main-area {
      padding: 0;
    }
  }
</style>

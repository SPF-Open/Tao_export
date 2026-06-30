<script lang="ts">
  import type { Snippet } from "svelte";
  import { sidebarEnabled, sidebarOpen } from "$lib/sidebar";

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
  <div class="sidebar-wrapper" class:sidebar-wrapper--open={$sidebarOpen}>
    <aside
      class="sidebar"
      aria-label={sidebarLabel}
      aria-hidden={!$sidebarOpen}
      inert={!$sidebarOpen}
    >
      <div class="sidebar-content">
        {@render sidebar?.()}
      </div>
    </aside>
  </div>

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

  /* Desktop: sticky wrapper clips to 0 width, transitions open */
  .sidebar-wrapper {
    position: sticky;
    top: var(--layout-header-height);
    align-self: flex-start;
    height: calc(100vh - var(--layout-header-height));
    width: 0;
    overflow: hidden;
    flex-shrink: 0;
    transition: width 220ms cubic-bezier(0.33, 1, 0.68, 1);
  }

  .sidebar-wrapper--open {
    width: var(--sidebar-width);
  }

  .sidebar {
    width: var(--sidebar-width);
    height: 100%;
    background: var(--surface);
    border-right: 1px solid var(--border);
    z-index: 50;
    overflow-y: auto;
    scrollbar-gutter: stable;
  }

  .sidebar-content {
    padding: 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    min-height: 100%;
  }

  .main-area {
    flex: 1;
    min-width: 0;
    padding: 0 16px 2rem;
  }

  /* Phones: translate-based overlay drawer (fixed, not in flex flow) */
  @media (max-width: 640px) {
    .sidebar-wrapper {
      position: fixed;
      left: 0;
      top: var(--layout-header-height);
      width: min(86vw, var(--sidebar-width));
      height: calc(100vh - var(--layout-header-height));
      overflow: visible;
      transition: transform 220ms cubic-bezier(0.33, 1, 0.68, 1);
      transform: translateX(-100%);
      z-index: 60;
    }

    .sidebar-wrapper--open {
      width: min(86vw, var(--sidebar-width));
      transform: translateX(0);
    }

    .sidebar {
      width: 100%;
      box-shadow: var(--shadow-xl);
    }

    .main-area {
      padding: 0 12px 2rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sidebar-wrapper {
      transition-duration: 0ms;
    }
  }

  @media print {
    .sidebar-wrapper {
      display: none !important;
    }
    .main-area {
      padding: 0;
    }
  }
</style>

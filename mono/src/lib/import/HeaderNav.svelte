<script lang="ts">
  import { Menu } from "lucide-svelte";

  interface Props {
    showSidebar?: boolean;
    onToggle?: () => void;
  }

  let { showSidebar = $bindable(true), onToggle }: Props = $props();
</script>

<header class="header hide-print">
  <div class="header-left">
    <button
      class="menu-toggle"
      onclick={() => onToggle?.()}
      aria-label="Toggle sidebar"
      title="Toggle sidebar"
    >
      <Menu size={18} />
    </button>
  </div>

  <div class="header-center"></div>

  <div class="header-right">
  </div>
</header>

<style>
  .header {
    position: sticky;
    top: var(--layout-header-height);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--header-height);
    padding: 0 16px;
    background: var(--surface-elevated);
    border-bottom: 1px solid var(--border);
    gap: 16px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: fit-content;
  }

  .header-center {
    flex: 1;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: fit-content;
  }

  .menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--text);
    border-radius: var(--radius);
    cursor: pointer;
    transition: background 0.2s;
  }

  .menu-toggle:hover {
    background: var(--surface);
  }

  .app-title {
    font-weight: 600;
    font-size: 16px;
    color: var(--text);
    white-space: nowrap;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--text);
    border-radius: var(--radius);
    cursor: pointer;
    transition: background 0.2s;
  }

  .icon-btn:hover {
    background: var(--surface);
  }
</style>

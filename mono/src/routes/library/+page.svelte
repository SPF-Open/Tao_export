<script lang="ts">
  import { get } from "svelte/store";
  import { onMount } from "svelte";
  import { Library, Database, Upload, Search, TerminalSquare, FileStack } from "lucide-svelte";
  import { PageHeader } from "$lib/ui";
  import { sidebarEnabled, sidebarOpen } from "$lib/sidebar";
  import { dbInfo, busy, ingestRunning, restoreDb } from "$lib/library/store";
  import DbPanel from "$lib/library/components/DbPanel.svelte";
  import IngestPanel from "$lib/library/components/IngestPanel.svelte";
  import SearchFilters from "$lib/library/components/SearchFilters.svelte";
  import SearchResults from "$lib/library/components/SearchResults.svelte";
  import QueryModal from "$lib/library/components/QueryModal.svelte";

  type Tab = "db" | "ingest" | "search";
  let tab = $state<Tab>("db");
  let queryOpen = $state(false);

  const tabs: { id: Tab; label: string; icon: typeof Database }[] = [
    { id: "db", label: "Database", icon: Database },
    { id: "ingest", label: "Import", icon: Upload },
    { id: "search", label: "Search", icon: Search },
  ];

  const subtitles: Record<Tab, string> = {
    db: "Create, open and export your portable .taodb question library.",
    ingest: "Import TAO QTI .zip exports — up to 100 at a time.",
    search: "Search the question bank instantly; refine with the filters on the left.",
  };

  // This page owns the global sidebar.
  $effect(() => {
    sidebarEnabled.set(true);
    return () => sidebarEnabled.set(false);
  });

  // Reattach to a persisted (OPFS) library so it survives a page refresh.
  onMount(() => {
    if (!get(dbInfo)) void restoreDb();
  });

  // Guard against accidental refresh/close when unsaved data is at risk:
  // an import in progress, or an in-memory (non-persistent) DB with content.
  function onBeforeUnload(event: BeforeUnloadEvent) {
    const info = get(dbInfo);
    const risky =
      get(ingestRunning) ||
      (info != null && info.storageMode === "memory" && info.counts.questions > 0);
    if (risky) {
      event.preventDefault();
      event.returnValue = "";
    }
  }
  $effect(() => {
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  });
</script>

<svelte:head>
  <title>Library — TAO</title>
  <meta name="description" content="A portable, in-browser SQLite question library for TAO QTI exports — import, search and export your question bank." />
  <meta property="og:title" content="Library — TAO" />
  <meta property="og:description" content="A portable, in-browser SQLite question library for TAO QTI exports." />
  <meta name="twitter:title" content="Library — TAO" />
</svelte:head>

<main>
  <div class="content">
    {#if $sidebarOpen}
      <aside class="sidebar">
        <div class="sidebar-content">
          <div class="brand"><Library size={16} strokeWidth={1.9} /> <span>Library</span></div>

          <nav class="mode-switch" aria-label="Library sections">
            {#each tabs as t (t.id)}
              {@const Icon = t.icon}
              <button class="mode-btn" class:active={tab === t.id} onclick={() => (tab = t.id)}
                aria-current={tab === t.id ? "page" : undefined}>
                <Icon size={15} strokeWidth={1.75} />
                <span>{t.label}</span>
                {#if t.id === "db" && $dbInfo}<span class="dot" aria-hidden="true"></span>{/if}
              </button>
            {/each}
          </nav>

          {#if tab === "search"}
            <SearchFilters />
          {:else if tab === "db"}
            <p class="side-hint">Manage your library file on the right. Everything stays in your browser.</p>
          {:else}
            <p class="side-hint">Drop TAO <code>.zip</code> exports on the right; they import through a queue.</p>
          {/if}

          <div class="divider"></div>

          <button class="query-btn" onclick={() => (queryOpen = true)} disabled={!$dbInfo}>
            <TerminalSquare size={15} strokeWidth={1.75} /> Write SQL query
          </button>

          {#if $dbInfo}
            <div class="db-chip">
              <FileStack size={13} strokeWidth={1.75} />
              <span>{$dbInfo.counts.questions} questions · {$dbInfo.counts.tests} tests</span>
            </div>
          {/if}

          {#if $busy}<span class="busy" aria-live="polite">Working…</span>{/if}
        </div>
      </aside>
    {/if}

    <div class="main-area">
      <PageHeader
        icon={Library}
        eyebrow="Question bank"
        title={tabs.find((t) => t.id === tab)?.label ?? "Library"}
        subtitle={subtitles[tab]}
      />

      <section class="panel">
        {#if tab === "db"}<DbPanel />
        {:else if tab === "ingest"}<IngestPanel />
        {:else}<SearchResults />{/if}
      </section>
    </div>
  </div>

  <QueryModal bind:open={queryOpen} />
</main>

<style>
  .content {
    display: flex;
    flex: 1;
    min-height: calc(100vh - var(--layout-header-height) - 40px);
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

  .sidebar-content { padding: 10px; display: flex; flex-direction: column; gap: 10px; }

  .brand { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: var(--text); letter-spacing: -0.01em; padding: 2px; }

  .mode-switch {
    display: flex; flex-direction: column; gap: 4px;
    padding: 4px; background: var(--surface-elevated);
    border: 1px solid var(--border); border-radius: var(--radius-lg);
  }
  .mode-btn {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 7px 10px; background: transparent; border: none;
    border-radius: var(--radius); color: var(--text-muted);
    font-family: var(--font-family); font-size: 13px; font-weight: 500;
    cursor: pointer; transition: background 0.15s, color 0.15s; text-align: left;
  }
  .mode-btn:hover { color: var(--text); }
  .mode-btn.active { background: var(--accent); color: var(--accent-foreground); }
  .mode-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--success); margin-left: auto; }

  .side-hint { margin: 0; font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; }
  code { font-family: ui-monospace, monospace; font-size: 0.85em; }

  .divider { height: 1px; background: var(--border); margin: 2px 0; }

  .query-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem;
    padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius);
    background: var(--surface-elevated); color: var(--text);
    font-family: var(--font-family); font-size: 0.85rem; font-weight: 500; cursor: pointer;
    transition: border-color 0.15s, background 0.15s, color 0.15s;
  }
  .query-btn:hover:not(:disabled) { border-color: rgba(var(--brand-rgb), 0.5); color: var(--brand); background: rgba(var(--brand-rgb), 0.06); }
  .query-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .query-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }

  .db-chip {
    display: inline-flex; align-items: center; gap: 0.4rem;
    font-size: 0.76rem; color: var(--text-muted);
    padding: 4px 6px; border-radius: var(--radius);
  }
  .busy { font-size: 0.78rem; color: var(--text-muted); }

  .main-area { flex: 1; min-width: 0; padding: 0 16px 2rem; }
  .main-area :global(.page-header) { margin-top: 0.5rem; }

  .panel { animation: fade 200ms ease; max-width: 960px; }
  @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .panel { animation: none; } }
</style>

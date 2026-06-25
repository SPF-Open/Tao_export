<script lang="ts">
  import { Library, Database, Upload, Search } from "lucide-svelte";
  import { PageHeader } from "$lib/ui";
  import { dbInfo, busy } from "$lib/library/store";
  import DbPanel from "$lib/library/components/DbPanel.svelte";
  import IngestPanel from "$lib/library/components/IngestPanel.svelte";
  import SearchPanel from "$lib/library/components/SearchPanel.svelte";

  type Tab = "db" | "ingest" | "search";
  let tab = $state<Tab>("db");

  const tabs: { id: Tab; label: string; icon: typeof Database }[] = [
    { id: "db", label: "Database", icon: Database },
    { id: "ingest", label: "Import", icon: Upload },
    { id: "search", label: "Search", icon: Search },
  ];
</script>

<svelte:head>
  <title>Library — TAO</title>
  <meta name="description" content="A portable, in-browser SQLite question library for TAO QTI exports — import, search and export your question bank." />
  <meta property="og:title" content="Library — TAO" />
  <meta property="og:description" content="A portable, in-browser SQLite question library for TAO QTI exports." />
  <meta name="twitter:title" content="Library — TAO" />
</svelte:head>

<main>
  <PageHeader
    icon={Library}
    eyebrow="Question bank"
    title="Library"
    subtitle="Build a portable SQLite question database from TAO exports, then search it instantly — all in your browser."
  />

  <nav class="tabs" aria-label="Library sections">
    {#each tabs as t (t.id)}
      {@const Icon = t.icon}
      <button class="tab" class:active={tab === t.id} onclick={() => (tab = t.id)}
        aria-current={tab === t.id ? "page" : undefined}>
        <Icon size={16} strokeWidth={1.75} />
        <span>{t.label}</span>
        {#if t.id === "db" && $dbInfo}<span class="dot" aria-hidden="true"></span>{/if}
      </button>
    {/each}
    {#if $busy}<span class="busy" aria-live="polite">Working…</span>{/if}
  </nav>

  <section class="panel">
    {#if tab === "db"}<DbPanel />
    {:else if tab === "ingest"}<IngestPanel />
    {:else}<SearchPanel />{/if}
  </section>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 0.3rem;
    max-width: 960px;
    width: 100%;
    margin-inline: auto;
    padding: 0 0.5rem 2rem;
  }
  .tabs {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    border-bottom: 1px solid var(--border);
    padding-bottom: 0.1rem;
    flex-wrap: wrap;
  }
  .tab {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 0.85rem;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: var(--font-family);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color 150ms ease, border-color 150ms ease;
  }
  .tab:hover { color: var(--text); }
  .tab.active { color: var(--brand); border-bottom-color: var(--brand); }
  .tab:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); border-radius: var(--radius); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--success); }
  .busy { margin-left: auto; font-size: 0.78rem; color: var(--text-muted); }
  .panel { animation: fade 200ms ease; }
  @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .panel { animation: none; } }
</style>

<script lang="ts">
  import { Play, TerminalSquare, Table2, Lightbulb, Key, Link2 } from "lucide-svelte";
  import { Modal } from "$lib/ui";
  import {
    SCHEMA_TABLES,
    SCHEMA_EDGES,
    QUERY_EXAMPLES,
    STAGE,
    type ExampleDoc,
    type EdgeDoc,
  } from "$lib/library/schemaDoc";
  import { runSqlQuery, sqlResult, sqlError, sqlRunning } from "$lib/library/store";

  let { open = $bindable(false) }: { open?: boolean } = $props();

  let sql = $state(QUERY_EXAMPLES[0].sql);
  let activeIndex = $state(0);
  let hovered = $state<ExampleDoc | null>(null);

  // What to highlight: the hovered example takes priority over the picked one.
  const highlight = $derived(hovered ?? QUERY_EXAMPLES[activeIndex] ?? null);
  const activeTables = $derived(new Set(highlight?.tables ?? []));
  const activeCols = $derived<Record<string, string[]>>(highlight?.columns ?? {});

  function pick(i: number) {
    activeIndex = i;
    sql = QUERY_EXAMPLES[i].sql;
  }
  function colActive(table: string, col: string): boolean {
    return (activeCols[table] ?? []).includes(col);
  }
  function edgeActive(e: EdgeDoc): boolean {
    return activeTables.has(e.from) && activeTables.has(e.to);
  }
  function run() {
    void runSqlQuery(sql);
  }
</script>

<Modal bind:open size="xl">
  {#snippet title()}
    <span class="mtitle"><TerminalSquare size={17} strokeWidth={1.75} /> SQL query console</span>
  {/snippet}

  <p class="intro">
      Run read-only <code>SELECT</code> queries against your library. The diagram shows the tables and
      their relationships — hover an example to see which tables and columns it touches.
    </p>

    <!-- ER diagram -->
    <div class="diagram-scroll">
      <div class="stage" style="width:{STAGE.width}px;height:{STAGE.height}px">
        <svg class="edges" viewBox="0 0 {STAGE.width} {STAGE.height}" aria-hidden="true">
          {#each SCHEMA_EDGES as e (e.from + e.to)}
            <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} class="edge" class:hl={edgeActive(e)} />
            <circle cx={e.x1} cy={e.y1} r="3.5" class="node" class:hl={edgeActive(e)} />
            <circle cx={e.x2} cy={e.y2} r="3.5" class="node" class:hl={edgeActive(e)} />
            <text x={(e.x1 + e.x2) / 2} y={(e.y1 + e.y2) / 2 - 4} class="elabel" class:hl={edgeActive(e)}>{e.label}</text>
          {/each}
        </svg>

        {#each SCHEMA_TABLES as t (t.name)}
          <div class="tbl" class:active={activeTables.has(t.name)} style="left:{t.x}px;top:{t.y}px" title={t.desc}>
            <div class="tbl-head"><Table2 size={12} strokeWidth={2} /> {t.name}</div>
            <ul>
              {#each t.columns as c (c.name)}
                <li class:col-active={colActive(t.name, c.name)} title={c.desc}>
                  <span class="cname">{c.name}</span>
                  {#if c.pk}<span class="badge pk"><Key size={9} strokeWidth={2.5} /></span>{/if}
                  {#if c.ref}<span class="badge fk"><Link2 size={9} strokeWidth={2.5} /> {c.ref}</span>{/if}
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    </div>

    <div class="work">
      <!-- Examples -->
      <aside class="examples">
        <h3><Lightbulb size={14} strokeWidth={1.9} /> Examples</h3>
        <ul>
          {#each QUERY_EXAMPLES as ex, i (ex.title)}
            <li>
              <button type="button"
                class="ex"
                class:active={i === activeIndex && !hovered}
                onclick={() => pick(i)}
                onmouseenter={() => (hovered = ex)}
                onmouseleave={() => (hovered = null)}
                onfocus={() => (hovered = ex)}
                onblur={() => (hovered = null)}
              >
                <span class="ex-title">{ex.title}</span>
                <span class="ex-desc">{ex.description}</span>
              </button>
            </li>
          {/each}
        </ul>
      </aside>

      <!-- Editor + results -->
      <div class="console">
        <textarea class="editor" bind:value={sql} spellcheck="false" rows="6" aria-label="SQL query"></textarea>
        <div class="console-bar">
          <button type="button" class="run" onclick={run} disabled={$sqlRunning}>
            <Play size={14} strokeWidth={2} /> {$sqlRunning ? "Running…" : "Run"}
          </button>
          {#if $sqlResult}
            <span class="meta">
              {$sqlResult.rowCount} row{$sqlResult.rowCount === 1 ? "" : "s"} · {$sqlResult.durationMs.toFixed(1)} ms{#if $sqlResult.truncated} · showing first {$sqlResult.rows.length}{/if}
            </span>
          {/if}
        </div>

        {#if $sqlError}
          <p class="err">{$sqlError}</p>
        {/if}

        {#if $sqlResult}
          {#if $sqlResult.columns.length === 0}
            <p class="empty">Query ran successfully (no columns returned).</p>
          {:else}
            <div class="result-scroll">
              <table>
                <thead>
                  <tr>{#each $sqlResult.columns as c (c)}<th>{c}</th>{/each}</tr>
                </thead>
                <tbody>
                  {#each $sqlResult.rows as row, ri (ri)}
                    <tr>
                      {#each row as cell, ci (ci)}
                        <td class:null={cell === null}>{cell === null ? "NULL" : cell}</td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        {/if}
      </div>
    </div>
</Modal>

<style>
  .mtitle { display: inline-flex; align-items: center; gap: 0.5rem; }
  .intro { margin: 0 0 0.85rem; font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; }
  code { font-family: ui-monospace, monospace; font-size: 0.85em; background: var(--surface); padding: 0 4px; border-radius: 4px; }

  /* Diagram */
  .diagram-scroll {
    overflow-x: auto; border: 1px solid var(--border);
    border-radius: var(--radius-lg); background: var(--surface);
    padding: 8px;
  }
  .stage { position: relative; }
  .edges { position: absolute; inset: 8px; width: calc(100% - 16px); height: calc(100% - 16px); overflow: visible; pointer-events: none; }
  .edge { stroke: var(--border-strong); stroke-width: 1.5; transition: stroke 150ms ease, stroke-width 150ms ease; }
  .edge.hl { stroke: var(--brand); stroke-width: 2.5; }
  .node { fill: var(--border-strong); transition: fill 150ms ease; }
  .node.hl { fill: var(--brand); }
  .elabel { fill: var(--text-muted); font-size: 9px; font-weight: 600; text-anchor: middle; }
  .elabel.hl { fill: var(--brand); }

  .tbl {
    position: absolute; width: 168px;
    background: var(--surface-elevated); border: 1px solid var(--border);
    border-radius: var(--radius); box-shadow: var(--shadow-sm);
    overflow: hidden; transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
  }
  .tbl.active { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); transform: translateY(-1px); }
  .tbl-head {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 8px; font-size: 0.74rem; font-weight: 700;
    color: var(--text); background: var(--surface);
    border-bottom: 1px solid var(--border); font-family: ui-monospace, monospace;
  }
  .tbl.active .tbl-head { color: var(--brand); background: rgba(var(--brand-rgb), 0.08); }
  .tbl ul { list-style: none; margin: 0; padding: 2px; }
  .tbl li {
    display: flex; align-items: center; gap: 4px;
    padding: 2px 5px; font-size: 0.7rem; color: var(--text-muted);
    font-family: ui-monospace, monospace; border-radius: 3px;
    transition: background 150ms ease, color 150ms ease;
  }
  .tbl li.col-active { background: rgba(var(--brand-rgb), 0.16); color: var(--text); font-weight: 600; }
  .cname { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .badge {
    display: inline-flex; align-items: center; gap: 2px;
    font-size: 0.6rem; padding: 0 3px; border-radius: 3px; white-space: nowrap;
  }
  .badge.pk { color: var(--warning); background: color-mix(in srgb, var(--warning) 16%, transparent); }
  .badge.fk { color: var(--text-muted); background: var(--surface); }

  /* Work area */
  .work { display: grid; grid-template-columns: 220px 1fr; gap: 1rem; margin-top: 1rem; }
  @media (max-width: 640px) {
    .work { grid-template-columns: 1fr; }
    .run { min-height: 44px; }
    .editor { font-size: 16px; }
  }

  .examples h3 { display: inline-flex; align-items: center; gap: 0.4rem; margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); }
  .examples ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
  .ex {
    width: 100%; text-align: left; cursor: pointer;
    display: flex; flex-direction: column; gap: 2px;
    padding: 0.5rem 0.6rem; border: 1px solid var(--border);
    border-radius: var(--radius); background: var(--surface-elevated);
    transition: border-color 150ms ease, background 150ms ease;
  }
  .ex:hover, .ex.active { border-color: rgba(var(--brand-rgb), 0.5); background: rgba(var(--brand-rgb), 0.06); }
  .ex:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }
  .ex-title { font-size: 0.82rem; font-weight: 600; color: var(--text); }
  .ex-desc { font-size: 0.74rem; color: var(--text-muted); line-height: 1.35; }

  .console { display: flex; flex-direction: column; gap: 0.6rem; min-width: 0; }
  .editor {
    width: 100%; resize: vertical; min-height: 120px;
    padding: 0.6rem 0.75rem; border: 1px solid var(--border);
    border-radius: var(--radius); background: var(--surface);
    color: var(--text); font-family: ui-monospace, monospace; font-size: 0.82rem; line-height: 1.5;
  }
  .editor:focus { outline: none; border-color: rgba(var(--brand-rgb), 0.5); box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.12); }
  .console-bar { display: flex; align-items: center; gap: 0.75rem; }
  .run {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.45rem 0.9rem; border: none; border-radius: var(--radius);
    background: var(--brand); color: var(--primary-foreground);
    font-family: var(--font-family); font-size: 0.85rem; font-weight: 600; cursor: pointer;
  }
  .run:disabled { opacity: 0.6; cursor: not-allowed; }
  .run:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.3); }
  .meta { font-size: 0.78rem; color: var(--text-muted); }
  .err { margin: 0; padding: 0.6rem 0.75rem; font-size: 0.82rem; color: var(--danger); background: color-mix(in srgb, var(--danger) 8%, var(--surface)); border-radius: var(--radius); white-space: pre-wrap; }
  .empty { margin: 0; font-size: 0.85rem; color: var(--text-muted); }

  .result-scroll { overflow: auto; max-height: 320px; border: 1px solid var(--border); border-radius: var(--radius); }
  table { border-collapse: collapse; width: 100%; font-size: 0.8rem; }
  th, td { text-align: left; padding: 5px 9px; border-bottom: 1px solid var(--border); white-space: nowrap; }
  th { position: sticky; top: 0; background: var(--surface); color: var(--text); font-weight: 600; z-index: 1; }
  td { color: var(--text); font-family: ui-monospace, monospace; max-width: 360px; overflow: hidden; text-overflow: ellipsis; }
  td.null { color: var(--text-muted); font-style: italic; }
  tbody tr:hover { background: var(--surface); }
</style>

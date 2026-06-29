<script lang="ts">
  import {
    CircleCheck,
    TriangleAlert,
    OctagonAlert,
    Info,
    ChevronRight,
    Braces,
    FileText,
    Globe,
    Sheet,
    Printer,
    Copy,
  } from "lucide-svelte";
  import type { AuditReport } from "./types";
  import { downloadReport } from "./report";
  import { calculateStatistics, filterBySeverity } from "./classifier";
  import ErrorDetails from "./ErrorDetails.svelte";

  interface Props {
    report: AuditReport;
  }
  let { report }: Props = $props();

  let selectedSeverity = $state<"BLOQUANT" | "MAJEUR" | "MINEUR" | "ALL">("ALL");
  let expandedRowIndex = $state<number | null>(null);
  let showStats = $state(true);
  let showUnmatched = $state(false);

  const filteredResults = $derived(
    selectedSeverity === "ALL"
      ? report.results
      : report.results.filter((r) => r.errors.some((e) => e.severity === selectedSeverity)),
  );
  const stats = $derived(calculateStatistics(report));

  const status = $derived(
    report.summary.bloquants > 0 || report.summary.unmatched > 0
      ? "fail"
      : report.summary.majeurs > 0
        ? "warning"
        : "pass",
  );

  function toggleRow(index: number) {
    expandedRowIndex = expandedRowIndex === index ? null : index;
  }

  function printReport() {
    const original = expandedRowIndex;
    expandedRowIndex = -1; // expand all
    setTimeout(() => {
      window.print();
      expandedRowIndex = original;
    }, 100);
  }

  const exporters = [
    { label: "JSON", icon: Braces, run: () => downloadReport(report, "json") },
    { label: "Markdown", icon: FileText, run: () => downloadReport(report, "markdown") },
    { label: "HTML", icon: Globe, run: () => downloadReport(report, "html") },
    { label: "CSV", icon: Sheet, run: () => downloadReport(report, "csv") },
  ];
</script>

<div class="audit-results">
  <!-- Status banner -->
  <div class="banner {status}">
    <span class="banner-icon">
      {#if status === "fail"}<OctagonAlert size={18} strokeWidth={1.9} />
      {:else if status === "warning"}<TriangleAlert size={18} strokeWidth={1.9} />
      {:else}<CircleCheck size={18} strokeWidth={1.9} />{/if}
    </span>
    <span class="banner-text">
      {#if report.summary.unmatched > 0}{report.summary.unmatched} unmatched question(s) — count/order mismatch
      {:else if report.summary.bloquants > 0}Critical issues found
      {:else if report.summary.majeurs > 0}Major issues found
      {:else}All checks passed{/if}
    </span>
    <span class="banner-time">{new Date(report.timestamp).toLocaleString()}</span>
  </div>

  <!-- Summary -->
  <section class="surface">
    <button class="section-toggle" onclick={() => (showStats = !showStats)} aria-expanded={showStats}>
      <span class="chev" class:open={showStats}><ChevronRight size={15} strokeWidth={2} /></span>
      Summary
    </button>
    {#if showStats}
      <div class="stat-grid">
        <div class="stat"><span class="stat-label">Total</span><span class="stat-value">{report.summary.total}</span></div>
        <div class="stat"><span class="stat-label">Matched</span><span class="stat-value">{report.summary.matched}</span></div>
        <div class="stat"><span class="stat-label">Unmatched</span><span class="stat-value danger">{report.summary.unmatched}</span></div>
        <div class="stat"><span class="stat-label sev-c">Critical</span><span class="stat-value sev-c">{report.summary.bloquants}</span></div>
        <div class="stat"><span class="stat-label sev-m">Major</span><span class="stat-value sev-m">{report.summary.majeurs}</span></div>
        <div class="stat"><span class="stat-label sev-n">Minor</span><span class="stat-value sev-n">{report.summary.mineurs}</span></div>
        <div class="stat"><span class="stat-label">Match rate</span><span class="stat-value">{(stats.matchRate * 100).toFixed(1)}%</span></div>
        <div class="stat"><span class="stat-label">Avg issues/q</span><span class="stat-value">{stats.averageIssuesPerQuestion.toFixed(2)}</span></div>
      </div>

      {#if stats.topErrorTypes.length > 0}
        <div class="top-errors">
          <h4>Top error types</h4>
          {#each stats.topErrorTypes as error (error.type)}
            <div class="error-type"><span>{error.type}</span><span class="count">{error.count}</span></div>
          {/each}
        </div>
      {/if}
    {/if}
  </section>

  <!-- Export -->
  <section class="surface export">
    <h3>Export report</h3>
    <div class="btn-row">
      {#each exporters as ex (ex.label)}
        {@const Icon = ex.icon}
        <button class="chip-btn" onclick={ex.run}><Icon size={15} strokeWidth={1.75} /> {ex.label}</button>
      {/each}
      <button class="chip-btn" onclick={printReport}><Printer size={15} strokeWidth={1.75} /> Print</button>
    </div>
  </section>

  <!-- Results -->
  <section class="surface">
    <div class="filter-bar" role="group" aria-label="Filter by severity">
      <button class="filter-btn" class:active={selectedSeverity === "ALL"} onclick={() => (selectedSeverity = "ALL")}>
        All ({report.results.length})
      </button>
      <button class="filter-btn sev-c" class:active={selectedSeverity === "BLOQUANT"} onclick={() => (selectedSeverity = "BLOQUANT")}>
        Critical ({filterBySeverity(report.results, "BLOQUANT").length})
      </button>
      <button class="filter-btn sev-m" class:active={selectedSeverity === "MAJEUR"} onclick={() => (selectedSeverity = "MAJEUR")}>
        Major ({filterBySeverity(report.results, "MAJEUR").length})
      </button>
      <button class="filter-btn sev-n" class:active={selectedSeverity === "MINEUR"} onclick={() => (selectedSeverity = "MINEUR")}>
        Minor ({filterBySeverity(report.results, "MINEUR").length})
      </button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="w-ex" aria-label="Expand"></th>
            <th>Question</th>
            <th class="w-score">Match</th>
            <th class="w-issues">Issues</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredResults as result, idx (idx)}
            <tr class="row" class:has-errors={result.errors.length > 0}>
              <td class="ex-cell">
                <button class="ex-btn" class:open={expandedRowIndex === idx} onclick={() => toggleRow(idx)} aria-label="Toggle details">
                  <ChevronRight size={15} strokeWidth={2} />
                </button>
              </td>
              <td>
                <div class="q-title">{result.pair.qti.title || result.pair.qti.prompt.substring(0, 80)}</div>
                <div class="q-meta">Row {result.pair.excel.metadata.excelRow}</div>
              </td>
              <td class="center">
                <span class="score {result.pair.score >= 0.95 ? 'excellent' : result.pair.score >= 0.85 ? 'good' : result.pair.score >= 0.7 ? 'fair' : 'poor'}">
                  {(result.pair.score * 100).toFixed(0)}%
                </span>
              </td>
              <td class="center">
                {#if result.errors.length === 0}
                  <span class="ok"><CircleCheck size={14} strokeWidth={2} /> OK</span>
                {:else}
                  <div class="issue-badges">
                    {#if result.errors.some((e) => e.severity === "BLOQUANT")}
                      <span class="badge sev-c">{result.errors.filter((e) => e.severity === "BLOQUANT").length} critical</span>
                    {/if}
                    {#if result.errors.some((e) => e.severity === "MAJEUR")}
                      <span class="badge sev-m">{result.errors.filter((e) => e.severity === "MAJEUR").length} major</span>
                    {/if}
                    {#if result.errors.some((e) => e.severity === "MINEUR")}
                      <span class="badge sev-n">{result.errors.filter((e) => e.severity === "MINEUR").length} minor</span>
                    {/if}
                  </div>
                {/if}
              </td>
            </tr>
            {#if expandedRowIndex === idx || expandedRowIndex === -1}
              <tr class="detail-row">
                <td colspan="4"><ErrorDetails pair={result.pair} errors={result.errors} /></td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
      {#if filteredResults.length === 0}
        <p class="empty">No results for this severity.</p>
      {/if}
    </div>
  </section>

  <!-- Unmatched -->
  {#if report.unmatched.excel.length > 0 || report.unmatched.qti.length > 0}
    <section class="surface">
      <button class="section-toggle" onclick={() => (showUnmatched = !showUnmatched)} aria-expanded={showUnmatched}>
        <span class="chev" class:open={showUnmatched}><ChevronRight size={15} strokeWidth={2} /></span>
        Unmatched items ({report.unmatched.excel.length + report.unmatched.qti.length})
        {#if report.summary.potentialCopyPasteErrors > 0}
          <span class="warn-tag"><Copy size={12} strokeWidth={2} /> {report.summary.potentialCopyPasteErrors} possible copy-paste</span>
        {/if}
        {#if report.summary.duplicateTitles > 0}
          <span class="warn-tag">{report.summary.duplicateTitles} duplicate titles</span>
        {/if}
      </button>

      {#if showUnmatched}
        <div class="unmatched-grid">
          {#each [{ key: "excel", label: "Excel questions not matched", items: report.unmatched.excel }, { key: "qti", label: "QTI questions not matched", items: report.unmatched.qti }] as group (group.key)}
            {#if group.items.length > 0}
              <div class="unmatched-list">
                <h4>{group.label} ({group.items.length})</h4>
                {#each group.items.slice(0, 10) as item (item.question.metadata?.excelRow ?? item.question.title ?? item.question.prompt)}
                  <div class="unmatched-item">
                    <div class="ui-title">
                      {item.question.metadata?.excelRow ? `Row ${item.question.metadata.excelRow}: ` : (item.question.title ? `${item.question.title}: ` : "")}{item.question.prompt.substring(0, 90)}…
                    </div>
                    {#if item.closeMatches.length > 0}
                      {#each item.closeMatches as match, mi (mi)}
                        <div class="close-match" class:cp={match.isCopyPasteError}>
                          <div class="cm-head">
                            <span class="cm-score">{(match.score * 100).toFixed(1)}%</span>
                            {#if match.isCopyPasteError}<span class="cp-tag"><Copy size={11} strokeWidth={2} /> copy-paste</span>{/if}
                          </div>
                          <div class="cm-prompt">{match.question.prompt.substring(0, 120)}…</div>
                          <div class="bars">
                            {#each [{ l: "Prompt", v: match.scoring.promptScore }, { l: "Answers", v: match.scoring.answerScore }, { l: "Title", v: match.scoring.titleScore }] as b (b.l)}
                              <div class="bar-row">
                                <span class="bar-label">{b.l}</span>
                                <span class="bar"><span class="bar-fill" style="width:{b.v * 100}%"></span></span>
                                <span class="bar-val">{(b.v * 100).toFixed(0)}%</span>
                              </div>
                            {/each}
                          </div>
                          {#if match.copyPasteReason}
                            <div class="cp-hint"><Info size={12} strokeWidth={2} /> {match.copyPasteReason}</div>
                          {/if}
                        </div>
                      {/each}
                    {:else}
                      <div class="no-match">No close matches found</div>
                    {/if}
                  </div>
                {/each}
                {#if group.items.length > 10}
                  <p class="more">… and {group.items.length - 10} more not shown</p>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .audit-results { display: flex; flex-direction: column; gap: 1rem; max-width: 1100px; }

  /* Severity helpers */
  .sev-c { color: var(--severity-critical); }
  .sev-m { color: var(--severity-major); }
  .sev-n { color: var(--severity-minor); }

  .surface {
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 1rem 1.1rem;
  }

  /* Banner */
  .banner {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.8rem 1rem; border-radius: var(--radius-lg);
    border: 1px solid var(--border); font-weight: 600;
  }
  .banner-icon { display: inline-flex; }
  .banner-text { font-size: 0.95rem; }
  .banner-time { margin-left: auto; font-size: 0.76rem; font-weight: 400; color: var(--text-muted); }
  .banner.fail { color: var(--danger); border-color: color-mix(in srgb, var(--danger) 40%, var(--border)); background: color-mix(in srgb, var(--danger) 7%, var(--surface-elevated)); }
  .banner.warning { color: var(--warning); border-color: color-mix(in srgb, var(--warning) 40%, var(--border)); background: color-mix(in srgb, var(--warning) 8%, var(--surface-elevated)); }
  .banner.pass { color: var(--success); border-color: color-mix(in srgb, var(--success) 40%, var(--border)); background: color-mix(in srgb, var(--success) 8%, var(--surface-elevated)); }

  /* Section toggle */
  .section-toggle {
    display: inline-flex; align-items: center; gap: 0.45rem;
    background: none; border: none; cursor: pointer; padding: 0;
    color: var(--text); font-family: var(--font-family); font-size: 0.9rem; font-weight: 600;
  }
  .section-toggle:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); border-radius: var(--radius); }
  .chev { display: inline-flex; color: var(--text-muted); transition: transform 150ms ease; }
  .chev.open { transform: rotate(90deg); }
  .warn-tag { display: inline-flex; align-items: center; gap: 0.25rem; margin-left: 0.6rem; font-size: 0.74rem; font-weight: 600; color: var(--warning); }

  /* Stats */
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.6rem; margin-top: 0.85rem; }
  .stat { display: flex; flex-direction: column; gap: 4px; padding: 0.7rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
  .stat-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); font-weight: 600; }
  .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text); }
  .stat-value.danger { color: var(--danger); }

  .top-errors { margin-top: 0.85rem; padding-top: 0.85rem; border-top: 1px solid var(--border); }
  .top-errors h4 { margin: 0 0 0.5rem; font-size: 0.8rem; color: var(--text); }
  .error-type { display: flex; justify-content: space-between; padding: 0.35rem 0; font-size: 0.85rem; color: var(--text); border-bottom: 1px solid var(--border); }
  .error-type:last-child { border-bottom: none; }
  .error-type .count { font-weight: 700; color: var(--brand); }

  /* Export */
  .export h3 { margin: 0 0 0.6rem; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); }
  .btn-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .chip-btn {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.45rem 0.8rem; border: 1px solid var(--border); border-radius: var(--radius);
    background: var(--surface); color: var(--text); cursor: pointer;
    font-family: var(--font-family); font-size: 0.82rem; font-weight: 500;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
  }
  .chip-btn:hover { border-color: rgba(var(--brand-rgb), 0.5); color: var(--brand); background: rgba(var(--brand-rgb), 0.06); }
  .chip-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }

  /* Filter chips */
  .filter-bar { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.85rem; }
  .filter-btn {
    padding: 0.4rem 0.75rem; border: 1px solid var(--border); border-radius: 999px;
    background: var(--surface); color: var(--text-muted); cursor: pointer;
    font-family: var(--font-family); font-size: 0.8rem; font-weight: 600;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
  }
  .filter-btn:hover { color: var(--text); border-color: var(--border-strong); }
  .filter-btn.active { background: var(--accent); color: var(--accent-foreground); border-color: var(--accent); }
  .filter-btn.sev-c.active { background: var(--severity-critical); border-color: var(--severity-critical); color: #fff; }
  .filter-btn.sev-m.active { background: var(--severity-major); border-color: var(--severity-major); color: #fff; }
  .filter-btn.sev-n.active { background: var(--severity-minor); border-color: var(--severity-minor); color: #fff; }

  /* Table */
  .table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius); }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  th { text-align: left; padding: 0.6rem 0.75rem; background: var(--surface); color: var(--text-muted); font-weight: 600; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1px solid var(--border); position: sticky; top: 0; }
  td { padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: top; }
  .w-ex { width: 40px; }
  .w-score { width: 90px; }
  .w-issues { width: 130px; }
  .center { text-align: center; }
  .row:hover { background: var(--surface); }
  .ex-cell { text-align: center; }
  .ex-btn { display: inline-flex; background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 2px; border-radius: var(--radius); transition: transform 150ms ease, color 0.15s; }
  .ex-btn.open { transform: rotate(90deg); color: var(--brand); }
  .ex-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }
  .q-title { font-weight: 500; color: var(--text); }
  .q-meta { margin-top: 2px; font-size: 0.76rem; color: var(--text-muted); }
  .score { display: inline-block; padding: 3px 9px; border-radius: var(--radius); font-weight: 700; font-size: 0.8rem; }
  .score.excellent { background: color-mix(in srgb, var(--success) 14%, transparent); color: var(--success); }
  .score.good { background: var(--surface); color: var(--text); }
  .score.fair { background: color-mix(in srgb, var(--warning) 16%, transparent); color: var(--warning); }
  .score.poor { background: color-mix(in srgb, var(--danger) 14%, transparent); color: var(--danger); }
  .ok { display: inline-flex; align-items: center; gap: 0.3rem; color: var(--success); font-weight: 600; font-size: 0.8rem; }
  .issue-badges { display: flex; gap: 0.3rem; justify-content: center; flex-wrap: wrap; }
  .badge { padding: 2px 7px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
  .badge.sev-c { background: color-mix(in srgb, var(--severity-critical) 14%, transparent); }
  .badge.sev-m { background: color-mix(in srgb, var(--severity-major) 16%, transparent); }
  .badge.sev-n { background: color-mix(in srgb, var(--severity-minor) 18%, transparent); }
  .detail-row td { padding: 0; background: var(--surface); }
  .empty { text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.88rem; margin: 0; }

  /* Unmatched */
  .unmatched-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; margin-top: 0.85rem; }
  .unmatched-list h4 { margin: 0 0 0.6rem; font-size: 0.82rem; color: var(--text); }
  .unmatched-item { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 0.7rem; margin-bottom: 0.6rem; }
  .ui-title { font-size: 0.82rem; font-weight: 600; color: var(--text); word-break: break-word; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border); }
  .close-match { margin-top: 0.55rem; padding: 0.55rem; border-radius: var(--radius); border-left: 3px solid var(--brand); background: var(--surface-elevated); font-size: 0.8rem; }
  .close-match.cp { border-left-color: var(--warning); background: color-mix(in srgb, var(--warning) 6%, var(--surface-elevated)); }
  .cm-head { display: flex; align-items: center; gap: 0.5rem; }
  .cm-score { font-weight: 700; color: var(--brand); }
  .cp-tag { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.72rem; font-weight: 700; color: var(--warning); }
  .cm-prompt { margin: 0.4rem 0; color: var(--text-muted); font-style: italic; word-break: break-word; }
  .bars { display: flex; flex-direction: column; gap: 0.3rem; }
  .bar-row { display: grid; grid-template-columns: 58px 1fr 38px; gap: 0.5rem; align-items: center; font-size: 0.76rem; }
  .bar-label { color: var(--text-muted); }
  .bar { height: 6px; background: var(--border); border-radius: 999px; overflow: hidden; }
  .bar-fill { display: block; height: 100%; background: var(--brand); border-radius: 999px; }
  .bar-val { text-align: right; font-weight: 600; color: var(--text); }
  .cp-hint { display: flex; align-items: center; gap: 0.3rem; margin-top: 0.5rem; font-size: 0.76rem; color: var(--text-muted); }
  .no-match { margin-top: 0.5rem; font-size: 0.78rem; font-style: italic; color: var(--text-muted); }
  .more { margin: 0.3rem 0 0; font-size: 0.78rem; font-style: italic; color: var(--text-muted); }

  @media (prefers-reduced-motion: reduce) {
    .chev, .ex-btn { transition: none; }
  }

  @media print {
    .filter-bar, .export, .section-toggle { display: none !important; }
    .table-wrap { overflow: visible !important; }
    .detail-row { display: table-row !important; }
  }
</style>

<script lang="ts">
  import type { AuditReport, AuditResult } from '../audit/types';
  import { buildMarkdown, downloadReport } from '../audit/report';
  import { calculateStatistics, getCriticalQuestions, filterBySeverity } from '../audit/classifier';
  import ErrorDetails from './ErrorDetails.svelte';

  export let report: AuditReport;

  let selectedSeverity: 'BLOQUANT' | 'MAJEUR' | 'MINEUR' | 'ALL' = 'ALL';
  let expandedRowIndex: number | null = null;
  let showStats = true;
  let showUnmatched = false;

  $: filteredResults =
    selectedSeverity === 'ALL'
      ? report.results
      : report.results.filter((r) => r.errors.some((e) => e.severity === selectedSeverity));

  $: stats = calculateStatistics(report);

  function toggleRow(index: number) {
    expandedRowIndex = expandedRowIndex === index ? null : index;
  }

  function exportAsJSON() {
    downloadReport(report, 'json');
  }

  function exportAsMarkdown() {
    downloadReport(report, 'markdown');
  }

  function exportAsCSV() {
    downloadReport(report, 'csv');
  }

  function exportAsHTML() {
    downloadReport(report, 'html');
  }
</script>

<div class="results-container">
  <div class="results-header">
    <h2>📊 Audit Results</h2>
    <p class="timestamp">Generated: {new Date(report.timestamp).toLocaleString()}</p>
  </div>

  <!-- Status Banner -->
  <div class="status-banner" class:fail={report.summary.bloquants > 0} class:warning={report.summary.majeurs > 0} class:pass={report.summary.bloquants === 0 && report.summary.majeurs === 0}>
    {#if report.summary.bloquants > 0}
      <span class="status-icon">❌</span>
      <span class="status-text">CRITICAL ISSUES FOUND</span>
    {:else if report.summary.majeurs > 0}
      <span class="status-icon">⚠️</span>
      <span class="status-text">MAJOR ISSUES FOUND</span>
    {:else}
      <span class="status-icon">✅</span>
      <span class="status-text">ALL CHECKS PASSED</span>
    {/if}
  </div>

  <!-- Summary Statistics -->
  {#if showStats}
    <div class="summary-box">
      <button class="summary-toggle" on:click={() => (showStats = !showStats)}>
        ▼ Summary Statistics
      </button>

      <div class="summary-grid">
        <div class="stat-card">
          <div class="stat-label">Total Questions</div>
          <div class="stat-value">{report.summary.total}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Matched Pairs</div>
          <div class="stat-value">{report.summary.matched}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Unmatched Items</div>
          <div class="stat-value error">{report.summary.unmatched}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">🔴 Critical (Bloquant)</div>
          <div class="stat-value critical">{report.summary.bloquants}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">🟡 Major (Majeur)</div>
          <div class="stat-value warning">{report.summary.majeurs}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">🔵 Minor (Mineur)</div>
          <div class="stat-value info">{report.summary.mineurs}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Match Rate</div>
          <div class="stat-value">{(stats.matchRate * 100).toFixed(1)}%</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Avg Issues/Question</div>
          <div class="stat-value">{stats.averageIssuesPerQuestion.toFixed(2)}</div>
        </div>
      </div>

      {#if stats.topErrorTypes.length > 0}
        <div class="top-errors">
          <h4>Top Error Types</h4>
          {#each stats.topErrorTypes as error}
            <div class="error-type">
              <span class="type-name">{error.type}</span>
              <span class="type-count">{error.count}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <button class="summary-toggle" on:click={() => (showStats = !showStats)}>
      ▶ Summary Statistics
    </button>
  {/if}

  <!-- Export Buttons -->
  <div class="export-section">
    <h3>Export Report</h3>
    <div class="button-group">
      <button class="btn btn-export" on:click={exportAsJSON}>📄 JSON</button>
      <button class="btn btn-export" on:click={exportAsMarkdown}>📝 Markdown</button>
      <button class="btn btn-export" on:click={exportAsHTML}>🌐 HTML</button>
      <button class="btn btn-export" on:click={exportAsCSV}>📊 CSV</button>
    </div>
  </div>

  <!-- Results Table with Filter -->
  <div class="results-section">
    <div class="filter-bar">
      <fieldset>
        <legend>Filter by Severity:</legend>
        <div class="filter-buttons" role="group">
        <button
          class="filter-btn"
          class:active={selectedSeverity === 'ALL'}
          on:click={() => (selectedSeverity = 'ALL')}
        >
          All ({report.results.length})
        </button>
        <button
          class="filter-btn critical"
          class:active={selectedSeverity === 'BLOQUANT'}
          on:click={() => (selectedSeverity = 'BLOQUANT')}
        >
          🔴 Critical ({filterBySeverity(report.results, 'BLOQUANT').length})
        </button>
        <button
          class="filter-btn warning"
          class:active={selectedSeverity === 'MAJEUR'}
          on:click={() => (selectedSeverity = 'MAJEUR')}
        >
          🟡 Major ({filterBySeverity(report.results, 'MAJEUR').length})
        </button>
        <button
          class="filter-btn info"
          class:active={selectedSeverity === 'MINEUR'}
          on:click={() => (selectedSeverity = 'MINEUR')}
        >
          🔵 Minor ({filterBySeverity(report.results, 'MINEUR').length})
        </button>
      </div>
      </fieldset>
    </div>

    <div class="results-table">
      <table>
        <thead>
          <tr>
            <th style="width: 50px;"></th>
            <th>Question</th>
            <th style="width: 120px;">Match Score</th>
            <th style="width: 100px;">Issues</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredResults as result, idx (idx)}
            <tr class="result-row" class:has-errors={result.errors.length > 0}>
              <td class="expand-cell">
                <button
                  class="expand-btn"
                  on:click={() => toggleRow(idx)}
                  class:expanded={expandedRowIndex === idx}
                >
                  {expandedRowIndex === idx ? '▼' : '▶'}
                </button>
              </td>
              <td class="question-cell">
                <div class="question-title">
                  {result.pair.qti.title || result.pair.qti.prompt.substring(0, 80)}
                </div>
                <div class="question-meta">
                  Row {result.pair.excel.metadata.excelRow} →
                  Match: {(result.pair.score * 100).toFixed(0)}%
                </div>
              </td>
              <td class="score-cell">
                <div class="score-badge {result.pair.score >= 0.95 ? 'excellent' : result.pair.score >= 0.85 ? 'good' : result.pair.score >= 0.70 ? 'fair' : 'poor'}">
                  {(result.pair.score * 100).toFixed(0)}%
                </div>
              </td>
              <td class="issues-cell">
                {#if result.errors.length === 0}
                  <span class="badge badge-success">✅ OK</span>
                {:else}
                  <div class="issue-badges">
                    {#if result.errors.some((e) => e.severity === 'BLOQUANT')}
                      <span class="badge badge-critical">
                        {result.errors.filter((e) => e.severity === 'BLOQUANT').length} Critical
                      </span>
                    {/if}
                    {#if result.errors.some((e) => e.severity === 'MAJEUR')}
                      <span class="badge badge-warning">
                        {result.errors.filter((e) => e.severity === 'MAJEUR').length} Major
                      </span>
                    {/if}
                    {#if result.errors.some((e) => e.severity === 'MINEUR')}
                      <span class="badge badge-info">
                        {result.errors.filter((e) => e.severity === 'MINEUR').length} Minor
                      </span>
                    {/if}
                  </div>
                {/if}
              </td>
            </tr>

            <!-- Expanded Detail Row -->
            {#if expandedRowIndex === idx}
              <tr class="detail-row">
                <td colspan="4">
                  <ErrorDetails pair={result.pair} errors={result.errors} />
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>

      {#if filteredResults.length === 0}
        <div class="no-results">
          No results found for selected severity level.
        </div>
      {/if}
    </div>
  </div>

  <!-- Unmatched Section -->
  {#if report.unmatched.excel.length > 0 || report.unmatched.qti.length > 0}
    <div class="unmatched-section">
      <button class="section-toggle" on:click={() => (showUnmatched = !showUnmatched)}>
        {showUnmatched ? '▼' : '▶'} Unmatched Items ({report.unmatched.excel.length + report.unmatched.qti.length})
      </button>

      {#if showUnmatched}
        <div class="unmatched-content">
          {#if report.unmatched.excel.length > 0}
            <div class="unmatched-list">
              <h4>Excel Questions Not Matched ({report.unmatched.excel.length})</h4>
              <ul>
                {#each report.unmatched.excel.slice(0, 10) as q}
                  <li>Row {q.metadata.excelRow}: "{q.prompt.substring(0, 100)}..."</li>
                {/each}
                {#if report.unmatched.excel.length > 10}
                  <li class="more">... and {report.unmatched.excel.length - 10} more</li>
                {/if}
              </ul>
            </div>
          {/if}

          {#if report.unmatched.qti.length > 0}
            <div class="unmatched-list warn">
              <h4>⚠️ QTI Questions Not Matched ({report.unmatched.qti.length})</h4>
              <p class="help-text">
                These questions were below the matching threshold. Check if corresponding Excel rows exist:
              </p>
              <ul>
                {#each report.unmatched.qti.slice(0, 10) as q}
                  <li>
                    <strong>{q.title}</strong><br/>
                    <span class="prompt-preview">"{q.prompt.substring(0, 80)}..."</span>
                  </li>
                {/each}
                {#if report.unmatched.qti.length > 10}
                  <li class="more">... and {report.unmatched.qti.length - 10} more</li>
                {/if}
              </ul>
              <p class="debug-hint">💡 <strong>Tip:</strong> Lower the threshold slider and re-run to see if these match at a lower similarity level. If still unmatched, check if the Excel file has corresponding questions.</p>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .results-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .results-header {
    margin-bottom: 20px;
  }

  .results-header h2 {
    margin: 0 0 5px 0;
    color: #2c3e50;
  }

  .timestamp {
    margin: 0;
    color: #7f8c8d;
    font-size: 0.9em;
  }

  .status-banner {
    padding: 16px 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
    font-size: 1.1em;
  }

  .status-banner.fail {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
  }

  .status-banner.warning {
    background: #fff3cd;
    border: 1px solid #ffc107;
    color: #856404;
  }

  .status-banner.pass {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
  }

  .status-icon {
    font-size: 1.3em;
  }

  .summary-box {
    background: #f8f9fa;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .summary-toggle {
    background: none;
    border: none;
    color: #2c3e50;
    font-weight: 600;
    cursor: pointer;
    font-size: 1.05em;
    margin-bottom: 15px;
    padding: 0;
  }

  .summary-toggle:hover {
    text-decoration: underline;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
  }

  .stat-card {
    background: white;
    padding: 15px;
    border-radius: 6px;
    border: 1px solid #ddd;
    text-align: center;
  }

  .stat-label {
    font-size: 0.85em;
    color: #7f8c8d;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 1.8em;
    font-weight: 700;
    color: #2c3e50;
  }

  .stat-value.critical {
    color: #e74c3c;
  }

  .stat-value.warning {
    color: #f39c12;
  }

  .stat-value.info {
    color: #3498db;
  }

  .stat-value.error {
    color: #e67e22;
  }

  .top-errors {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #ddd;
  }

  .top-errors h4 {
    margin: 0 0 10px 0;
    color: #34495e;
  }

  .error-type {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #ecf0f1;
  }

  .error-type:last-child {
    border-bottom: none;
  }

  .type-name {
    color: #34495e;
    font-size: 0.9em;
  }

  .type-count {
    font-weight: 600;
    color: #3498db;
  }

  .export-section {
    background: #f8f9fa;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .export-section h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #34495e;
  }

  .button-group {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .btn {
    padding: 10px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }

  .btn-export {
    background: #3498db;
    color: white;
  }

  .btn-export:hover {
    background: #2980b9;
  }

  .results-section {
    background: #f8f9fa;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .filter-bar {
    margin-bottom: 20px;
  }

  .filter-bar legend {
    display: block;
    margin-bottom: 10px;
    font-weight: 500;
    color: #34495e;
  }

  .filter-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .filter-btn {
    padding: 8px 14px;
    border: 2px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9em;
  }

  .filter-btn:hover {
    border-color: #3498db;
  }

  .filter-btn.active {
    background: #3498db;
    color: white;
    border-color: #3498db;
  }

  .results-table {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    background: white;
    padding: 12px;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid #ddd;
    color: #2c3e50;
  }

  td {
    padding: 12px;
    border-bottom: 1px solid #ecf0f1;
  }

  .result-row:hover {
    background: #f5f5f5;
  }

  .expand-cell {
    text-align: center;
  }

  .expand-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1em;
    padding: 4px 8px;
  }

  .expand-btn.expanded {
    color: #3498db;
  }

  .question-cell {
    flex: 1;
  }

  .question-title {
    font-weight: 500;
    color: #2c3e50;
    font-size: 0.95em;
  }

  .question-meta {
    font-size: 0.8em;
    color: #7f8c8d;
    margin-top: 4px;
  }

  .score-cell {
    text-align: center;
  }

  .score-badge {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.9em;
  }

  .score-badge.excellent {
    background: #d4edda;
    color: #155724;
  }

  .score-badge.good {
    background: #d1ecf1;
    color: #0c5460;
  }

  .score-badge.fair {
    background: #fff3cd;
    color: #856404;
  }

  .score-badge.poor {
    background: #f8d7da;
    color: #721c24;
  }

  .issues-cell {
    text-align: center;
  }

  .issue-badges {
    display: flex;
    gap: 4px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 3px;
    font-size: 0.8em;
    font-weight: 600;
  }

  .badge-success {
    background: #d4edda;
    color: #155724;
  }

  .badge-critical {
    background: #f8d7da;
    color: #721c24;
  }

  .badge-warning {
    background: #fff3cd;
    color: #856404;
  }

  .badge-info {
    background: #d1ecf1;
    color: #0c5460;
  }

  .detail-row {
    background: white;
  }

  .detail-row td {
    padding: 0;
    border: none;
  }

  .no-results {
    text-align: center;
    padding: 40px 20px;
    color: #7f8c8d;
  }

  .unmatched-section {
    background: #f8f9fa;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
  }

  .section-toggle {
    background: none;
    border: none;
    color: #2c3e50;
    font-weight: 600;
    cursor: pointer;
    font-size: 1em;
    padding: 0;
    margin-bottom: 15px;
  }

  .section-toggle:hover {
    text-decoration: underline;
  }

  .unmatched-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
  }

  .unmatched-list {
    background: white;
    padding: 15px;
    border-radius: 6px;
  }

  .unmatched-list h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #34495e;
  }

  .unmatched-list ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .unmatched-list li {
    padding: 8px 0;
    border-bottom: 1px solid #ecf0f1;
    font-size: 0.9em;
    color: #555;
  }

  .unmatched-list li.more {
    color: #7f8c8d;
    font-style: italic;
  }

  .unmatched-list.warn {
    background: #fff9e6;
    border: 2px solid #ffc107;
    border-left: 4px solid #f39c12;
  }

  .unmatched-list.warn h4 {
    color: #b8860b;
    margin-bottom: 8px;
  }

  .help-text {
    font-size: 0.85em;
    color: #766d05;
    margin: 8px 0 12px 0;
    padding: 8px;
    background: rgba(255, 193, 7, 0.1);
    border-radius: 4px;
    font-style: italic;
  }

  .prompt-preview {
    display: block;
    font-size: 0.85em;
    color: #666;
    margin-top: 4px;
    font-style: italic;
  }

  .debug-hint {
    font-size: 0.85em;
    color: #555;
    margin-top: 12px;
    padding: 8px;
    background: #f0f8ff;
    border-left: 3px solid #3498db;
    border-radius: 3px;
  }
  :global(.dark) .export-section,
  :global(.dark) .results-section,
  :global(.dark) .unmatched-section {
    background: #34495e;
    border-color: #2c3e50;
  }

  :global(.dark) .stat-card {
    background: #2c3e50;
    border-color: #555;
  }

  :global(.dark) .stat-label {
    color: #a0a0a0;
  }

  :global(.dark) .stat-value {
    color: #ecf0f1;
  }

  :global(.dark) th {
    background: #2c3e50;
    color: #ecf0f1;
    border-bottom-color: #555;
  }

  :global(.dark) td {
    border-bottom-color: #555;
  }

  :global(.dark) .result-row:hover {
    background: #1a252f;
  }

  :global(.dark) .question-title {
    color: #ecf0f1;
  }

  :global(.dark) .unmatched-list.warn {
    background: #3d3300;
    border-color: #8b7500;
  }

  :global(.dark) .unmatched-list.warn h4 {
    color: #ffc107;
  }

  :global(.dark) .help-text {
    color: #ffcc99;
    background: rgba(255, 193, 7, 0.1);
  }

  :global(.dark) .prompt-preview {
    color: #bdc3c7;
  }

  :global(.dark) .debug-hint {
    background: rgba(52, 152, 219, 0.1);
    border-left-color: #3498db;
    color: #bdc3c7;
  }
</style>

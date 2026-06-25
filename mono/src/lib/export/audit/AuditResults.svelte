<script lang="ts">
  import type { AuditReport, AuditResult } from '../audit/types';
  import { buildMarkdown, downloadReport } from '../audit/report';
  import { calculateStatistics, getCriticalQuestions, filterBySeverity } from '../audit/classifier';
  import ErrorDetails from './ErrorDetails.svelte';

  interface Props {
    report: AuditReport;
  }

  let { report }: Props = $props();

  let selectedSeverity: 'BLOQUANT' | 'MAJEUR' | 'MINEUR' | 'ALL' = $state('ALL');
  let expandedRowIndex: number | null = $state(null);
  let showStats = $state(true);
  let showUnmatched = $state(false);

  let filteredResults =
    $derived(selectedSeverity === 'ALL'
      ? report.results
      : report.results.filter((r) => r.errors.some((e) => e.severity === selectedSeverity)));

  let stats = $derived(calculateStatistics(report));

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

  function printReport() {
    // Expand all rows before printing
    const originalIndex = expandedRowIndex;
    expandedRowIndex = -1; // Signal to expand all
    
    // Give DOM time to render all expanded rows
    setTimeout(() => {
      window.print();
      // Restore original state after print dialog closes
      expandedRowIndex = originalIndex;
    }, 100);
  }
</script>

<div class="results-container">
  <div class="results-header">
    <h2>📊 Audit Results</h2>
    <p class="timestamp">Generated: {new Date(report.timestamp).toLocaleString()}</p>
  </div>

  <!-- Status Banner -->
  <div class="status-banner" class:fail={report.summary.bloquants > 0} class:warning={report.summary.majeurs > 0 || report.summary.unmatched > 0} class:pass={report.summary.bloquants === 0 && report.summary.majeurs === 0 && report.summary.unmatched === 0}>
    {#if report.summary.bloquants > 0}
      <span class="status-icon">❌</span>
      <span class="status-text">CRITICAL ISSUES FOUND</span>
    {:else if report.summary.majeurs > 0}
      <span class="status-icon">⚠️</span>
      <span class="status-text">MAJOR ISSUES FOUND</span>
     {:else if report.summary.unmatched > 0}
      <span class="status-icon">⚠️</span>
      <span class="status-text">UNMATCHED ITEMS FOUND</span>
    {:else}
      <span class="status-icon">✅</span>
      <span class="status-text">ALL CHECKS PASSED</span>
    {/if}
  </div>

  <!-- Summary Statistics -->
  {#if showStats}
    <div class="summary-box">
      <button class="summary-toggle" onclick={() => (showStats = !showStats)}>
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
    <button class="summary-toggle" onclick={() => (showStats = !showStats)}>
      ▶ Summary Statistics
    </button>
  {/if}

  <!-- Export Buttons -->
  <div class="export-section">
    <h3>Export Report</h3>
    <div class="button-group">
      <button class="btn btn-export" onclick={exportAsJSON}>📄 JSON</button>
      <button class="btn btn-export" onclick={exportAsMarkdown}>📝 Markdown</button>
      <button class="btn btn-export" onclick={exportAsHTML}>🌐 HTML</button>
      <button class="btn btn-export" onclick={exportAsCSV}>📊 CSV</button>
      <button class="btn btn-print" onclick={printReport}>🖨️ Print (All Expanded)</button>
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
          onclick={() => (selectedSeverity = 'ALL')}
        >
          All ({report.results.length})
        </button>
        <button
          class="filter-btn critical"
          class:active={selectedSeverity === 'BLOQUANT'}
          onclick={() => (selectedSeverity = 'BLOQUANT')}
        >
          🔴 Critical ({filterBySeverity(report.results, 'BLOQUANT').length})
        </button>
        <button
          class="filter-btn warning"
          class:active={selectedSeverity === 'MAJEUR'}
          onclick={() => (selectedSeverity = 'MAJEUR')}
        >
          🟡 Major ({filterBySeverity(report.results, 'MAJEUR').length})
        </button>
        <button
          class="filter-btn info"
          class:active={selectedSeverity === 'MINEUR'}
          onclick={() => (selectedSeverity = 'MINEUR')}
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
                  onclick={() => toggleRow(idx)}
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
            {#if expandedRowIndex === idx || expandedRowIndex === -1}
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
      <button class="section-toggle" onclick={() => (showUnmatched = !showUnmatched)}>
        {showUnmatched ? '▼' : '▶'} Unmatched Items ({report.unmatched.excel.length + report.unmatched.qti.length})
        {#if report.summary.potentialCopyPasteErrors > 0}
          <span class="warning-badge">⚠️ {report.summary.potentialCopyPasteErrors} potential copy-paste errors</span>
        {/if}
        {#if report.summary.duplicateTitles > 0}
          <span class="warning-badge">🔄 {report.summary.duplicateTitles} duplicate titles</span>
        {/if}
      </button>

      {#if showUnmatched}
        <div class="unmatched-content">
          {#if report.unmatched.excel.length > 0}
            <div class="unmatched-list">
              <h4>📊 Excel Questions Not Matched ({report.unmatched.excel.length})</h4>
              <p class="help-text">These Excel questions did not match any QTI question. Check the close matches below:</p>
              <div class="unmatched-items">
                {#each report.unmatched.excel.slice(0, 10) as item}
                  <div class="unmatched-item">
                    <div class="item-header">
                      <span class="item-title">Row {item.question.metadata.excelRow}: "{item.question.prompt.substring(0, 80)}..."</span>
                    </div>

                    {#if item.closeMatches.length > 0}
                      <div class="close-matches">
                        <div class="close-matches-label">Closest matches:</div>
                        {#each item.closeMatches as match, idx}
                          <div class="close-match" class:copy-paste-error={match.isCopyPasteError}>
                            <div class="match-score-row">
                              <span class="match-index">{idx + 1}.</span>
                              <span class="match-score">{(match.score * 100).toFixed(1)}%</span>
                              {#if match.isCopyPasteError}
                                <span class="copy-paste-badge">⚠️ Possible copy-paste</span>
                              {/if}
                            </div>
                            <div class="match-content">
                              <div class="prompt-preview">"{match.question.prompt.substring(0, 120)}..."</div>
                            </div>
                            <div class="scoring-breakdown">
                              <div class="score-component">
                                <span class="score-label">Prompt:</span>
                                <div class="score-bar">
                                  <div class="score-fill" style="width: {match.scoring.promptScore * 100}%"></div>
                                </div>
                                <span class="score-value">{(match.scoring.promptScore * 100).toFixed(0)}%</span>
                              </div>
                              <div class="score-component">
                                <span class="score-label">Answers:</span>
                                <div class="score-bar">
                                  <div class="score-fill" style="width: {match.scoring.answerScore * 100}%"></div>
                                </div>
                                <span class="score-value">{(match.scoring.answerScore * 100).toFixed(0)}%</span>
                              </div>
                              <div class="score-component">
                                <span class="score-label">Title:</span>
                                <div class="score-bar">
                                  <div class="score-fill" style="width: {match.scoring.titleScore * 100}%"></div>
                                </div>
                                <span class="score-value">{(match.scoring.titleScore * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                            {#if match.copyPasteReason}
                              <div class="copy-paste-hint">
                                💡 {match.copyPasteReason}
                              </div>
                            {/if}
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <div class="no-close-matches">No close matches found</div>
                    {/if}
                  </div>
                {/each}
              </div>
              {#if report.unmatched.excel.length > 10}
                <p class="more-items">... and {report.unmatched.excel.length - 10} more Excel questions not shown</p>
              {/if}
            </div>
          {/if}

          {#if report.unmatched.qti.length > 0}
            <div class="unmatched-list warn">
              <h4>📊 QTI Questions Not Matched ({report.unmatched.qti.length})</h4>
              <p class="help-text">These QTI questions did not match any Excel question. Check the close matches below:</p>
              <div class="unmatched-items">
                {#each report.unmatched.qti.slice(0, 10) as item}
                  <div class="unmatched-item">
                    <div class="item-header">
                      <span class="item-title">{item.question.title || 'Untitled'}: "{item.question.prompt.substring(0, 80)}..."</span>
                    </div>

                    {#if item.closeMatches.length > 0}
                      <div class="close-matches">
                        <div class="close-matches-label">Closest matches:</div>
                        {#each item.closeMatches as match, idx}
                          <div class="close-match" class:copy-paste-error={match.isCopyPasteError}>
                            <div class="match-score-row">
                              <span class="match-index">{idx + 1}.</span>
                              <span class="match-score">{(match.score * 100).toFixed(1)}%</span>
                              {#if match.isCopyPasteError}
                                <span class="copy-paste-badge">⚠️ Possible copy-paste</span>
                              {/if}
                            </div>
                            <div class="match-content">
                              <div class="prompt-preview">Row {match.question.metadata.excelRow}: "{match.question.prompt.substring(0, 120)}..."</div>
                            </div>
                            <div class="scoring-breakdown">
                              <div class="score-component">
                                <span class="score-label">Prompt:</span>
                                <div class="score-bar">
                                  <div class="score-fill" style="width: {match.scoring.promptScore * 100}%"></div>
                                </div>
                                <span class="score-value">{(match.scoring.promptScore * 100).toFixed(0)}%</span>
                              </div>
                              <div class="score-component">
                                <span class="score-label">Answers:</span>
                                <div class="score-bar">
                                  <div class="score-fill" style="width: {match.scoring.answerScore * 100}%"></div>
                                </div>
                                <span class="score-value">{(match.scoring.answerScore * 100).toFixed(0)}%</span>
                              </div>
                              <div class="score-component">
                                <span class="score-label">Title:</span>
                                <div class="score-bar">
                                  <div class="score-fill" style="width: {match.scoring.titleScore * 100}%"></div>
                                </div>
                                <span class="score-value">{(match.scoring.titleScore * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                            {#if match.copyPasteReason}
                              <div class="copy-paste-hint">
                                💡 {match.copyPasteReason}
                              </div>
                            {/if}
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <div class="no-close-matches">No close matches found</div>
                    {/if}
                  </div>
                {/each}
              </div>
              {#if report.unmatched.qti.length > 10}
                <p class="more-items">... and {report.unmatched.qti.length - 10} more QTI questions not shown</p>
              {/if}
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
    padding: 20px;
  }

  .results-header {
    margin-bottom: 20px;
  }

  .results-header h2 {
    margin: 0 0 5px 0;
    color: var(--text);
  }

  .timestamp {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.9em;
  }

  .status-banner {
    padding: 16px 20px;
    border-radius: var(--radius-lg);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
    font-size: 1.1em;
  }

  .status-banner.fail {
    background: rgba(220, 38, 38, 0.1);
    border: 1px solid var(--danger);
    color: var(--danger);
  }

  .status-banner.warning {
    background: rgba(202, 138, 4, 0.1);
    border: 1px solid var(--warning);
    color: var(--warning);
  }

  .status-banner.pass {
    background: rgba(22, 163, 74, 0.1);
    border: 1px solid var(--success);
    color: var(--success);
  }

  .status-icon {
    font-size: 1.3em;
  }

  .summary-box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    margin-bottom: 20px;
  }

  .summary-toggle {
    background: none;
    border: none;
    color: var(--text);
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
    background: var(--surface-elevated);
    padding: 15px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    text-align: center;
  }

  .stat-label {
    font-size: 0.85em;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 1.8em;
    font-weight: 700;
    color: var(--text);
  }

  .stat-value.critical {
    color: var(--danger);
  }

  .stat-value.warning {
    color: var(--warning);
  }

  .stat-value.info {
    color: var(--accent);
  }

  .stat-value.error {
    color: var(--danger);
  }

  .top-errors {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid var(--border);
  }

  .top-errors h4 {
    margin: 0 0 10px 0;
    color: var(--text);
  }

  .error-type {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
  }

  .error-type:last-child {
    border-bottom: none;
  }

  .type-name {
    color: var(--text);
    font-size: 0.9em;
  }

  .type-count {
    font-weight: 600;
    color: var(--accent);
  }

  .export-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    margin-bottom: 20px;
  }

  .export-section h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: var(--text);
  }

  .button-group {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .btn {
    padding: 10px 16px;
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }

  .btn-export {
    background: var(--accent);
    color: var(--accent-foreground);
  }

  .btn-export:hover {
    filter: brightness(0.9);
  }

  .results-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
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
    color: var(--text);
  }

  .filter-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .filter-btn {
    padding: 8px 14px;
    border: 2px solid var(--border);
    background: var(--surface-elevated);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9em;
    color: var(--text);
  }

  .filter-btn:hover {
    border-color: var(--accent);
  }

  .filter-btn.active {
    background: var(--accent);
    color: var(--accent-foreground);
    border-color: var(--accent);
  }

  .results-table {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    background: var(--surface-elevated);
    padding: 12px;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid var(--border);
    color: var(--text);
  }

  td {
    padding: 12px;
    border-bottom: 1px solid var(--border);
  }

  .result-row:hover {
    background: var(--surface);
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
    color: var(--text);
  }

  .expand-btn.expanded {
    color: var(--accent);
  }

  .question-cell {
    flex: 1;
  }

  .question-title {
    font-weight: 500;
    color: var(--text);
    font-size: 0.95em;
  }

  .question-meta {
    font-size: 0.8em;
    color: var(--text-muted);
    margin-top: 4px;
  }

  .score-cell {
    text-align: center;
  }

  .score-badge {
    display: inline-block;
    padding: 6px 12px;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 0.9em;
  }

  .score-badge.excellent {
    background: rgba(22, 163, 74, 0.1);
    color: var(--success);
  }

  .score-badge.good {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text);
  }

  .score-badge.fair {
    background: rgba(202, 138, 4, 0.1);
    color: var(--warning);
  }

  .score-badge.poor {
    background: rgba(220, 38, 38, 0.1);
    color: var(--danger);
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
    background: rgba(22, 163, 74, 0.1);
    color: var(--success);
  }

  .badge-critical {
    background: rgba(220, 38, 38, 0.1);
    color: var(--danger);
  }

  .badge-warning {
    background: rgba(202, 138, 4, 0.1);
    color: var(--warning);
  }

  .badge-info {
    background: rgba(0, 0, 0, 0.05);
    color: var(--accent);
  }

  .detail-row {
    background: var(--surface-elevated);
  }

  .detail-row td {
    padding: 0;
    border: none;
  }

  .no-results {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-muted);
  }

  .unmatched-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
  }

  .section-toggle {
    background: none;
    border: none;
    color: var(--text);
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
    background: var(--surface-elevated);
    padding: 15px;
    border-radius: var(--radius);
  }

  .unmatched-list h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: var(--text);
  }

  .unmatched-list.warn {
    background: rgba(202, 138, 4, 0.1);
    border: 2px solid var(--warning);
    border-left: 4px solid var(--warning);
  }

  .unmatched-list.warn h4 {
    color: var(--warning);
    margin-bottom: 8px;
  }

  .help-text {
    font-size: 0.85em;
    color: var(--warning);
    margin: 8px 0 12px 0;
    padding: 8px;
    background: rgba(202, 138, 4, 0.05);
    border-radius: var(--radius);
    font-style: italic;
  }

  .prompt-preview {
    display: block;
    font-size: 0.85em;
    color: var(--text-muted);
    margin-top: 4px;
    font-style: italic;
  }

  /* New close matches styles */
  .warning-badge {
    display: inline-block;
    margin-left: 12px;
    padding: 4px 10px;
    background: rgba(220, 38, 38, 0.1);
    color: var(--danger);
    border-radius: 3px;
    font-size: 0.85em;
    font-weight: 600;
  }

  .unmatched-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .unmatched-item {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px;
  }

  .item-header {
    font-size: 0.9em;
    color: var(--text);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }

  .item-title {
    font-weight: 600;
    word-break: break-word;
  }

  .close-matches {
    margin-top: 12px;
  }

  .close-matches-label {
    font-size: 0.8em;
    color: var(--text-muted);
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: uppercase;
  }

  .close-match {
    background: var(--surface-elevated);
    border-left: 3px solid var(--accent);
    padding: 10px;
    margin-bottom: 8px;
    border-radius: 3px;
    font-size: 0.85em;
  }

  .close-match.copy-paste-error {
    border-left-color: var(--warning);
    background: rgba(202, 138, 4, 0.05);
  }

  .match-score-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .match-index {
    font-weight: 600;
    color: var(--text-muted);
    min-width: 20px;
  }

  .match-score {
    font-weight: 700;
    color: var(--accent);
    min-width: 50px;
  }

  .copy-paste-badge {
    display: inline-block;
    padding: 2px 8px;
    background: var(--warning);
    color: var(--warning-foreground);
    border-radius: 2px;
    font-size: 0.75em;
    font-weight: 600;
  }

  .match-content {
    margin: 6px 0 10px 20px;
  }

  .prompt-preview {
    font-size: 0.85em;
    color: var(--text);
    word-break: break-word;
    font-style: italic;
  }

  .scoring-breakdown {
    margin: 10px 20px 0 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .score-component {
    display: grid;
    grid-template-columns: 60px 1fr 40px;
    gap: 8px;
    align-items: center;
    font-size: 0.85em;
  }

  .score-label {
    color: var(--text-muted);
    font-weight: 500;
  }

  .score-bar {
    height: 16px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
  }

  .score-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--success), var(--warning));
    transition: width 0.3s ease;
  }

  .score-value {
    text-align: right;
    font-weight: 600;
    color: var(--text);
    min-width: 30px;
  }

  .copy-paste-hint {
    margin-top: 8px;
    padding: 6px 8px;
    background: rgba(202, 138, 4, 0.1);
    border-left: 2px solid var(--warning);
    border-radius: 2px;
    font-size: 0.8em;
    color: var(--text);
    margin-left: 20px;
  }

  .no-close-matches {
    padding: 10px;
    color: var(--text-muted);
    font-size: 0.85em;
    font-style: italic;
    margin-left: 20px;
  }

  .more-items {
    padding: 10px 0 0 0;
    color: var(--text-muted);
    font-size: 0.85em;
    font-style: italic;
    margin: 0;
  }

  :global(.dark) .export-section,
  :global(.dark) .results-section,
  :global(.dark) .unmatched-section {
    background: var(--surface);
    border-color: var(--border);
  }

  :global(.dark) .stat-card {
    background: var(--surface-elevated);
    border-color: var(--border);
  }

  :global(.dark) .stat-label {
    color: var(--text-muted);
  }

  :global(.dark) .stat-value {
    color: var(--text);
  }

  :global(.dark) th {
    background: var(--surface-elevated);
    color: var(--text);
    border-bottom-color: var(--border);
  }

  :global(.dark) td {
    border-bottom-color: var(--border);
  }

  :global(.dark) .result-row:hover {
    background: var(--surface);
  }

  :global(.dark) .question-title {
    color: var(--text);
  }

  :global(.dark) .unmatched-list.warn {
    background: rgba(202, 138, 4, 0.1);
    border-color: var(--warning);
  }

  :global(.dark) .unmatched-list.warn h4 {
    color: var(--warning);
  }

  :global(.dark) .help-text {
    color: var(--warning);
    background: rgba(202, 138, 4, 0.1);
  }

  :global(.dark) .prompt-preview {
    color: var(--text-muted);
  }

  /* Print Styles */
  @media print {
    thead {
      display: none !important;
    }

    tbody tr:first-child {
      page-break-before: avoid;
      border-top: 2px solid black;
    }

    .results-table {
      width: 100%;
      overflow: visible !important;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: avoid;
    }

    td {
      page-break-inside: avoid;
      white-space: normal;
      padding: 8px;
    }

    .result-row {
      page-break-inside: avoid;
    }

    .filter-bar {
      display: none !important;
    }

    .button-group {
      display: none !important;
    }

    .export-section {
      display: none !important;
    }

    .results-section {
      page-break-before: always;
      width: 100%;
      padding: 0;
      background-color: none;
      font-size: 0.9rem;
    }

    .result-row {
      page-break-before: always;
      page-break-inside: avoid;
    }

    /* Force page break before each detail row (one question per page) */
    .detail-row {
      page-break-inside: avoid;
      display: table-row !important;
    }

    .results-table tbody tr.detail-row:first-of-type {
      page-break-before: avoid;
    }

    .results-table tbody tr {
      page-break-inside: avoid;
    }

    h2, h3 {
      page-break-after: avoid;
    }

    .no-results {
      display: none !important;
    }
  }
</style>

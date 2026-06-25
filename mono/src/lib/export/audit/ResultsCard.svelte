<!-- @migration-task Error while migrating Svelte code: This type of directive is not valid on components
https://svelte.dev/e/component_invalid_directive -->
<!-- @migration-task Error while migrating Svelte code: This type of directive is not valid on components
https://svelte.dev/e/component_invalid_directive -->
<!-- @migration-task Error while migrating Svelte code: This type of directive is not valid on components
https://svelte.dev/e/component_invalid_directive -->
<script lang="ts">
  import { ChevronDown } from 'lucide-svelte';

  interface AuditIssue {
    severity: string;
    excelRow?: number;
    excelTitle?: string;
    qtiTitle?: string;
    errors: Array<{
      type: string;
      expected?: string | number;
      actual?: string | number;
      message?: string;
    }>;
    metadata?: {
      excelAnswerCount?: number;
      qtiAnswerCount?: number;
      matchingScore?: number;
    };
  }

  interface Props {
    issue: AuditIssue;
    expanded?: boolean;
  }

  let { issue, expanded = false }: Props = $props();

  let isExpanded = $state(false);

  $effect(() => {
    isExpanded = expanded;
  });

  // Determine severity color
  const severityColors: Record<string, string> = {
    BLOQUANT: '#ef4444', // red
    MAJEUR: '#f97316',   // orange
    MINEUR: '#eab308',   // yellow
  };

  const severityLabels: Record<string, string> = {
    BLOQUANT: '🚫 Critical',
    MAJEUR: '⚠️ Major',
    MINEUR: 'ℹ️ Minor',
  };

</script>

<div class="result-card" class:expanded={isExpanded} style="--severity-color: {severityColors[issue.severity] || '#6b7280'};">
  <button class="card-header" type="button" onclick={() => isExpanded = !isExpanded}>
    <div class="severity-indicator">
      <span class="severity-badge" title={issue.severity}>
        {severityLabels[issue.severity] || issue.severity}
      </span>
    </div>

    <div class="card-title">
      <div class="title-row">
        <span class="question-id">{issue.excelRow ? `Row ${issue.excelRow}` : 'N/A'}</span>
        <span class="question-name">{issue.excelTitle || issue.qtiTitle || 'Untitled'}</span>
      </div>
    </div>

    <div class="card-toggle">
      <ChevronDown size={18} class={isExpanded ? 'rotated' : ''} />
    </div>
  </button>

  {#if isExpanded}
    <div class="card-content">
      <div class="issue-list">
        {#each issue.errors as error}
          <div class="issue-item">
            <div class="issue-type">{error.type}</div>
            <div class="issue-detail">
              {#if error.expected && error.actual}
                <div class="diff-display">
                  <div class="diff-field">
                    <span class="field-label">Expected:</span>
                    <span class="field-value">{error.expected}</span>
                  </div>
                  <div class="diff-field">
                    <span class="field-label">Got:</span>
                    <span class="field-value">{error.actual}</span>
                  </div>
                </div>
              {:else}
                <p class="error-message">{error.message || 'Issue detected'}</p>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      {#if issue.metadata}
        <div class="metadata-section">
          <details class="metadata-details">
            <summary>Details</summary>
            <div class="metadata-content">
              {#if issue.metadata.excelAnswerCount}
                <div class="meta-item">
                  <span class="meta-label">Excel answers:</span>
                  <span class="meta-value">{issue.metadata.excelAnswerCount}</span>
                </div>
              {/if}
              {#if issue.metadata.qtiAnswerCount}
                <div class="meta-item">
                  <span class="meta-label">QTI answers:</span>
                  <span class="meta-value">{issue.metadata.qtiAnswerCount}</span>
                </div>
              {/if}
              {#if issue.metadata.matchingScore}
                <div class="meta-item">
                  <span class="meta-label">Match score:</span>
                  <span class="meta-value">{(issue.metadata.matchingScore * 100).toFixed(1)}%</span>
                </div>
              {/if}
            </div>
          </details>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .result-card {
    border: 1px solid var(--border);
    border-left: 4px solid var(--severity-color);
    border-radius: var(--radius-lg);
    background: var(--surface);
    transition: all 0.2s ease;
    margin-bottom: 12px;
  }

  .result-card:hover {
    background: var(--surface-elevated);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .card-header {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border: 0;
    background: transparent;
    cursor: pointer;
    user-select: none;
    text-align: left;
  }

  .card-header:hover {
    background: var(--border);
  }

  .severity-indicator {
    flex-shrink: 0;
  }

  .severity-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--severity-color);
    color: white;
    font-size: 11px;
    font-weight: 600;
    border-radius: var(--radius);
    white-space: nowrap;
  }

  .card-title {
    flex: 1;
    min-width: 0;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .question-id {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    background: var(--border);
    padding: 2px 6px;
    border-radius: var(--radius);
    flex-shrink: 0;
  }

  .question-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-toggle {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    color: var(--text-muted);
    transition: transform 0.2s ease;
  }

  .card-toggle :global(svg.rotated) {
    transform: rotate(180deg);
  }

  .card-content {
    border-top: 1px solid var(--border);
    padding: 14px;
    background: rgba(0, 0, 0, 0.02);
  }

  .issue-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 12px;
  }

  .issue-item {
    padding: 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .issue-type {
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .issue-detail {
    font-size: 13px;
    color: var(--text);
  }

  .diff-display {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .diff-field {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .field-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .field-value {
    padding: 4px 6px;
    background: var(--border);
    border-radius: var(--radius);
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: var(--text);
    word-break: break-word;
  }

  .error-message {
    margin: 0;
    padding: 0;
    color: var(--text-muted);
  }

  .metadata-section {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--border);
  }

  .metadata-details {
    cursor: pointer;
  }

  .metadata-details summary {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    padding: 4px 0;
    user-select: none;
  }

  .metadata-details summary:hover {
    color: var(--text);
  }

  .metadata-content {
    padding: 8px 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .meta-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    padding: 4px 0;
  }

  .meta-label {
    color: var(--text-muted);
  }

  .meta-value {
    font-weight: 600;
    color: var(--text);
    font-family: 'Courier New', monospace;
  }

  @media (max-width: 900px) {
    .card-header {
      padding: 12px;
      gap: 10px;
    }

    .question-name {
      font-size: 13px;
    }

    .card-content {
      padding: 12px;
    }

    .title-row {
      flex-wrap: wrap;
    }
  }
</style>

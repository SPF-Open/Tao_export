<script lang="ts">
  import type { MatchedPair, ComparisonError } from '../audit/types';

  export let pair: MatchedPair;
  export let errors: ComparisonError[];

  function formatValue(val: any): string {
    if (val === null || val === undefined) return '(empty)';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (Array.isArray(val)) return val.join(', ');
    return JSON.stringify(val);
  }

  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'BLOQUANT':
        return '#e74c3c';
      case 'MAJEUR':
        return '#f39c12';
      case 'MINEUR':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  }
</script>

<div class="error-details">
  <div class="detail-header">
    <h4>Question Details</h4>
  </div>

  <!-- Question Comparison -->
  <div class="detail-section">
    <h5>Question Information</h5>

    <div class="comparison-grid">
      <div class="comp-item">
        <div class="label">Excel Row:</div>
        <div class="value">{pair.excel.metadata.excelRow}</div>
      </div>

      <div class="comp-item">
        <div class="label">Match Score:</div>
        <div class="value">
          <span
            class="match-score"
            class:excellent={pair.score >= 0.95}
            class:good={pair.score >= 0.85 && pair.score < 0.95}
            class:fair={pair.score >= 0.70 && pair.score < 0.85}
            class:poor={pair.score < 0.70}
          >
            {(pair.score * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <div class="comp-item">
        <div class="label">QTI Type:</div>
        <div class="value">{pair.qti.type || 'Unknown'}</div>
      </div>

      <div class="comp-item">
        <div class="label">Answer Count:</div>
        <div class="value">
          <span class:mismatch={pair.excel.answers.length !== pair.qti.answers.length}>
            Excel: {pair.excel.answers.length}, QTI: {pair.qti.answers.length}
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- Question Text Comparison -->
  <div class="detail-section">
    <h5>Question Title</h5>

    <div class="text-comparison">
      <div class="comp-col">
        <div class="comp-label">Excel:</div>
        <div class="comp-text">{pair.excel.title || '(not provided)'}</div>
      </div>
      <div class="comp-col">
        <div class="comp-label">QTI:</div>
        <div class="comp-text">{pair.qti.title || '(not provided)'}</div>
      </div>
    </div>
  </div>

  <!-- Prompt Comparison -->
  <div class="detail-section">
    <h5>Question Prompt</h5>

    <div class="text-comparison">
      <div class="comp-col">
        <div class="comp-label">Excel:</div>
        <div class="comp-text">{pair.excel.prompt}</div>
      </div>
      <div class="comp-col">
        <div class="comp-label">QTI:</div>
        <div class="comp-text">{pair.qti.prompt}</div>
      </div>
    </div>
  </div>

  <!-- Answers Comparison -->
  <div class="detail-section">
    <h5>Answer Options</h5>

    <div class="answers-grid">
      {#each Array(Math.max(pair.excel.answers.length, pair.qti.answers.length)) as _, i}
        <div class="answer-item">
          <div class="answer-index">Option {i + 1}</div>

          <div class="answer-comparison">
            <div class="answer-col">
              <div class="answer-label">Excel:</div>
              <div class="answer-text">
                {#if i < pair.excel.answers.length}
                  {pair.excel.answers[i]}
                {:else}
                  <span class="missing">(no answer)</span>
                {/if}
              </div>
            </div>

            <div class="answer-col">
              <div class="answer-label">QTI:</div>
              <div class="answer-text">
                {#if i < pair.qti.answers.length}
                  {pair.qti.answers[i].text}
                  {#if pair.qti.answers[i].correct}
                    <span class="correct-marker">✓ Correct</span>
                  {/if}
                {:else}
                  <span class="missing">(no answer)</span>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Errors List -->
  {#if errors.length > 0}
    <div class="detail-section error-section">
      <h5>Issues Found: {errors.length}</h5>

      <div class="errors-list">
        {#each errors as error (error.type + (error.detail?.index || ''))}
          <div class="error-item" style="border-left-color: {getSeverityColor(error.severity)}">
            <div class="error-header">
              <span class="severity-badge" style="background-color: {getSeverityColor(error.severity)}">
                {error.severity}
              </span>
              <span class="error-type">{error.type}</span>
            </div>

            {#if error.detail}
              <div class="error-detail">
                {#if error.detail.field === 'answer_count'}
                  Expected {error.detail.excel} answers, but found {error.detail.qti} answers in QTI
                {:else if error.detail.field === 'correct_answers'}
                  Found {error.detail.qti} correct answer(s), but QCM should have exactly 1 correct answer
                {:else if error.detail.field === 'correct_position'}
                  Correct answer is at position {error.detail.qti}, but should be at position 0 (first)
                {:else if error.detail.field === 'type'}
                  Type mismatch: Excel type is "{error.detail.excel}", QTI type is "{error.detail.qti}"
                {:else if error.detail.field === 'answer'}
                  Answer {(error.detail.index ?? 0) + 1}: "{error.detail.excel}" ≠ "{error.detail.qti}"
                {:else if error.detail.field === 'prompt' || error.detail.field === 'title'}
                  {error.detail.field} mismatch
                  <div class="detail-comparison">
                    <div>Excel: "{error.detail.excel}"</div>
                    <div>QTI: "{error.detail.qti}"</div>
                  </div>
                {:else if error.detail.field === 'order'}
                  Question order mismatch at position {error.detail.index}
                {:else}
                  {JSON.stringify(error.detail)}
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .error-details {
    padding: 20px;
    background: white;
    border-radius: 6px;
  }

  .detail-header {
    margin-bottom: 20px;
    border-bottom: 2px solid #e0e0e0;
    padding-bottom: 10px;
  }

  .detail-header h4 {
    margin: 0;
    color: #2c3e50;
  }

  .detail-section {
    margin-bottom: 20px;
  }

  .detail-section h5 {
    margin: 0 0 12px 0;
    color: #34495e;
    font-size: 0.95em;
    font-weight: 600;
  }

  .comparison-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 15px;
  }

  .comp-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .comp-item .label {
    font-size: 0.8em;
    color: #7f8c8d;
    font-weight: 500;
  }

  .comp-item .value {
    font-size: 0.95em;
    color: #2c3e50;
  }

  .match-score {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 3px;
    font-weight: 600;
  }

  .match-score.excellent {
    background: #d4edda;
    color: #155724;
  }

  .match-score.good {
    background: #d1ecf1;
    color: #0c5460;
  }

  .match-score.fair {
    background: #fff3cd;
    color: #856404;
  }

  .match-score.poor {
    background: #f8d7da;
    color: #721c24;
  }

  .mismatch {
    color: #e74c3c;
    font-weight: 600;
  }

  .text-comparison {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 15px;
  }

  @media (max-width: 768px) {
    .text-comparison {
      grid-template-columns: 1fr;
    }
  }

  .comp-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .comp-label {
    font-size: 0.85em;
    color: #7f8c8d;
    font-weight: 500;
  }

  .comp-text {
    padding: 10px;
    background: #f8f9fa;
    border-left: 3px solid #3498db;
    border-radius: 3px;
    font-size: 0.9em;
    line-height: 1.4;
    color: #2c3e50;
    word-break: break-word;
  }

  .answers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
  }

  .answer-item {
    background: #f8f9fa;
    padding: 12px;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
  }

  .answer-index {
    font-size: 0.8em;
    color: #7f8c8d;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .answer-comparison {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .answer-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .answer-label {
    font-size: 0.75em;
    color: #7f8c8d;
    font-weight: 500;
  }

  .answer-text {
    font-size: 0.85em;
    padding: 6px;
    background: white;
    border-radius: 3px;
    color: #2c3e50;
    line-height: 1.3;
    word-break: break-word;
  }

  .missing {
    color: #e74c3c;
    font-style: italic;
  }

  .correct-marker {
    display: inline-block;
    margin-left: 4px;
    padding: 2px 6px;
    background: #d4edda;
    color: #155724;
    border-radius: 2px;
    font-size: 0.75em;
    font-weight: 600;
  }

  .error-section {
    background: #fff5f5;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    padding: 15px;
    margin-top: 15px;
  }

  .errors-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .error-item {
    background: white;
    padding: 12px;
    border-radius: 3px;
    border-left: 4px solid #e74c3c;
  }

  .error-header {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }

  .severity-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 3px;
    color: white;
    font-size: 0.75em;
    font-weight: 600;
  }

  .error-type {
    font-weight: 600;
    color: #2c3e50;
    font-size: 0.9em;
  }

  .error-detail {
    font-size: 0.85em;
    color: #555;
    line-height: 1.4;
  }

  .detail-comparison {
    margin-top: 8px;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.8em;
  }

  .detail-comparison div {
    margin: 4px 0;
    word-break: break-all;
  }

  :global(.dark) .error-details {
    background: #2c3e50;
  }

  :global(.dark) .detail-section {
    background: #34495e;
    border: 1px solid #555;
    border-radius: 4px;
    padding: 12px;
  }

  :global(.dark) .detail-section h5 {
    color: #bdc3c7;
  }

  :global(.dark) .comp-item .label,
  :global(.dark) .comp-label,
  :global(.dark) .answer-label {
    color: #a0a0a0;
  }

  :global(.dark) .comp-item .value,
  :global(.dark) .comp-text,
  :global(.dark) .answer-text,
  :global(.dark) .error-type {
    color: #ecf0f1;
  }

  :global(.dark) .comp-text,
  :global(.dark) .answer-text,
  :global(.dark) .text-comparison {
    background: #1a252f;
  }

  :global(.dark) .answer-item {
    background: #34495e;
    border-color: #555;
  }

  :global(.dark) .error-section {
    background: #34495e;
    border-color: #555;
  }

  :global(.dark) .error-item {
    background: #1a252f;
  }
</style>

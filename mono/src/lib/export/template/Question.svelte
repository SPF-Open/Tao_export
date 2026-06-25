<script lang="ts">
  import type { AssessmentItem } from '$lib/questions/types.js';
  import Qcm from './QCM.svelte';

  interface Props {
    item: AssessmentItem;
    show?: boolean;
    onToggleShow?: (show: boolean) => void;
  }

  let { item, show = true, onToggleShow }: Props = $props();
</script>

{#if show}
  <div
    class="question"
    style="page-break-inside: avoid !important; break-inside: avoid;"
  >
    <div class="title">
      <label class="checkbox-wrapper">
        <input
          class="hide-print"
          type="checkbox"
          checked={show}
          onchange={(e) => onToggleShow?.(e.currentTarget.checked)}
        />
      </label>
      <span class="title-text">{item.title}</span>
    </div>
    <div class="prompt">
      {@html item.content.html ?? ''}
      {#if item.type === 'text' && item.responses?.[0]?.constraints?.maxLength}
        <p class="maxChar">{item.responses[0].constraints.maxLength} caractères maximum.</p>
      {/if}
    </div>
    {#if item.type === 'single-choice' || item.type === 'multiple-choice'}
      <Qcm {item} />
    {/if}
  </div>
{:else}
  <div class="question question-hidden">
    <div class="title">
      <span class="title-text">Question masquée: {item.title || 'sans titre'}</span>
    </div>
  </div>
{/if}

<style>
  .question {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    margin: 24px 0;
    overflow: hidden;
    background: var(--surface-elevated);
    box-shadow: var(--shadow);
  }

  .title {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 7px;
    background: #111827;
    color: #ffffff;
    font-size: 15px;
    font-weight: 600;
  }

  .checkbox-wrapper {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .checkbox-wrapper input {
    width: 14px;
    height: 14px;
    accent-color: #ffffff;
    cursor: pointer;
  }

  .title-text {
    flex: 1;
  }

  .prompt {
    padding: 8px;
    line-height: 1.5;
  }

  /* Each QTI grid-row is its own full-width row that stacks vertically;
     its col-* children lay out as columns within that row. */
  .prompt :global(.grid-row) {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  .prompt :global(img) {
    max-height: calc(297mm - 100px);
    max-width: 98%;
    border-radius: var(--radius);
  }

  .prompt :global(p) {
    margin-bottom: 12px;
  }

  .prompt :global(p:last-child) {
    margin-bottom: 0;
  }

  .maxChar {
    margin-top: 12px;
    font-size: 12px;
    color: var(--text-muted);
  }

  @media print {
    div {
      break-inside: avoid;
    }

    .question-hidden {
      display: none;
    }

    .question {
      box-shadow: none;
      border: 1px solid #000;
    }
  }
</style>

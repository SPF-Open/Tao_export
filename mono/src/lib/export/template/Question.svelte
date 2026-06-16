<script lang="ts">
  import type { QuestionType } from '../helper';
  import Qcm from './QCM.svelte';
  interface Props {
    question: QuestionType;
  }

  let { question = $bindable() }: Props = $props();

  let questionDom = $state();
</script>

{#if question.show}
  <div
    class="question"
    bind:this={questionDom}
    class:hidePrint={!question.show}
    style="page-break-inside: avoid !important; break-inside: avoid;"
  >
    <div class="title">
      <label class="checkbox-wrapper">
        <input
          class="hide-print"
          type="checkbox"
          bind:checked={question.show}
        />
      </label>
      <span class="title-text">{question.title}</span>
    </div>
    <div
      class="prompt"
      class:grid-row={question.type.includes('Instruction')}
    >
      {#each question.prompt as prompt, i}
        {@html prompt.innerHTML}
        <p class="maxChar">
          {question.type == 'QO' && (question.maxLenght && question.maxLenght[i])
            ? question.maxLenght[i] + ' caractères maximum.' || ''
            : ''}
        </p>
      {/each}
    </div>
    {#if question.type === 'QCM' || question.type === 'Instruction QCM'}
      <Qcm bind:question />
    {/if}
  </div>
{:else}
  <div class="question question-hidden">
    <div class="title">
      <span class="title-text">Question masquée: {question.title || 'sans titre'}</span>
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
    background: var(--accent);
    color: var(--accent-foreground);
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
    accent-color: var(--accent-foreground);
    cursor: pointer;
  }

  .title-text {
    flex: 1;
  }

  .prompt {
    padding: 8px;
    line-height: 1.5;
  }

  .grid-row {
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

  .maxChar{
    margin-top: 12px;
    font-size: 12px;
    color: var(--text-muted);
  }

  @media print {
    div {
      break-inside: avoid;
    }

    .question-hidden{
      display: none;
    }

    .question {
      box-shadow: none;
      border: 1px solid #000;
    }
  }
</style>

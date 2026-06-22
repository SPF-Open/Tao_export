<script lang="ts">
  import {
    titleColumn,
    promptColumn,
    correctColumn,
    competencyColumn,
    indicatorColumn,
    competencyDescrColumn,
    masteryDescrColumn,
    TemplateColumn,
    followTemplate,
    templateList,
  } from "../helper/store";

  import { Combobox } from "$lib/ui";
  import type { Writable } from "svelte/store";

  // Required columns are driven by the chosen template; only "OTHER" unlocks them.
  let lockRequired = $derived($followTemplate !== TemplateColumn.OTHER);

  const templateChoices = templateList.map((t) => ({ label: t.txt, value: t.value }));

  // Keep entries as uppercase column letters (Excel cell keys are e.g. "B7").
  function setLetter(store: Writable<string>, raw: string) {
    store.set(raw.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2));
  }
</script>

{#snippet letterField(label: string, value: string, store: Writable<string>, locked = false)}
  <label class="cell">
    <span>{label}</span>
    <input
      class="letter"
      type="text"
      maxlength="2"
      placeholder="—"
      {value}
      disabled={locked}
      oninput={(e) => setLetter(store, e.currentTarget.value)}
    />
  </label>
{/snippet}

<div class="fields">
  <Combobox choices={templateChoices} bind:value={$followTemplate} />

  <div class="required-row">
    {@render letterField("Title", $titleColumn, titleColumn, lockRequired)}
    {@render letterField("Prompt", $promptColumn, promptColumn, lockRequired)}
    {@render letterField("Answer", $correctColumn, correctColumn, lockRequired)}
  </div>

  <div class="meta-grid">
    {@render letterField("Competency", $competencyColumn, competencyColumn)}
    {@render letterField("Indicator", $indicatorColumn, indicatorColumn)}
    {@render letterField("Comp. descr.", $competencyDescrColumn, competencyDescrColumn)}
    {@render letterField("Mastery descr.", $masteryDescrColumn, masteryDescrColumn)}
  </div>
</div>

<style>
  .fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .hint {
    margin: 4px 0 0 0;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .divider {
    border-top: 1px solid var(--border);
    margin: 4px 0;
  }

  .required-row {
    display: flex;
    gap: 8px;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .cell {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .cell span {
    font-size: var(--font-size-base);
    color: var(--text-muted);
  }

  .letter {
    width: 100%;
    box-sizing: border-box;
    padding: 6px 8px;
    text-align: center;
    text-transform: uppercase;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background-color: var(--surface);
    color: var(--text);
    font-family: var(--font-family);
    font-size: var(--font-size-base);
    transition: border-color 200ms ease, box-shadow 200ms ease;
  }

  .letter::placeholder {
    color: var(--text-muted);
    text-transform: none;
  }

  .letter:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
  }

  .letter:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  :global(.dark) .letter:focus {
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
  }
</style>

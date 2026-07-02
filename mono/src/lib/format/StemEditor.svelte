<script lang="ts">
  import DOMPurify from "dompurify";
  import { formatStemText } from "./stemFormat";

  interface Props {
    value: string;
    oninput?: (text: string) => void;
    disabled?: boolean;
    /** Preview of the question's own prompt after bold is applied on export, if it's a separate field from the stem. */
    promptPreviewHtml?: string | null;
  }

  let { value, oninput, disabled = false, promptPreviewHtml = null }: Props = $props();

  const previewHtml = $derived(DOMPurify.sanitize(formatStemText(value)));
  const promptHtml = $derived(promptPreviewHtml ? DOMPurify.sanitize(promptPreviewHtml) : null);

  function handleInput(event: Event) {
    oninput?.((event.target as HTMLTextAreaElement).value);
  }
</script>

{#if disabled}
  <div class="stem-disabled">
    <p>
      This question has no recognizable stem — probably an instruction page
      or an unsupported layout.
    </p>
  </div>
{:else}
  <div class="stem-editor">
    <div class="pane">
      <span class="pane-label">Edit</span>
      <p class="pane-hint">
        Lines starting with "•" or "-" become a bulleted list. Other line
        breaks become line breaks.
      </p>
      <textarea class="editor" {value} oninput={handleInput} rows="14"></textarea>
    </div>
    <div class="pane">
      <span class="pane-label">Preview</span>
      <div class="preview">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html previewHtml}
        {#if promptHtml}
          <div class="prompt-preview">
            <span class="prompt-preview-label">Question prompt — bolded on export</span>
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            <div class="prompt-preview-body">{@html promptHtml}</div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .stem-editor {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .pane {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .pane-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .pane-hint {
    margin: 0 0 2px;
    font-size: 0.78rem;
    line-height: 1.45;
    color: var(--text-muted);
  }

  .editor {
    width: 100%;
    min-height: 260px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background-color: var(--surface);
    color: var(--text);
    font-family: var(--font-family);
    font-size: var(--font-size-base);
    line-height: 1.6;
    resize: vertical;
    transition: border-color 200ms ease, box-shadow 200ms ease;
  }

  .editor:focus {
    outline: none;
    border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  .preview {
    min-height: 260px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background-color: var(--surface-elevated);
    color: var(--text);
    font-size: var(--font-size-base);
    line-height: 1.6;
    overflow-y: auto;
  }

  .preview :global(ul) {
    margin: 0 0 0.6rem;
    padding-left: 1.35rem;
  }

  .preview :global(li) {
    margin-bottom: 0.25rem;
  }

  .prompt-preview {
    margin-top: 0.85rem;
    padding-top: 0.85rem;
    border-top: 1px dashed var(--border);
  }

  .prompt-preview-label {
    display: block;
    margin-bottom: 0.35rem;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .prompt-preview-body :global(strong) {
    color: var(--text);
    font-weight: 650;
  }

  .stem-disabled {
    padding: 1.25rem;
    border: 1px dashed var(--border);
    border-radius: var(--radius-lg);
    color: var(--text-muted);
    font-size: 0.9rem;
  }

  .stem-disabled p {
    margin: 0;
  }

  @media (max-width: 900px) {
    .stem-editor {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .editor {
      transition: none;
    }
  }
</style>

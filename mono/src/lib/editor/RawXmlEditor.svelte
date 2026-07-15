<script lang="ts">
  import { AlertTriangle } from "lucide-svelte";
  import { xmlParseError } from "./xmlValidity";

  interface Props {
    value: string;
    label: string;
    oninput?: (text: string) => void;
  }

  let { value, label, oninput }: Props = $props();

  const error = $derived(xmlParseError(value));

  function handleInput(event: Event) {
    oninput?.((event.target as HTMLTextAreaElement).value);
  }
</script>

<div class="raw-editor">
  <span class="pane-label">{label}</span>
  <textarea
    class="editor"
    class:invalid={error !== null}
    {value}
    oninput={handleInput}
    rows="20"
    spellcheck="false"
    aria-invalid={error !== null}
  ></textarea>
  {#if error}
    <p class="error">
      <AlertTriangle size={14} strokeWidth={1.75} />
      Invalid XML — fix this before switching back to Simple mode or exporting: {error}
    </p>
  {/if}
</div>

<style>
  .raw-editor {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .pane-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .editor {
    width: 100%;
    min-height: 420px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background-color: var(--surface);
    color: var(--text);
    font-family: "SF Mono", "Roboto Mono", ui-monospace, monospace;
    font-size: 0.82rem;
    line-height: 1.6;
    resize: vertical;
    transition: border-color 200ms ease, box-shadow 200ms ease;
  }

  .editor:focus {
    outline: none;
    border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  .editor.invalid {
    border-color: var(--danger);
  }

  .editor.invalid:focus {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 18%, transparent);
  }

  .error {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin: 0;
    padding: 8px 10px;
    border: 1px solid var(--danger);
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--danger) 8%, var(--surface));
    color: var(--danger);
    font-size: 0.82rem;
    line-height: 1.5;
  }

  .error :global(svg) {
    flex-shrink: 0;
    margin-top: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .editor {
      transition: none;
    }
  }
</style>

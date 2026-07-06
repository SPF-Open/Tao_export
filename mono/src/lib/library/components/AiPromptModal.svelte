<script lang="ts">
  import { Check, Copy, Sparkles, TerminalSquare } from "lucide-svelte";
  import { Modal } from "$lib/ui";
  import { pushError } from "$lib/ui/notifications";
  import { SCHEMA_TABLES } from "$lib/library/schemaDoc";

  interface Props {
    open?: boolean;
    /** Called when the user jumps from here to the SQL query console. */
    onOpenQueryConsole?: () => void;
  }
  let { open = $bindable(false), onOpenQueryConsole }: Props = $props();

  let question = $state("");
  let copied = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  // Start from a blank question whenever the modal is reopened.
  $effect(() => {
    if (!open) {
      question = "";
      copied = false;
      clearTimeout(copyTimer);
    }
  });

  // Markdown schema reference built from the same doc that powers the query console.
  const schemaReference = SCHEMA_TABLES.map((table) => {
    const columns = table.columns
      .map((col) => {
        let line = `- **${col.name}**: ${col.desc}`;
        if (col.pk) line += " (PRIMARY KEY)";
        if (col.ref) line += ` (references ${col.ref})`;
        return line;
      })
      .join("\n");
    return `### ${table.name}\n${table.desc}\n\nColumns:\n${columns}`;
  }).join("\n\n");

  const generatedPrompt = $derived(
    question.trim()
      ? `You are a SQL expert. Help me write a query for a SQLite database.

## Database Schema

${schemaReference}

## User Question
${question}

## Requirements
- Interpret the user's question and choose the appropriate tables and columns from the schema.
- If the question contains wildcard-looking markers such as '*' or '****', interpret them as placeholders for spacing or partial text and generate a query that matches the intended phrase, not the literal asterisks.
- Prefer case-insensitive text matching for phrases in searchable fields like prompt_text.
- Write ONLY valid, read-only SQL queries (SELECT statements only, no modifications).
- Do NOT use CREATE, UPDATE, DELETE, DROP, INSERT, or any data-modifying statements.
- Do NOT include any explanation outside the SQL query.
- Output ONLY the SQL query wrapped in a code block with triple backticks and the sql language identifier.

Please provide the SQL query now.`
      : ""
  );

  async function copyToClipboard() {
    if (!generatedPrompt) return;
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      copied = true;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copied = false), 2000);
    } catch {
      pushError("Clipboard", "Could not copy the prompt — select the text and copy it manually.");
    }
  }

  function openQueryConsole() {
    open = false;
    onOpenQueryConsole?.();
  }
</script>

<Modal bind:open size="lg">
  {#snippet title()}
    <span class="mtitle"><Sparkles size={17} strokeWidth={1.75} /> Generate SQL with AI</span>
  {/snippet}

  <p class="intro">
    Describe what you want to query. We'll generate a prompt with the database schema that you can
    paste into ChatGPT, Gemini, Claude, or any other AI assistant.
  </p>

  <div class="form">
    <label for="ai-question">Your question</label>
    <textarea
      id="ai-question"
      bind:value={question}
      placeholder="E.g., Find all questions with their correct answers for test #1"
      rows="4"
    ></textarea>
  </div>

  {#if generatedPrompt}
    <div class="prompt-section">
      <div class="prompt-header">
        <h3>Copy this prompt to your AI assistant</h3>
        <button type="button" class="copy-btn" onclick={copyToClipboard} title="Copy prompt">
          {#if copied}<Check size={14} strokeWidth={2} /> Copied!{:else}<Copy size={14} strokeWidth={1.75} /> Copy{/if}
        </button>
      </div>
      <pre class="prompt-box"><code>{generatedPrompt}</code></pre>
      <div class="hint-note">
        <p>
          This only generates the prompt — once the AI answers, paste the SQL it gives you into the
          <strong>SQL query console</strong> and run it there.
        </p>
        <button type="button" class="goto-console" onclick={openQueryConsole}>
          <TerminalSquare size={14} strokeWidth={1.75} /> Open SQL query console
        </button>
      </div>
    </div>
  {:else}
    <p class="placeholder">Your AI prompt will appear here as you type your question above.</p>
  {/if}
</Modal>

<style>
  .mtitle { display: inline-flex; align-items: center; gap: 0.5rem; }

  .intro { margin: 0 0 1rem; font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; }

  .form { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
  label { font-size: 0.85rem; font-weight: 600; color: var(--text); }
  textarea {
    width: 100%; resize: vertical; min-height: 100px; padding: 0.75rem;
    border: 1px solid var(--border); border-radius: var(--radius-lg);
    background: var(--surface); color: var(--text);
    font-family: var(--font-family); font-size: 0.9rem; line-height: 1.5;
    transition: border-color 150ms ease, box-shadow 150ms ease;
  }
  textarea:focus-visible {
    outline: none; border-color: rgba(var(--brand-rgb), 0.5);
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.12);
  }

  .prompt-section {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 1rem;
  }
  .prompt-header {
    display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
  .prompt-header h3 { margin: 0; font-size: 0.9rem; font-weight: 600; color: var(--text); }

  .copy-btn {
    display: inline-flex; align-items: center; gap: 0.4rem; flex-shrink: 0;
    padding: 0.4rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius);
    background: var(--surface-elevated); color: var(--text);
    font-family: var(--font-family); font-size: 0.8rem; font-weight: 500; cursor: pointer;
    transition: border-color 150ms ease, background 150ms ease, color 150ms ease;
  }
  .copy-btn:hover { border-color: rgba(var(--brand-rgb), 0.5); color: var(--brand); background: rgba(var(--brand-rgb), 0.06); }
  .copy-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }

  .prompt-box {
    background: var(--surface-elevated); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 1rem; margin: 0 0 0.75rem; overflow: auto; max-height: 320px;
    font-family: ui-monospace, monospace; font-size: 0.8rem; line-height: 1.5;
    color: var(--text); white-space: pre-wrap; word-break: break-word;
  }
  code { color: var(--text); }

  .hint-note {
    display: grid; gap: 0.6rem; padding: 0.75rem;
    background: rgba(var(--brand-rgb), 0.06); border: 1px solid var(--border);
    border-radius: var(--radius); font-size: 0.8rem; color: var(--text); line-height: 1.5;
  }
  .hint-note p { margin: 0; }

  .goto-console {
    justify-self: start; display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.5rem 0.85rem; border: 1px solid var(--border); border-radius: var(--radius);
    background: var(--surface-elevated); color: var(--text);
    font-family: var(--font-family); font-size: 0.82rem; font-weight: 600; cursor: pointer;
    transition: border-color 150ms ease, background 150ms ease, color 150ms ease;
  }
  .goto-console:hover { border-color: rgba(var(--brand-rgb), 0.5); color: var(--brand); background: rgba(var(--brand-rgb), 0.08); }
  .goto-console:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18); }

  .placeholder {
    margin: 0; padding: 1rem; text-align: center; font-size: 0.85rem; color: var(--text-muted);
    background: var(--surface); border: 1px dashed var(--border); border-radius: var(--radius);
  }

  @media (max-width: 640px) {
    .copy-btn, .goto-console { min-height: 44px; }
  }
</style>

<script lang="ts">
  import { Copy, Sparkles } from "lucide-svelte";
  import { createEventDispatcher } from "svelte";
  import { Modal } from "$lib/ui";
  import { SCHEMA_TABLES } from "$lib/library/schemaDoc";

  const dispatch = createEventDispatcher();
  let { open = $bindable(false) }: { open?: boolean } = $props();

  let question = $state("");
  let copied = $state(false);

  function openQueryConsole() {
    dispatch("openQueryConsole");
  }

  // Build schema reference string from SCHEMA_TABLES
  const schemaReference = $derived.by(() => {
    let ref = "## Database Schema\n\n";
    SCHEMA_TABLES.forEach((table) => {
      ref += `### ${table.name}\n${table.desc}\n\n`;
      ref += "Columns:\n";
      table.columns.forEach((col) => {
        let colDesc = `- **${col.name}**: ${col.desc}`;
        if (col.pk) colDesc += " (PRIMARY KEY)";
        if (col.ref) colDesc += ` (references ${col.ref})`;
        ref += colDesc + "\n";
      });
      ref += "\n";
    });
    return ref;
  });

  // Generate the AI prompt
  const generatedPrompt = $derived.by(() => {
    if (!question.trim()) return "";

    return `You are a SQL expert. Help me write a query for a SQLite database.

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

Please provide the SQL query now.`;
  });

  function copyToClipboard() {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    }
  }

  function reset() {
    question = "";
    copied = false;
  }
</script>

<Modal bind:open size="xl" onclose={reset}>
  {#snippet title()}
    <span class="mtitle"><Sparkles size={17} strokeWidth={1.75} /> Generate SQL with AI</span>
  {/snippet}

  <p class="intro">
    Describe what you want to query. We'll generate a prompt with the database schema that you can use with ChatGPT, Gemini, Claude, or any other AI assistant.
  </p>

  <div class="form">
    <label for="question">Your Question</label>
    <textarea
      id="question"
      bind:value={question}
      placeholder="E.g., Find all questions with their correct answers for test #1"
      rows="4"
      aria-label="Query question"
    ></textarea>
  </div>

  {#if generatedPrompt}
    <div class="prompt-section">
      <div class="prompt-header">
        <h3>Copy this prompt to your AI assistant:</h3>
        <button type="button" class="copy-btn" onclick={copyToClipboard} title="Copy prompt">
          <Copy size={14} strokeWidth={1.75} />
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre class="prompt-box"><code>{generatedPrompt}</code></pre>
      <p class="hint">
        After the AI provides the SQL, paste it into the <strong>SQL query console</strong> tab and run it there.
      </p>
      <div class="hint-note">
        <p>Note: this modal only generates the prompt for the AI. The generated SQL must be copied from your assistant and pasted into the query console to execute.</p>
        <button type="button" class="goto-console" onclick={openQueryConsole}>
          Open SQL query console
        </button>
      </div>
    </div>
  {:else if question}
    <p class="placeholder">Your AI prompt will appear here as you type your question above.</p>
  {/if}
</Modal>

<style>
  .mtitle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .intro {
    margin: 0 0 1rem;
    font-size: 0.85rem;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text);
  }

  textarea {
    width: 100%;
    resize: vertical;
    min-height: 100px;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface);
    color: var(--text);
    font-family: var(--font-family);
    font-size: 0.9rem;
    line-height: 1.5;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  textarea:focus {
    outline: none;
    border-color: rgba(var(--brand-rgb), 0.5);
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.12);
  }

  .prompt-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 1rem;
  }

  .prompt-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .prompt-header h3 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text);
  }

  .copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface-elevated);
    color: var(--text);
    font-family: var(--font-family);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }

  .copy-btn:hover {
    border-color: rgba(var(--brand-rgb), 0.5);
    background: rgba(var(--brand-rgb), 0.06);
  }

  .copy-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  .prompt-box {
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem;
    margin: 0 0 0.75rem;
    overflow-x: auto;
    max-height: 400px;
    overflow-y: auto;
    font-family: ui-monospace, monospace;
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--text);
    white-space: pre-wrap;
    word-break: break-word;
  }

  code {
    color: var(--text);
  }

  .hint {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .hint-note {
    margin: 0.5rem 0 0;
    font-size: 0.8rem;
    color: var(--text);
    line-height: 1.5;
    background: rgba(var(--brand-rgb), 0.06);
    padding: 0.75rem;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    display: grid;
    gap: 0.75rem;
  }

  .goto-console {
    align-self: start;
    padding: 0.5rem 0.85rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface-elevated);
    color: var(--text);
    font-family: var(--font-family);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }

  .goto-console:hover {
    border-color: rgba(var(--brand-rgb), 0.5);
    background: rgba(var(--brand-rgb), 0.08);
  }

  .goto-console:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  .placeholder {
    margin: 0;
    padding: 1rem;
    text-align: center;
    font-size: 0.85rem;
    color: var(--text-muted);
    background: var(--surface);
    border: 1px dashed var(--border);
    border-radius: var(--radius);
  }
</style>

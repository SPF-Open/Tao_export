<script lang="ts">
  import { Check } from "lucide-svelte";
  import { Modal } from "$lib/ui";
  import type { LibraryQuestion } from "$lib/library/types.js";
  import { sanitizeRich } from "$lib/library/sanitize";
  import { loadQuestionAssetUrls } from "$lib/library/store";

  interface Props {
    open?: boolean;
    question?: LibraryQuestion | null;
  }
  let { open = $bindable(false), question = null }: Props = $props();

  // Map of `asset:<filename>` marker → object URL for this question's images.
  let assetUrls = $state<Map<string, string>>(new Map());

  function revoke(urls: Map<string, string>) {
    for (const url of urls.values()) URL.revokeObjectURL(url);
  }

  // Load (and clean up) asset object URLs as the shown question changes.
  $effect(() => {
    const q = question;
    if (!q) return;
    let active = true;
    let local = new Map<string, string>();
    void loadQuestionAssetUrls(q.id).then((urls) => {
      if (!active) { revoke(urls); return; }
      local = urls;
      assetUrls = urls;
    });
    return () => {
      active = false;
      revoke(local);
      assetUrls = new Map();
    };
  });

  const typeLabels: Record<string, string> = {
    "single-choice": "Single choice",
    "multiple-choice": "Multiple choice",
    text: "Open text",
    instruction: "Instruction",
    matching: "Matching",
    ordering: "Ordering",
    custom: "Custom",
    unknown: "Unknown",
  };

  function clean(html: string): string {
    let out = html;
    for (const [marker, url] of assetUrls) out = out.split(marker).join(url);
    return sanitizeRich(out);
  }
</script>

<Modal bind:open size="lg">
  {#snippet title()}
    {#if question}
      <span class="title">{question.title || "Untitled question"}</span>
      <span class="badge">{typeLabels[question.type] ?? question.type}</span>
    {/if}
  {/snippet}

  {#if question}
    <div class="detail">
      <p class="test">{question.testTitle}</p>

      <section>
        <h3>Prompt</h3>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <div class="prose">{@html clean(question.promptHtml)}</div>
      </section>

      {#if question.answers.length}
        <section>
          <h3>Answers</h3>
          <ul class="answers">
            {#each question.answers as a (a.identifier + a.position)}
              <li class:correct={a.correct}>
                <span class="mark">{#if a.correct}<Check size={14} strokeWidth={2.5} />{/if}</span>
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                <span class="a-text">{@html clean(a.textHtml || a.textText)}</span>
                {#if a.score != null}<span class="score">{a.score}</span>{/if}
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if question.competencies.length}
        <section>
          <h3>Competencies</h3>
          <ul class="competencies">
            {#each question.competencies as c (c.code + c.indicator)}
              <li>
                <span class="code">{c.code}</span>
                {#if c.label}<span class="label">{c.label}</span>{/if}
                {#if c.indicator}<span class="ind">Indicator: {c.indicator}</span>{/if}
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if question.rawXml}
        <details class="raw">
          <summary>Raw QTI XML</summary>
          <pre>{question.rawXml}</pre>
        </details>
      {/if}
    </div>
  {/if}
</Modal>

<style>
  .title { font-weight: 600; }
  .badge {
    font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em;
    padding: 2px 8px; border-radius: 999px; color: var(--text-muted);
    background: var(--surface); border: 1px solid var(--border);
  }
  .detail { display: flex; flex-direction: column; gap: 1.1rem; }
  .test { margin: 0; font-size: 0.82rem; color: var(--text-muted); }
  h3 { margin: 0 0 0.4rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
  .prose { color: var(--text); line-height: 1.55; font-size: 0.92rem; }
  .prose :global(img) { max-width: 100%; height: auto; }
  .answers { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
  .answers li {
    display: flex; align-items: flex-start; gap: 0.5rem;
    padding: 0.5rem 0.7rem; border: 1px solid var(--border);
    border-radius: var(--radius); background: var(--surface);
  }
  .answers li.correct { border-color: var(--success); background: color-mix(in srgb, var(--success) 8%, var(--surface)); }
  .mark { width: 16px; color: var(--success); flex-shrink: 0; padding-top: 2px; }
  .a-text { flex: 1; font-size: 0.9rem; color: var(--text); }
  .score { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; }
  .competencies { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
  .competencies li { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: baseline; font-size: 0.85rem; }
  .code { font-family: ui-monospace, monospace; font-weight: 600; color: var(--text); }
  .label { color: var(--text); }
  .ind { color: var(--text-muted); font-size: 0.78rem; }
  .raw summary { cursor: pointer; font-size: 0.8rem; color: var(--text-muted); }
  .raw pre {
    margin: 0.5rem 0 0; padding: 0.7rem; max-height: 320px; overflow: auto;
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    font-size: 0.75rem; white-space: pre-wrap; word-break: break-word;
  }
</style>

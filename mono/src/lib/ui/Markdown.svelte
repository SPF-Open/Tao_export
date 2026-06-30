<script lang="ts">
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';

  let { source = '' }: { source?: string } = $props();

  // ssr is disabled app-wide, so this always runs in the browser where
  // DOMPurify has a DOM. The source is our own trusted markdown, but we
  // sanitise anyway as a defence-in-depth measure.
  const html = $derived(DOMPurify.sanitize(marked.parse(source, { async: false }) as string));
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
<div class="prose">
  {@html html}
</div>

<style>
  .prose {
    color: var(--text);
    font-size: 0.92rem;
    line-height: 1.65;
  }

  .prose :global(h1),
  .prose :global(h2),
  .prose :global(h3),
  .prose :global(h4) {
    color: var(--text);
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.25;
  }

  .prose :global(h1) {
    font-size: 1.5rem;
    margin: 0 0 1rem;
  }

  .prose :global(h2) {
    font-size: 1.15rem;
    margin: 1.75rem 0 0.75rem;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid var(--border);
  }

  .prose :global(h3) {
    font-size: 1rem;
    margin: 1.35rem 0 0.5rem;
  }

  .prose :global(h4) {
    font-size: 0.9rem;
    color: var(--text-muted);
    margin: 1.1rem 0 0.4rem;
  }

  .prose :global(p) {
    margin: 0 0 0.75rem;
  }

  .prose :global(a) {
    color: var(--brand);
    text-decoration: none;
    border-bottom: 1px solid rgba(var(--brand-rgb), 0.35);
  }

  .prose :global(a:hover) {
    border-bottom-color: var(--brand);
  }

  .prose :global(ul),
  .prose :global(ol) {
    margin: 0 0 0.9rem;
    padding-left: 1.35rem;
  }

  .prose :global(li) {
    margin-bottom: 0.3rem;
  }

  .prose :global(li > ul),
  .prose :global(li > ol) {
    margin: 0.3rem 0 0.3rem;
  }

  .prose :global(strong) {
    color: var(--text);
    font-weight: 600;
  }

  .prose :global(hr) {
    border: none;
    border-top: 1px solid var(--border);
    margin: 1.5rem 0;
  }

  .prose :global(blockquote) {
    margin: 0 0 0.9rem;
    padding: 0.5rem 0.9rem;
    border-left: 3px solid rgba(var(--brand-rgb), 0.5);
    background: rgba(var(--brand-rgb), 0.05);
    border-radius: 0 var(--radius) var(--radius) 0;
    color: var(--text-muted);
  }

  .prose :global(blockquote p) {
    margin: 0;
  }

  .prose :global(code) {
    color: var(--text);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.85em;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.1em 0.35em;
  }

  .prose :global(pre) {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 0.85rem 1rem;
    overflow-x: auto;
    margin: 0 0 0.9rem;
  }

  .prose :global(pre code) {
    background: none;
    border: none;
    padding: 0;
    font-size: 0.85rem;
  }

  .prose :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 1rem;
    font-size: 0.88rem;
  }

  .prose :global(th),
  .prose :global(td) {
    border: 1px solid var(--border);
    padding: 0.5rem 0.7rem;
    text-align: left;
    vertical-align: top;
  }

  .prose :global(th) {
    background: var(--surface);
    font-weight: 600;
  }

  .prose :global(img) {
    max-width: 100%;
    border-radius: var(--radius-lg);
  }
</style>

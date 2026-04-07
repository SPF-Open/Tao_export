<script lang="ts">
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  import { X } from 'lucide-svelte';

  let { onClose }: { onClose: () => void } = $props();
  let content = $state('');
  let loading = $state(true);
  let currentLang = $state('fr');
  let loadedLangs = $state<Record<string, string>>({});

  const languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'nl', name: 'Nederlands' }
  ];

  async function fetchDoc(lang: string): Promise<string> {
    try {
      const filename = lang === 'fr' ? 'documentation.md' : `documentation.${lang}.md`;
      const res = await fetch(`/${filename}`);
      if (res.ok) {
        return await res.text();
      } else if (lang !== 'fr') {
        const fallback = await fetch('/documentation.md');
        return await fallback.text();
      }
      return '# Error\nCould not load documentation';
    } catch (e) {
      return '# Error\nCould not load documentation';
    }
  }

  async function loadDoc(lang: string) {
    if (loadedLangs[lang]) {
      if (currentLang === lang) {
        content = loadedLangs[lang];
        loading = false;
      }
      return;
    }
    loading = currentLang === lang;
    const text = await fetchDoc(lang);
    loadedLangs[lang] = text;
    if (currentLang === lang) {
      content = text;
      loading = false;
    }
  }

  async function preloadDocs() {
    const langs = ['en', 'nl'];
    await Promise.all(langs.map(lang => loadDoc(lang).catch(() => {})));
  }

  onMount(() => {
    loadDoc(currentLang).then(() => {
      preloadDocs();
    });
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  });

  function setLang(lang: string) {
    currentLang = lang;
    loadDoc(lang);
  }
</script>

<div 
  class="modal-overlay" 
  onclick={onClose} 
  onkeydown={(e) => e.key === 'Escape' && onClose()}
  role="dialog" 
  aria-modal="true"
  tabindex="-1"
>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="modal-content" onclick={(e) => e.stopPropagation()} role="document">
    <div class="modal-header">
      <h2>Documentation</h2>
      <button class="close-btn" onclick={onClose} aria-label="Close">
        <X size={20} />
      </button>
    </div>
    <div class="lang-menu">
      {#each languages as lang}
        <button 
          class="lang-btn" 
          class:active={currentLang === lang.code}
          onclick={() => setLang(lang.code)}
        >
          {lang.name}
        </button>
      {/each}
    </div>
    <div class="modal-body">
      {#if loading}
        <div class="loading">Loading...</div>
      {:else}
        {@html marked.parse(content)}
      {/if}
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal-content {
    background: var(--surface-elevated);
    border-radius: var(--radius-xl);
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-xl);
    animation: fadeIn 0.2s ease;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text);
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.15s;
  }

  .close-btn:hover {
    background: var(--surface);
    color: var(--text);
  }

  .lang-menu {
    display: flex;
    gap: 0;
    padding: 0 20px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }

  .lang-btn {
    padding: 10px 16px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.15s;
  }

  .lang-btn:hover {
    color: var(--text);
  }

  .lang-btn.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }

  .modal-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }

  .loading {
    text-align: center;
    color: var(--text-muted);
    padding: 40px;
  }

  .modal-body :global(h1) {
    font-size: 24px;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--accent);
  }

  .modal-body :global(h2) {
    font-size: 18px;
    font-weight: 600;
    color: var(--text);
    margin: 24px 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }

  .modal-body :global(h3) {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
    margin: 20px 0 10px;
  }

  .modal-body :global(p) {
    margin: 0 0 12px;
    color: var(--text);
    line-height: 1.6;
  }

  .modal-body :global(ul),
  .modal-body :global(ol) {
    margin: 0 0 16px;
    padding-left: 24px;
  }

  .modal-body :global(li) {
    color: var(--text);
    margin-bottom: 6px;
    line-height: 1.5;
  }

  .modal-body :global(strong) {
    font-weight: 600;
    color: var(--text);
  }

  .modal-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }

  .modal-body :global(th),
  .modal-body :global(td) {
    padding: 10px 12px;
    border: 1px solid var(--border);
    text-align: left;
  }

  .modal-body :global(th) {
    background: var(--surface);
    font-weight: 600;
  }

  .modal-body :global(blockquote) {
    margin: 16px 0;
    padding: 12px 16px;
    border-left: 4px solid var(--accent);
    background: var(--surface);
    color: var(--text-muted);
  }

  .modal-body :global(hr) {
    border: none;
    border-top: 1px solid var(--border);
    margin: 24px 0;
  }

  .modal-body :global(code) {
    background: var(--surface);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
  }

  .modal-body :global(.info-box) {
    background: color-mix(in srgb, var(--accent) 10%, var(--surface));
    border: 1px solid var(--accent);
    border-radius: var(--radius);
    padding: 12px 16px;
    margin: 16px 0;
  }
</style>

<script lang="ts">
  import { AlignLeft, FileArchive, FileText, Download, CheckCircle2 } from "lucide-svelte";
  import { EmptyState, SidebarLayout, PageHeader, FileInput, Button } from "$lib/ui";
  import { pushError, pushNotification } from "$lib/ui/notifications";
  import { parseStemZip, buildStemZip, type StemItem } from "$lib/format/stemZip";
  import StemEditor from "$lib/format/StemEditor.svelte";

  const SITE_URL = "https://tao.lv0.eu";
  const PAGE_TITLE = "Format — TAO";
  const PAGE_DESC =
    "Auto-format every question in a TAO QTI export: bullet lists and line breaks are detected and every prompt is bolded. Preview and adjust any question before re-importing the ZIP.";

  let files = $state<File[]>([]);
  let items = $state<StemItem[]>([]);
  let selectedFilename = $state<string | null>(null);
  let edits = $state<Map<string, string>>(new Map());
  let parsing = $state(false);
  let exporting = $state(false);
  let result = $state<{ blob: Blob; stemsFormatted: number; promptsBolded: number; total: number } | null>(
    null,
  );
  let outName = $state("");

  const sourceFile = $derived(files[0] ?? null);
  const selectedItem = $derived(items.find((item) => item.filename === selectedFilename) ?? null);
  const currentText = $derived(
    selectedFilename !== null ? (edits.get(selectedFilename) ?? selectedItem?.initialText ?? "") : "",
  );

  function resetState() {
    items = [];
    selectedFilename = null;
    edits = new Map();
    result = null;
  }

  async function onFiles(selected: File[]) {
    files = selected;
    resetState();
    const file = selected[0];
    if (!file) return;

    parsing = true;
    try {
      const parsed = await parseStemZip(file);
      items = parsed.items;
      selectedFilename = items[0]?.filename ?? null;
    } catch (err) {
      pushError(
        "Could not read the ZIP",
        err instanceof Error ? err.message : "The file is not a valid TAO QTI package.",
      );
    } finally {
      parsing = false;
    }
  }

  function clearFile() {
    files = [];
    resetState();
  }

  function selectItem(filename: string) {
    selectedFilename = filename;
  }

  function handleEdit(text: string) {
    if (!selectedFilename) return;
    edits.set(selectedFilename, text);
    edits = new Map(edits);
  }

  /** Whether the user manually overrode this question's auto-detected text. */
  function isManuallyAdjusted(item: StemItem): boolean {
    const edited = edits.get(item.filename);
    return edited !== undefined && edited !== item.initialText;
  }

  /** Append "-stems" before the .zip extension. */
  function stemName(name: string): string {
    return name.replace(/(\.zip)?$/i, "") + "-stems.zip";
  }

  async function exportZip() {
    if (!sourceFile || exporting) return;
    exporting = true;
    result = null;
    try {
      const res = await buildStemZip(sourceFile, edits);
      result = res;
      outName = stemName(sourceFile.name);
      pushNotification({
        title: "Package formatted",
        message: `Formatted ${res.stemsFormatted} question stem${res.stemsFormatted === 1 ? "" : "s"}, bolded ${res.promptsBolded} prompt${res.promptsBolded === 1 ? "" : "s"} across ${res.total} question${res.total === 1 ? "" : "s"}.`,
        variant: res.stemsFormatted === 0 && res.promptsBolded === 0 ? "info" : "success",
      });
    } catch (err) {
      pushError(
        "Could not export the ZIP",
        err instanceof Error ? err.message : "Something went wrong while rebuilding the package.",
      );
    } finally {
      exporting = false;
    }
  }

  function download() {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = outName || "formatted-stems.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head>
  <title>{PAGE_TITLE}</title>
  <meta name="description" content={PAGE_DESC} />
  <link rel="canonical" href={`${SITE_URL}/format`} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="TAO" />
  <meta property="og:title" content={PAGE_TITLE} />
  <meta property="og:description" content={PAGE_DESC} />
  <meta property="og:url" content={`${SITE_URL}/format`} />
  <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={PAGE_TITLE} />
  <meta name="twitter:description" content={PAGE_DESC} />
  <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
</svelte:head>

<SidebarLayout sidebarLabel="Format options">
  {#snippet sidebar()}
    <div class="panel">
      <h2 class="panel-title">Source package</h2>
      <FileInput
        accept=".zip"
        invalidTitle="Unsupported file"
        bind:file={files}
        onfiles={onFiles}
      />

      {#if sourceFile}
        <div class="file-badge">
          <FileArchive size={15} />
          <span class="file-name" title={sourceFile.name}>{sourceFile.name}</span>
        </div>
        <button type="button" class="link-btn" onclick={clearFile}>
          Choose another file
        </button>
      {/if}

      {#if items.length > 0}
        <h2 class="panel-title question-list-title">Questions</h2>
        <ul class="question-list">
          {#each items as item (item.filename)}
            <li>
              <button
                type="button"
                class="question-row"
                class:active={item.filename === selectedFilename}
                onclick={() => selectItem(item.filename)}
              >
                <FileText size={14} />
                <span class="question-title" title={item.title}>{item.title}</span>
                {#if isManuallyAdjusted(item)}
                  <span class="dirty-dot" title="Manually adjusted"></span>
                {/if}
              </button>
            </li>
          {/each}
        </ul>

        <Button variant="primary" disabled={exporting} onclick={exportZip}>
          <Download size={16} />
          {exporting ? "Exporting…" : "Export ZIP"}
        </Button>

        {#if result}
          <Button variant="secondary" onclick={download}>
            <Download size={16} />
            Download ZIP
          </Button>
        {/if}
      {/if}
    </div>
  {/snippet}

  <main class="main">
    <PageHeader
      icon={AlignLeft}
      eyebrow="Question stem editor"
      title="Format"
      subtitle="Every question is auto-formatted on export — bullet lists, line breaks, and bold prompts. Preview and adjust any question first if needed."
    />

    {#if !sourceFile}
      <EmptyState
        icon={FileArchive}
        title="Upload a TAO QTI export"
        description="Pick the .zip you exported from TAO. Exporting auto-formats every question's stem (bullet lines and line breaks) and bolds every prompt. Pick a question here first if you want to preview or adjust its result before exporting."
      />
    {:else if parsing}
      <EmptyState icon={FileArchive} title="Reading the package…" />
    {:else if !selectedItem}
      <EmptyState
        icon={FileText}
        title="Pick a question"
        description="Select a question from the list in the side panel to edit its stem."
      />
    {:else}
      <section class="editor-card">
        <h3 class="editor-title">{selectedItem.title}</h3>
        <StemEditor
          value={currentText}
          disabled={selectedItem.region === null}
          oninput={handleEdit}
          promptPreviewHtml={selectedItem.region?.kind === "context"
            ? selectedItem.promptPreviewHtml
            : null}
        />
      </section>

      {#if result}
        <section class="result-card">
          <div class="result-head">
            <span class="result-icon"><CheckCircle2 size={20} /></span>
            <div>
              <h3 class="result-title">
                {result.stemsFormatted} stem{result.stemsFormatted === 1 ? "" : "s"} formatted,
                {result.promptsBolded} prompt{result.promptsBolded === 1 ? "" : "s"} bolded
              </h3>
              <p class="result-sub">{result.total} question{result.total === 1 ? "" : "s"} in the package</p>
            </div>
          </div>
          <p class="result-note">
            Download <code>{outName}</code> and import it back into TAO to get the
            formatted package.
          </p>
          <Button variant="primary" onclick={download}>
            <Download size={16} />
            Download {outName}
          </Button>
        </section>
      {/if}
    {/if}
  </main>
</SidebarLayout>

<style>
  .main {
    padding: 1.5rem;
    max-width: 1100px;
    margin: 0 auto;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .panel-title {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .question-list-title {
    margin-top: 4px;
  }

  .file-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    color: var(--text);
  }

  .file-name {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .link-btn {
    align-self: flex-start;
    background: none;
    border: none;
    padding: 2px;
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
    text-decoration: underline;
  }

  .link-btn:hover {
    color: var(--text);
  }

  .question-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 320px;
    overflow-y: auto;
  }

  .question-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid transparent;
    border-radius: var(--radius-lg);
    background: none;
    color: var(--text-muted);
    font-family: var(--font-family);
    font-size: 13px;
    cursor: pointer;
    text-align: left;
    transition: border-color 200ms ease, background-color 200ms ease, color 200ms ease;
  }

  .question-row:hover {
    background: var(--surface-elevated);
    color: var(--text);
  }

  .question-row.active {
    border-color: rgba(var(--brand-rgb), 0.35);
    background: rgba(var(--brand-rgb), 0.08);
    color: var(--text);
  }

  .question-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dirty-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--brand);
    flex-shrink: 0;
  }

  .editor-card,
  .result-card {
    padding: 1.25rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    background: var(--surface-elevated);
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .editor-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 650;
    color: var(--text);
  }

  .result-head {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .result-icon {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: var(--radius-lg);
    color: var(--brand);
    background: rgba(var(--brand-rgb), 0.08);
    border: 1px solid rgba(var(--brand-rgb), 0.25);
  }

  .result-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 650;
    color: var(--text);
  }

  .result-sub {
    margin: 0.2rem 0 0;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .result-note {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--text-muted);
  }

  .result-note code {
    font-family: "SF Mono", "Roboto Mono", ui-monospace, monospace;
    font-size: 0.82em;
    padding: 0.1rem 0.35rem;
    border-radius: var(--radius);
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
  }

  @media (max-width: 640px) {
    .main {
      padding: 1rem;
    }
  }
</style>

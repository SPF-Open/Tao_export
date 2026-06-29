<script lang="ts">
  import { Bold, FileArchive, Download, Wand2, CheckCircle2 } from "lucide-svelte";
  import { EmptyState, SidebarLayout, PageHeader, FileInput, Button } from "$lib/ui";
  import { pushError, pushNotification } from "$lib/ui/notifications";
  import { boldPromptZip, type BoldPromptZipResult } from "$lib/format/boldPromptZip";

  const SITE_URL = "https://tao.lv0.eu";
  const PAGE_TITLE = "Format — TAO";
  const PAGE_DESC =
    "Bold every question prompt in a TAO QTI export: upload the ZIP, get a new ZIP back, re-import it into TAO.";

  let files = $state<File[]>([]);
  let processing = $state(false);
  let result = $state<BoldPromptZipResult | null>(null);
  let outName = $state("");

  const sourceFile = $derived(files[0] ?? null);

  function onFiles(selected: File[]) {
    files = selected;
    result = null;
  }

  function clearFile() {
    files = [];
    result = null;
  }

  /** Append "-bold" before the .zip extension. */
  function boldName(name: string): string {
    return name.replace(/(\.zip)?$/i, "") + "-bold.zip";
  }

  async function run() {
    if (!sourceFile || processing) return;
    processing = true;
    result = null;
    try {
      const res = await boldPromptZip(sourceFile);
      result = res;
      outName = boldName(sourceFile.name);
      pushNotification({
        title: "Prompts formatted",
        message:
          res.changed === 0
            ? `No plain-text prompts to bold across ${res.total} question${res.total === 1 ? "" : "s"}.`
            : `Bolded ${res.changed} of ${res.total} question prompt${res.total === 1 ? "" : "s"}.`,
        variant: res.changed === 0 ? "info" : "success",
      });
    } catch (err) {
      pushError(
        "Could not process the ZIP",
        err instanceof Error ? err.message : "The file is not a valid TAO QTI package.",
      );
    } finally {
      processing = false;
    }
  }

  function download() {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = outName || "formatted-bold.zip";
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

        <Button variant="primary" disabled={processing} onclick={run}>
          <Wand2 size={16} />
          {processing ? "Formatting…" : "Bold prompts"}
        </Button>

        {#if result}
          <Button variant="secondary" onclick={download}>
            <Download size={16} />
            Download ZIP
          </Button>
          <button type="button" class="link-btn" onclick={clearFile}>
            Choose another file
          </button>
        {/if}
      {/if}
    </div>
  {/snippet}

  <main class="main">
    <PageHeader
      icon={Bold}
      eyebrow="Bold prompts"
      title="Format"
      subtitle="Wrap every plain-text question prompt of a TAO export in bold, then re-import the ZIP."
    />

    {#if !sourceFile}
      <EmptyState
        icon={FileArchive}
        title="Upload a TAO QTI export"
        description="Pick the .zip you exported from TAO. Each question's prompt is wrapped in bold and the package is rebuilt unchanged otherwise — ready to import straight back into TAO."
      />
    {:else if result}
      <section class="result-card">
        <div class="result-head">
          <span class="result-icon"><CheckCircle2 size={20} /></span>
          <div>
            <h3 class="result-title">
              {result.changed === 0
                ? "Nothing to format"
                : `${result.changed} prompt${result.changed === 1 ? "" : "s"} bolded`}
            </h3>
            <p class="result-sub">
              {result.total} question{result.total === 1 ? "" : "s"} in the package
              {#if result.changed > 0 && result.changed < result.total}
                · {result.total - result.changed} already formatted or skipped
              {/if}
            </p>
          </div>
        </div>

        <p class="result-note">
          Download <code>{outName}</code> and import it back into TAO to get the
          formatted questions automatically.
        </p>

        <Button variant="primary" onclick={download}>
          <Download size={16} />
          Download {outName}
        </Button>
      </section>
    {:else}
      <section class="result-card">
        <h3 class="result-title">Ready to format</h3>
        <p class="result-note">
          <strong>{sourceFile.name}</strong> is loaded. Press
          <strong>Bold prompts</strong> in the side panel to wrap each question
          prompt in bold and rebuild the ZIP.
        </p>
      </section>
    {/if}
  </main>
</SidebarLayout>

<style>
  .main {
    padding: 1.5rem;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
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

  .result-card {
    margin-top: 1.25rem;
    padding: 1.25rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    background: var(--surface-elevated);
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 1rem;
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

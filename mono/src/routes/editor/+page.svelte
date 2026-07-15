<script lang="ts">
  import { FileArchive, FileText, Download, CheckCircle2, FilePenLine } from "lucide-svelte";
  import { SvelteMap } from "svelte/reactivity";
  import { EmptyState, SidebarLayout, PageHeader, FileInput, Button } from "$lib/ui";
  import { pushError, pushNotification } from "$lib/ui/notifications";
  import { downloadBlob } from "$lib/utils/download";
  import { locateStemRegion, spliceStemRegion } from "$lib/format/stemRegion";
  import { formatStemText } from "$lib/format/stemFormat";
  import type { TaoTools } from "$lib/questions/types.js";
  import { parseEditorZip, buildEditorZip, type EditorPackage } from "$lib/editor/editorZip";
  import { parseEditableItem, type EditableItem } from "$lib/editor/itemFields";
  import {
    spliceCharLimit,
    spliceChoiceScore,
    spliceChoiceText,
    spliceCorrectResponse,
    spliceItemAttrs
  } from "$lib/editor/itemSplice";
  import { extractTestToolOptions } from "$lib/editor/testFields";
  import { spliceTestToolOptions } from "$lib/editor/testSplice";
  import { extractLomFields, hasMetadata, hasResource } from "$lib/editor/manifestFields";
  import { insertLomSkeleton, spliceLomField } from "$lib/editor/manifestSplice";
  import { xmlParseError } from "$lib/editor/xmlValidity";
  import ItemEditorSimple from "$lib/editor/ItemEditorSimple.svelte";
  import RawXmlEditor from "$lib/editor/RawXmlEditor.svelte";

  const SITE_URL = "https://tao.lv0.eu";
  const PAGE_TITLE = "Editor — TAO";
  const PAGE_DESC =
    "Ouvrez un paquet QTI exporté depuis TAO et modifiez le prompt, les réponses, la limite de caractères et les métadonnées de chaque question — en mode simple ou en XML brut — puis exportez un ZIP prêt à réimporter.";

  type RawTab = "item" | "test" | "manifest";

  let files = $state<File[]>([]);
  let pkg = $state<EditorPackage | null>(null);
  const texts = new SvelteMap<string, string>();
  let selectedFilename = $state<string | null>(null);
  let mode = $state<"simple" | "raw">("simple");
  let rawTab = $state<RawTab>("item");
  let parsing = $state(false);
  let exporting = $state(false);
  let result = $state<{ blob: Blob; changedFiles: number; totalItems: number } | null>(null);
  let outName = $state("");

  const sourceFile = $derived(files[0] ?? null);
  const items = $derived(pkg?.items ?? []);
  const hasTestFile = $derived(pkg?.testFilename != null);
  const hasManifestFile = $derived(pkg?.manifestFilename != null);

  const selectedItem = $derived.by<EditableItem | null>(() => {
    if (!selectedFilename) return null;
    const xml = texts.get(selectedFilename);
    return xml !== undefined ? parseEditableItem(xml, selectedFilename) : null;
  });

  const testOptions = $derived.by(() => {
    if (!pkg?.testFilename || !selectedFilename) return null;
    const xml = texts.get(pkg.testFilename);
    return xml !== undefined ? extractTestToolOptions(xml, selectedFilename) : null;
  });

  const hasResourceInManifest = $derived.by(() => {
    if (!pkg?.manifestFilename || !selectedFilename) return false;
    const xml = texts.get(pkg.manifestFilename);
    return xml !== undefined && hasResource(xml, selectedFilename);
  });

  const hasMetadataBlock = $derived.by(() => {
    if (!pkg?.manifestFilename || !selectedFilename) return false;
    const xml = texts.get(pkg.manifestFilename);
    return xml !== undefined && hasMetadata(xml, selectedFilename);
  });

  const lomFields = $derived.by(() => {
    if (!pkg?.manifestFilename || !selectedFilename) return [];
    const xml = texts.get(pkg.manifestFilename);
    return xml !== undefined ? extractLomFields(xml, selectedFilename) : [];
  });

  const activeRawFilename = $derived.by(() => {
    if (rawTab === "item") return selectedFilename;
    if (rawTab === "test") return pkg?.testFilename ?? null;
    return pkg?.manifestFilename ?? null;
  });

  const visibleRawTabs = $derived.by<RawTab[]>(() => {
    const tabs: RawTab[] = ["item"];
    if (hasTestFile) tabs.push("test");
    if (hasManifestFile) tabs.push("manifest");
    return tabs;
  });

  function resetState() {
    pkg = null;
    texts.clear();
    selectedFilename = null;
    mode = "simple";
    rawTab = "item";
    result = null;
  }

  async function onFiles(selected: File[]) {
    files = selected;
    resetState();
    const file = selected[0];
    if (!file) return;

    parsing = true;
    try {
      const parsed = await parseEditorZip(file);
      pkg = parsed;
      for (const [filename, xml] of parsed.texts) texts.set(filename, xml);
      selectedFilename = parsed.items[0]?.filename ?? null;
    } catch (err) {
      pushError(
        "Impossible de lire le ZIP",
        err instanceof Error ? err.message : "Le fichier n'est pas un paquet QTI valide."
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
    rawTab = "item";
  }

  /** Whether an item's current text differs from what the zip originally contained. */
  function isDirty(item: EditableItem): boolean {
    const original = pkg?.texts.get(item.filename);
    const current = texts.get(item.filename);
    return original !== undefined && current !== undefined && original !== current;
  }

  function updateText(filename: string | null, transform: (xml: string) => string) {
    if (!filename) return;
    const current = texts.get(filename);
    if (current === undefined) return;
    const next = transform(current);
    if (next === current) return;
    texts.set(filename, next);
  }

  function handleAttrs(attrs: { title?: string; label?: string; lang?: string }) {
    updateText(selectedFilename, (xml) => spliceItemAttrs(xml, attrs));
  }

  function handlePrompt(text: string) {
    updateText(selectedFilename, (xml) => {
      const region = locateStemRegion(xml);
      return region ? spliceStemRegion(xml, region, formatStemText(text)) : xml;
    });
  }

  function handleChoiceText(identifier: string, html: string) {
    updateText(selectedFilename, (xml) => spliceChoiceText(xml, identifier, html));
  }

  function handleCorrect(identifiers: string[]) {
    updateText(selectedFilename, (xml) => spliceCorrectResponse(xml, identifiers));
  }

  function handleChoiceScore(identifier: string, score: number) {
    updateText(selectedFilename, (xml) => spliceChoiceScore(xml, identifier, score));
  }

  function handleCharLimit(maxLength: number | null) {
    updateText(selectedFilename, (xml) => spliceCharLimit(xml, maxLength));
  }

  function handleToolsChange(tools: TaoTools, informational: boolean) {
    if (!selectedFilename) return;
    const filename = selectedFilename;
    updateText(pkg?.testFilename ?? null, (xml) => spliceTestToolOptions(xml, filename, tools, informational));
  }

  function handleLomField(index: number, value: string) {
    if (!selectedFilename) return;
    const filename = selectedFilename;
    updateText(pkg?.manifestFilename ?? null, (xml) => spliceLomField(xml, filename, index, value));
  }

  function handleAddLomMetadata() {
    if (!selectedFilename) return;
    const filename = selectedFilename;
    updateText(pkg?.manifestFilename ?? null, (xml) => insertLomSkeleton(xml, filename));
  }

  function handleRawInput(text: string) {
    updateText(activeRawFilename, () => text);
  }

  function currentRawError(): string | null {
    if (!activeRawFilename) return null;
    const xml = texts.get(activeRawFilename);
    return xml !== undefined ? xmlParseError(xml) : null;
  }

  function switchMode(next: "simple" | "raw") {
    if (next === "simple" && mode === "raw") {
      const error = currentRawError();
      if (error) {
        pushError("XML invalide", "Corrigez le XML avant de repasser en mode simple.");
        return;
      }
    }
    mode = next;
  }

  function firstInvalidEntry(): { filename: string; error: string } | null {
    for (const [filename, xml] of texts) {
      const error = xmlParseError(xml);
      if (error) return { filename, error };
    }
    return null;
  }

  /** Append "-edited" before the .zip extension. */
  function editedName(name: string): string {
    return name.replace(/(\.zip)?$/i, "") + "-edited.zip";
  }

  async function exportZip() {
    if (!sourceFile || exporting) return;

    const invalid = firstInvalidEntry();
    if (invalid) {
      pushError("XML invalide", `${invalid.filename} : ${invalid.error}`);
      return;
    }

    exporting = true;
    result = null;
    try {
      const res = await buildEditorZip(sourceFile, new Map(texts));
      result = res;
      outName = editedName(sourceFile.name);
      pushNotification({
        title: "Paquet édité",
        message: `${res.changedFiles} fichier${res.changedFiles === 1 ? "" : "s"} modifié${res.changedFiles === 1 ? "" : "s"} sur ${res.totalItems} question${res.totalItems === 1 ? "" : "s"}.`,
        variant: res.changedFiles === 0 ? "info" : "success"
      });
    } catch (err) {
      pushError(
        "Impossible d'exporter le ZIP",
        err instanceof Error ? err.message : "Une erreur est survenue lors de la reconstruction du paquet."
      );
    } finally {
      exporting = false;
    }
  }

  function download() {
    if (!result) return;
    downloadBlob(result.blob, outName || "edited.zip");
  }

  const rawTabLabel: Record<RawTab, string> = {
    item: "Question",
    test: "Options du test",
    manifest: "Manifest"
  };
</script>

<svelte:head>
  <title>{PAGE_TITLE}</title>
  <meta name="description" content={PAGE_DESC} />
  <link rel="canonical" href={`${SITE_URL}/editor`} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="TAO" />
  <meta property="og:title" content={PAGE_TITLE} />
  <meta property="og:description" content={PAGE_DESC} />
  <meta property="og:url" content={`${SITE_URL}/editor`} />
  <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={PAGE_TITLE} />
  <meta name="twitter:description" content={PAGE_DESC} />
  <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
</svelte:head>

<SidebarLayout sidebarLabel="Editor options">
  {#snippet sidebar()}
    <div class="panel">
      <h2 class="panel-title">Paquet source</h2>
      <FileInput accept=".zip" invalidTitle="Fichier non supporté" bind:file={files} onfiles={onFiles} />

      {#if sourceFile}
        <div class="file-badge">
          <FileArchive size={15} />
          <span class="file-name" title={sourceFile.name}>{sourceFile.name}</span>
        </div>
        <button type="button" class="link-btn" onclick={clearFile}> Choisir un autre fichier </button>
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
                {#if isDirty(item)}
                  <span class="dirty-dot" title="Modifiée"></span>
                {/if}
              </button>
            </li>
          {/each}
        </ul>

        <Button variant="primary" disabled={exporting} onclick={exportZip}>
          <Download size={16} />
          {exporting ? "Export…" : "Exporter le ZIP"}
        </Button>

        {#if result}
          <Button variant="secondary" onclick={download}>
            <Download size={16} />
            Télécharger le ZIP
          </Button>
        {/if}
      {/if}
    </div>
  {/snippet}

  <main class="main">
    <PageHeader
      icon={FilePenLine}
      eyebrow="Éditeur QTI"
      title="Editor"
      subtitle="Modifiez le prompt, les réponses, la limite de caractères et les métadonnées de chaque question, puis exportez un ZIP prêt à réimporter dans TAO."
    />

    {#if !sourceFile}
      <EmptyState
        icon={FileArchive}
        title="Importez un paquet QTI"
        description="Sélectionnez le .zip exporté depuis TAO. Choisissez ensuite une question dans le panneau latéral pour l'éditer, en mode simple ou en XML brut."
      />
    {:else if parsing}
      <EmptyState icon={FileArchive} title="Lecture du paquet…" />
    {:else if !selectedItem}
      <EmptyState
        icon={FileText}
        title="Choisissez une question"
        description="Sélectionnez une question dans la liste du panneau latéral pour l'éditer."
      />
    {:else}
      {@const item = selectedItem}
      <section class="editor-card">
        <div class="editor-head">
          <h3 class="editor-title">{item.title}</h3>
          <div class="mode-switch" role="group" aria-label="Mode d'édition">
            <button type="button" class:active={mode === "simple"} onclick={() => switchMode("simple")}>
              Simple
            </button>
            <button type="button" class:active={mode === "raw"} onclick={() => switchMode("raw")}>
              XML brut
            </button>
          </div>
        </div>

        {#if mode === "simple"}
          <ItemEditorSimple
            {item}
            {hasTestFile}
            {testOptions}
            {hasManifestFile}
            {hasResourceInManifest}
            {hasMetadataBlock}
            {lomFields}
            onAttrs={handleAttrs}
            onPrompt={handlePrompt}
            onChoiceText={handleChoiceText}
            onCorrect={handleCorrect}
            onChoiceScore={handleChoiceScore}
            onCharLimit={handleCharLimit}
            onToolsChange={handleToolsChange}
            onLomField={handleLomField}
            onAddLomMetadata={handleAddLomMetadata}
          />
        {:else}
          {#if hasTestFile || hasManifestFile}
            <div class="raw-tabs" role="tablist" aria-label="Fichier">
              {#each visibleRawTabs as tab (tab)}
                <button
                  type="button"
                  role="tab"
                  aria-selected={rawTab === tab}
                  class:active={rawTab === tab}
                  onclick={() => (rawTab = tab)}
                >
                  {rawTabLabel[tab]}
                </button>
              {/each}
            </div>
          {/if}
          {#if activeRawFilename}
            <RawXmlEditor
              value={texts.get(activeRawFilename) ?? ""}
              label={activeRawFilename}
              oninput={handleRawInput}
            />
          {/if}
        {/if}
      </section>

      {#if result}
        <section class="result-card">
          <div class="result-head">
            <span class="result-icon"><CheckCircle2 size={20} /></span>
            <div>
              <h3 class="result-title">
                {result.changedFiles} fichier{result.changedFiles === 1 ? "" : "s"} modifié{result.changedFiles === 1
                  ? ""
                  : "s"}
              </h3>
              <p class="result-sub">{result.totalItems} question{result.totalItems === 1 ? "" : "s"} dans le paquet</p>
            </div>
          </div>
          <p class="result-note">
            Téléchargez <code>{outName}</code> et réimportez-le dans TAO pour récupérer le paquet édité.
          </p>
          <Button variant="primary" onclick={download}>
            <Download size={16} />
            Télécharger {outName}
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

  .editor-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .editor-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 650;
    color: var(--text);
  }

  .mode-switch,
  .raw-tabs {
    display: inline-flex;
    padding: 3px;
    gap: 2px;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface);
  }

  .mode-switch button,
  .raw-tabs button {
    border: none;
    background: none;
    padding: 6px 12px;
    border-radius: var(--radius);
    font-family: var(--font-family);
    font-size: 0.82rem;
    color: var(--text-muted);
    cursor: pointer;
    transition: background-color 200ms ease, color 200ms ease;
  }

  .mode-switch button:hover,
  .raw-tabs button:hover {
    color: var(--text);
  }

  .mode-switch button.active,
  .raw-tabs button.active {
    background: rgba(var(--brand-rgb), 0.1);
    color: var(--brand);
  }

  .raw-tabs {
    align-self: flex-start;
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

  @media (prefers-reduced-motion: reduce) {
    .mode-switch button,
    .raw-tabs button {
      transition: none;
    }
  }
</style>

<script lang="ts">
  import { AlertTriangle, Plus, X } from "lucide-svelte";
  import { SvelteSet } from "svelte/reactivity";
  import StemEditor from "$lib/format/StemEditor.svelte";
  import { htmlStemToText } from "$lib/format/stemFormat";
  import { TOOL_LABELS } from "$lib/questions/tao-tools.js";
  import type { TaoTools } from "$lib/questions/types.js";
  import type { EditableItem } from "./itemFields";
  import type { TestToolOptions } from "./testFields";
  import type { LomField } from "./manifestFields";

  interface Props {
    item: EditableItem;
    hasTestFile: boolean;
    testOptions: TestToolOptions | null;
    hasManifestFile: boolean;
    hasResourceInManifest: boolean;
    hasMetadataBlock: boolean;
    lomFields: LomField[];
    onAttrs: (attrs: { title?: string; label?: string; lang?: string }) => void;
    onPrompt: (text: string) => void;
    onChoiceText: (identifier: string, html: string) => void;
    onCorrect: (identifiers: string[]) => void;
    onChoiceScore: (identifier: string, score: number) => void;
    onCharLimit: (maxLength: number | null) => void;
    onToolsChange: (tools: TaoTools, informational: boolean) => void;
    onLomField: (index: number, value: string) => void;
    onAddLomMetadata: () => void;
  }

  let {
    item,
    hasTestFile,
    testOptions,
    hasManifestFile,
    hasResourceInManifest,
    hasMetadataBlock,
    lomFields,
    onAttrs,
    onPrompt,
    onChoiceText,
    onCorrect,
    onChoiceScore,
    onCharLimit,
    onToolsChange,
    onLomField,
    onAddLomMetadata
  }: Props = $props();

  const promptText = $derived(item.promptRegion ? htmlStemToText(item.promptRegion.innerHtml) : "");

  function toggleCorrect(identifier: string, checked: boolean) {
    if (item.maxChoices === 1) {
      onCorrect(checked ? [identifier] : []);
      return;
    }
    const current = new SvelteSet(item.choices.filter((c) => c.correct).map((c) => c.identifier));
    if (checked) current.add(identifier);
    else current.delete(identifier);
    onCorrect([...current]);
  }

  function toggleTool(key: string, checked: boolean) {
    onToolsChange({ ...testOptions?.tools, [key]: checked }, testOptions?.informational ?? false);
  }
</script>

<div class="form">
  <section class="field-group">
    <span class="field-label">Prompt</span>
    <StemEditor value={promptText} disabled={item.promptRegion === null} oninput={onPrompt} />
  </section>

  {#if item.kind === "choice"}
    <section class="field-group">
      <span class="field-label">Réponses</span>
      <p class="field-hint">
        {item.maxChoices === 1
          ? "Une seule réponse correcte."
          : "Plusieurs réponses correctes possibles."}
      </p>
      <ul class="choice-list">
        {#each item.choices as choice (choice.identifier)}
          <li class="choice-row">
            <label class="choice-correct" title="Réponse correcte">
              <input
                type={item.maxChoices === 1 ? "radio" : "checkbox"}
                name="correct-{item.identifier}"
                checked={choice.correct}
                onchange={(e) => toggleCorrect(choice.identifier, (e.currentTarget as HTMLInputElement).checked)}
              />
            </label>
            <textarea
              class="input choice-text"
              rows="2"
              value={choice.html}
              oninput={(e) => onChoiceText(choice.identifier, (e.currentTarget as HTMLTextAreaElement).value)}
            ></textarea>
            {#if choice.score !== null}
              <input
                type="number"
                class="input choice-score"
                value={choice.score}
                title="Score"
                oninput={(e) => onChoiceScore(choice.identifier, Number((e.currentTarget as HTMLInputElement).value))}
              />
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {:else if item.kind === "text"}
    <section class="field-group">
      <span class="field-label">Limite de caractères</span>
      <div class="char-limit-row">
        <input
          type="number"
          class="input char-limit-input"
          min="0"
          value={item.charLimit ?? ""}
          placeholder="Aucune limite"
          oninput={(e) => {
            const raw = (e.currentTarget as HTMLInputElement).value;
            onCharLimit(raw === "" ? null : Number(raw));
          }}
        />
        {#if item.charLimit !== null}
          <button type="button" class="link-btn" onclick={() => onCharLimit(null)}>
            <X size={13} strokeWidth={1.75} />
            Retirer la limite
          </button>
        {/if}
      </div>
    </section>
  {:else}
    <p class="unsupported-note">
      <AlertTriangle size={14} strokeWidth={1.75} />
      Type de question non pris en charge en mode simple — utilisez le mode XML brut.
    </p>
  {/if}

  <details class="metadata" open>
    <summary>Métadonnées</summary>

    <div class="metadata-body">
      <section class="field-group">
        <span class="field-sublabel">Question</span>
        <div class="grid-3">
          <label class="field">
            <span class="field-caption">Titre</span>
            <input
              type="text"
              class="input"
              value={item.title}
              oninput={(e) => onAttrs({ title: (e.currentTarget as HTMLInputElement).value })}
            />
          </label>
          <label class="field">
            <span class="field-caption">Label</span>
            <input
              type="text"
              class="input"
              value={item.label}
              oninput={(e) => onAttrs({ label: (e.currentTarget as HTMLInputElement).value })}
            />
          </label>
          <label class="field">
            <span class="field-caption">Langue</span>
            <input
              type="text"
              class="input"
              value={item.lang}
              placeholder="fr-FR"
              oninput={(e) => onAttrs({ lang: (e.currentTarget as HTMLInputElement).value })}
            />
          </label>
        </div>
        <p class="field-hint">Identifiant : <code>{item.identifier}</code> (lecture seule)</p>
      </section>

      {#if hasTestFile}
        <section class="field-group">
          <span class="field-sublabel">Options TAO du test</span>
          {#if testOptions === null}
            <p class="field-hint">Cette question n'a pas d'entrée dans test.xml.</p>
          {:else}
            <ul class="tool-list">
              {#each Object.entries(TOOL_LABELS) as [key, label] (key)}
                <li class="tool-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={testOptions.tools[key] ?? false}
                      onchange={(e) => toggleTool(key, (e.currentTarget as HTMLInputElement).checked)}
                    />
                    {label}
                  </label>
                </li>
              {/each}
              <li class="tool-row">
                <label>
                  <input
                    type="checkbox"
                    checked={testOptions.informational}
                    onchange={(e) =>
                      onToolsChange(testOptions?.tools ?? {}, (e.currentTarget as HTMLInputElement).checked)}
                  />
                  Informationnelle (non notée)
                </label>
              </li>
            </ul>
          {/if}
        </section>
      {/if}

      {#if hasManifestFile}
        <section class="field-group">
          <span class="field-sublabel">Métadonnées LOM / manifest</span>
          <p class="field-hint">
            Support best-effort : ces champs dépendent de ce que TAO a réellement exporté. Vérifiez
            le paquet réimporté dans TAO avant de vous y fier.
          </p>
          {#if !hasResourceInManifest}
            <p class="field-hint">Cette question n'est pas déclarée comme ressource dans imsmanifest.xml.</p>
          {:else if !hasMetadataBlock}
            <p class="field-hint">Aucune métadonnée LOM détectée pour cette question.</p>
            <button type="button" class="link-btn" onclick={onAddLomMetadata}>
              <Plus size={13} strokeWidth={1.75} />
              Ajouter des métadonnées
            </button>
          {:else}
            <ul class="lom-list">
              {#each lomFields as lomField (lomField.index)}
                <li class="field">
                  <span class="field-caption">{lomField.label}</span>
                  <input
                    type="text"
                    class="input"
                    value={lomField.value}
                    oninput={(e) => onLomField(lomField.index, (e.currentTarget as HTMLInputElement).value)}
                  />
                </li>
              {/each}
            </ul>
          {/if}
        </section>
      {/if}
    </div>
  </details>
</div>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .field-sublabel {
    font-size: 0.78rem;
    font-weight: 650;
    color: var(--text);
  }

  .field-hint {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .field-hint code {
    font-family: "SF Mono", "Roboto Mono", ui-monospace, monospace;
    font-size: 0.85em;
  }

  .input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background-color: var(--surface);
    color: var(--text);
    font-family: var(--font-family);
    font-size: var(--font-size-base);
    line-height: var(--line-height);
    transition: border-color 200ms ease, box-shadow 200ms ease;
  }

  .input:focus {
    outline: none;
    border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  .choice-text {
    resize: vertical;
  }

  .choice-list,
  .tool-list,
  .lom-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .choice-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: start;
    gap: 8px;
  }

  .choice-correct {
    display: flex;
    align-items: center;
    height: 38px;
  }

  .choice-score {
    width: 5.5rem;
  }

  .char-limit-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .char-limit-input {
    width: 8rem;
  }

  .link-btn {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 4px;
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

  .unsupported-note {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin: 0;
    padding: 10px 12px;
    border: 1px dashed var(--border);
    border-radius: var(--radius-lg);
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .metadata {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 10px 14px;
  }

  .metadata summary {
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 650;
    color: var(--text);
  }

  .metadata-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 0.85rem;
  }

  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .field-caption {
    font-size: 0.72rem;
    color: var(--text-muted);
  }

  .tool-row label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.88rem;
    color: var(--text);
  }

  @media (max-width: 640px) {
    .grid-3 {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .input {
      transition: none;
    }
  }
</style>

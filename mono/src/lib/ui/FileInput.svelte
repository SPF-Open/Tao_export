<script lang="ts">
  import { Upload, ChevronDown } from "lucide-svelte";
  import { slide } from "svelte/transition";
  import { browser } from "$app/environment";
  import { buildUnsupportedFileMessage, matchesAcceptedType, parseAccept } from "./fileAccept";
  import { pushError } from "./notifications";

  interface Props {
    file?: File[];
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    invalidTitle?: string;
    /** Called with the accepted files whenever a valid selection is made. */
    onfiles?: (files: File[]) => void;
    [key: string]: any;
  }

  let {
    file = $bindable([]),
    accept = "",
    multiple = false,
    disabled = false,
    invalidTitle = "Unsupported file type",
    onfiles = undefined,
    ...rest
  } = $props();

  let inputElement: HTMLInputElement;
  let errorMessage = $state("");
  let rejected = $state(false);
  let showFiles = $state(false);
  let rejectTimer: ReturnType<typeof setTimeout> | undefined;

  const acceptedTypes = $derived(parseAccept(accept));
  const slideDur = browser && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 200;

  function animateRejection() {
    rejected = false;
    if (rejectTimer) clearTimeout(rejectTimer);
    requestAnimationFrame(() => {
      rejected = true;
      rejectTimer = setTimeout(() => {
        rejected = false;
      }, 420);
    });
  }

  function rejectFiles() {
    errorMessage = buildUnsupportedFileMessage(acceptedTypes);
    pushError(invalidTitle, errorMessage);
    animateRejection();

    if (inputElement) {
      inputElement.value = "";
    }
  }

  function acceptFiles(selectedFiles: File[]) {
    if (!selectedFiles.length) return;

    const invalidFiles = selectedFiles.filter((selectedFile) => !matchesAcceptedType(selectedFile, acceptedTypes));
    if (invalidFiles.length > 0) {
      rejectFiles();
      return;
    }

    errorMessage = "";
    showFiles = false;
    const accepted = multiple ? selectedFiles : [selectedFiles[0]];
    file = accepted;
    onfiles?.(accepted);
  }

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    acceptFiles(Array.from(target.files || []));
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
      const droppedFiles = Array.from(event.dataTransfer?.files || []);
      acceptFiles(multiple ? droppedFiles : droppedFiles.slice(0, 1));
    }
  }
</script>

<div class="file-input-wrapper">
  <div
    role="region"
    aria-label="File upload area"
    class="file-input-area"
    class:disabled
    class:rejected
    ondragover={handleDragOver}
    ondrop={handleDrop}
  >
    <input
      type="file"
      bind:this={inputElement}
      onchange={handleChange}
      multiple={multiple}
      accept={accept}
      disabled={disabled}
      style="display: none"
      {...rest}
    />
    <button
      type="button"
      class="file-input-button"
      onclick={() => inputElement?.click()}
      disabled={disabled}
    >
      <Upload size={20} />
      <span>Click to upload or drag and drop</span>
    </button>
    {#if errorMessage}
      <p class="file-error" role="alert">{errorMessage}</p>
    {/if}
    {#if file.length > 0}
      <div class="file-list">
        <button
          type="button"
          class="file-toggle"
          aria-expanded={showFiles}
          onclick={() => (showFiles = !showFiles)}
        >
          <ChevronDown size={14} strokeWidth={2} class="file-chevron {showFiles ? 'open' : ''}" />
          <span class="file-count">{file.length} file{file.length !== 1 ? 's' : ''} selected</span>
        </button>
        {#if showFiles}
          <ul transition:slide={{ duration: slideDur }}>
            {#each file as f (f.name)}
              <li>{f.name}</li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .file-input-wrapper {
    width: 100%;
  }

  .file-input-area {
    border: 2px dashed var(--border);
    border-radius: var(--radius-lg);
    padding: 8px;
    text-align: center;
    transition: border-color 200ms ease;
    background-color: var(--surface);
  }

  .file-input-area:hover:not(.disabled) {
    border-color: var(--primary);
    background-color: var(--surface);
  }

  .file-input-area.rejected {
    border-color: var(--danger);
    background: color-mix(in srgb, var(--danger) 6%, var(--surface));
    animation: reject-shake 420ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .file-input-area.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .file-input-button {
    margin: auto;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: var(--text-muted);
    font-family: var(--font-family);
    font-size: var(--font-size-base);
    transition: color 200ms ease;
  }

  .file-input-button:hover:not(:disabled) {
    color: var(--text);
  }

  .file-input-button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  .file-input-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .file-error {
    margin: 10px 0 0;
    color: var(--danger);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.35;
    text-align: center;
  }

  .file-list {
    margin-top: 12px;
    text-align: left;
  }

  .file-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    padding: 2px 4px;
    margin: 0;
    cursor: pointer;
    color: var(--text-muted);
    font-family: var(--font-family);
    font-size: 12px;
    border-radius: var(--radius);
  }

  .file-toggle:hover {
    color: var(--text);
  }

  .file-toggle:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  .file-toggle :global(.file-chevron) {
    transition: transform 200ms ease;
  }

  .file-toggle :global(.file-chevron.open) {
    transform: rotate(-180deg);
  }

  .file-count {
    margin: 0;
  }

  .file-list ul {
    list-style: none;
    padding: 0;
    margin: 4px 0 0;
  }

  .file-list li {
    padding: 4px 0;
    color: var(--text);
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @keyframes reject-shake {
    0%, 100% {
      transform: translateX(0);
    }
    18% {
      transform: translateX(-5px);
    }
    36% {
      transform: translateX(5px);
    }
    54% {
      transform: translateX(-3px);
    }
    72% {
      transform: translateX(3px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .file-input-area.rejected {
      animation: none;
    }

    .file-toggle :global(.file-chevron) {
      transition: none;
    }
  }

  @media (max-width: 640px) {
    .file-input-button {
      min-height: 44px;
      padding: 12px 8px;
    }
    .file-toggle {
      min-height: 36px;
    }
  }
</style>

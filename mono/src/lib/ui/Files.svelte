<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Upload } from "lucide-svelte";
  import { buildUnsupportedFileMessage, matchesAcceptedType, parseAccept } from "./fileAccept";
  import { pushError } from "./notifications";

  interface Props {
    file?: File[];
    multiple?: boolean;
    accept?: string;
    disabled?: boolean;
    invalidTitle?: string;
    [key: string]: any;
  }

  let {
    file = $bindable([]),
    multiple = false,
    accept = "",
    disabled = false,
    invalidTitle = "Unsupported file type",
    ...rest
  } = $props();

  let inputElement: HTMLInputElement;
  let errorMessage = $state("");
  let rejected = $state(false);
  let rejectTimer: ReturnType<typeof setTimeout> | undefined;
  const dispatch = createEventDispatcher();
  const acceptedTypes = $derived(parseAccept(accept));

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

    const nextFiles = multiple ? selectedFiles : selectedFiles.slice(0, 1);
    const invalidFiles = nextFiles.filter((selectedFile) => !matchesAcceptedType(selectedFile, acceptedTypes));

    if (invalidFiles.length > 0) {
      rejectFiles();
      return;
    }

    errorMessage = "";
    file = nextFiles;
    dispatch("change", { file });
  }

  function handleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    acceptFiles(input.files ? Array.from(input.files) : []);
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) {
      return;
    }
    const droppedFiles = Array.from(event.dataTransfer?.files || []);
    acceptFiles(droppedFiles);
  }
</script>

<div class="files">
  <div
    role="region"
    aria-label="Files upload area"
    class="files-area"
    class:disabled
    class:rejected
    ondragover={handleDragOver}
    ondrop={handleDrop}
  >
    <input
      bind:this={inputElement}
      type="file"
      onchange={handleChange}
      {multiple}
      {accept}
      {disabled}
      class="files-native"
      {...rest}
    />

    <button
      type="button"
      class="files-button"
      onclick={() => inputElement?.click()}
      disabled={disabled}
    >
      <Upload size={18} />
      <span>Choose file{multiple ? "s" : ""} or drag and drop</span>
    </button>

    {#if errorMessage}
      <p class="files-error" role="alert">{errorMessage}</p>
    {/if}

    {#if file.length > 0}
      <div class="files-list" aria-live="polite">
        <p class="files-count">{file.length} file{file.length !== 1 ? "s" : ""} selected</p>
        <ul>
          {#each file as f (f.name)}
            <li>{f.name}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>

<style>
  .files {
    width: 100%;
  }

  .files-area {
    border: 2px dashed var(--border);
    border-radius: var(--radius-lg);
    padding: 8px;
    text-align: center;
    transition: border-color 200ms ease;
    background-color: var(--surface);
  }

  .files-area:hover:not(.disabled) {
    border-color: var(--primary);
  }

  .files-area.rejected {
    border-color: var(--danger);
    background: color-mix(in srgb, var(--danger) 6%, var(--surface));
    animation: reject-shake 420ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .files-area.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .files-native {
    display: none;
  }

  .files-button {
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

  .files-button:hover:not(:disabled) {
    color: var(--text);
  }

  .files-button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  .files-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .files-error {
    margin: 10px 0 0;
    color: var(--danger);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.35;
    text-align: center;
  }

  .files-list {
    margin-top: 12px;
    text-align: left;
  }

  .files-count {
    margin: 0 0 4px 0;
    color: var(--text-muted);
    font-size: 12px;
  }

  .files-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .files-list li {
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
    .files-area.rejected {
      animation: none;
    }
  }
</style>

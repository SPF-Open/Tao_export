<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Upload } from "lucide-svelte";

  interface Props {
    file?: File[];
    multiple?: boolean;
    accept?: string;
    disabled?: boolean;
  }

  let {
    file = $bindable([]),
    multiple = false,
    accept = "",
    disabled = false
  }: Props = $props();

  let inputElement: HTMLInputElement;
  const dispatch = createEventDispatcher();

  function handleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    file = input.files ? Array.from(input.files) : [];
    dispatch('change', { file });
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
    file = multiple ? droppedFiles : droppedFiles.slice(0, 1);
    dispatch('change', { file });
  }
</script>

<div class="files">
  <div
    role="region"
    aria-label="Files upload area"
    class="files-area"
    class:disabled
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

  .files-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
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
</style>

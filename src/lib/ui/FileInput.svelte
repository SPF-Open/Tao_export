<script lang="ts">
  interface Props {
    file?: File[];
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    [key: string]: any;
  }

  let { file = $bindable([]), accept = "", multiple = false, disabled = false, ...rest } = $props();

  let inputElement: HTMLInputElement;

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    file = Array.from(target.files || []);
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
      file = multiple ? droppedFiles : [droppedFiles[0]];
    }
  }
</script>

<div class="file-input-wrapper">
  <div
    role="region"
    aria-label="File upload area"
    class="file-input-area"
    class:disabled
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
    />
    <button
      type="button"
      class="file-input-button"
      onclick={() => inputElement?.click()}
      disabled={disabled}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      <span>Click to upload or drag and drop</span>
    </button>
    {#if file.length > 0}
      <div class="file-list">
        <p class="file-count">{file.length} file{file.length !== 1 ? 's' : ''} selected</p>
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
  .file-input-wrapper {
    width: 100%;
  }

  .file-input-area {
    border: 2px dashed var(--border);
    border-radius: var(--radius-lg);
    padding: 16px;
    text-align: center;
    transition: border-color 200ms ease;
    background-color: var(--surface);
  }

  .file-input-area:hover:not(.disabled) {
    border-color: var(--primary);
    background-color: var(--surface);
  }

  .file-input-area.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .file-input-button {
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

  .file-input-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .file-list {
    margin-top: 12px;
    text-align: left;
  }

  .file-count {
    margin: 0 0 4px 0;
    color: var(--text-muted);
    font-size: 12px;
  }

  .file-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .file-list li {
    padding: 4px 0;
    color: var(--text);
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>

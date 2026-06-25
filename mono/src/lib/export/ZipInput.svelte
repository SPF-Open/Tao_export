<script lang="ts">
  import {
    assessments,
    resetQuestions,
    windowName,
    sourceFileName,
  } from "./store";
  import Button from "$lib/ui/Button.svelte";
  import { Printer, FileJson, ChevronDown, FileArchive, X } from 'lucide-svelte';

  type Props = {
    onExportPDF?: () => void;
    onExportJSON?: () => void;
  };

  interface ComponentProps extends Props {}

  let { onExportPDF, onExportJSON }: ComponentProps = $props();

  let exportFormat = $state<'pdf' | 'json'>('pdf');
  let dropdownOpen = $state(false);

  // Clearing the file sends the user back to the centered drop zone in the main area.
  function clearFile() {
    assessments.set([]);
    resetQuestions();
    windowName.set("TAO Export");
    sourceFileName.set("");
  }
</script>

<div class="zip-input">
  {#if $sourceFileName}
    <div class="file-badge">
      <FileArchive size={15} />
      <span class="file-name" title={$sourceFileName}>{$sourceFileName}</span>
      <button class="file-clear" type="button" onclick={clearFile} aria-label="Change file">
        <X size={14} />
      </button>
    </div>
  {/if}

  {#if $assessments.length > 0}
    <Button
      onclick={() => {
        if (exportFormat === 'pdf') {
          onExportPDF?.();
        } else {
          onExportJSON?.();
        }
      }}
      onClick={() => {
        if (exportFormat === 'pdf') {
          onExportPDF?.();
        } else {
          onExportJSON?.();
        }
      }}
      variant="primary"
    >
      {#if exportFormat === 'pdf'}
        <Printer size={16} />
        Get PDF
      {:else}
        <FileJson size={16} />
        Get JSON
      {/if}
    </Button>

    <div class="export-selector">
      <button
        class="dropdown-toggle"
        onclick={() => dropdownOpen = !dropdownOpen}
        aria-label="Select export format"
      >
        <span class="selector-label">
          {exportFormat === 'pdf' ? 'PDF' : 'JSON'}
        </span>
        <div class="chevron" class:rotated={dropdownOpen}>
          <ChevronDown size={14} />
        </div>
      </button>

      {#if dropdownOpen}
        <div class="dropdown-menu">
          <button
            class="dropdown-item"
            class:active={exportFormat === 'pdf'}
            onclick={() => {
              exportFormat = 'pdf';
              dropdownOpen = false;
            }}
          >
            PDF
          </button>
          <button
            class="dropdown-item"
            class:active={exportFormat === 'json'}
            onclick={() => {
              exportFormat = 'json';
              dropdownOpen = false;
            }}
          >
            JSON
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .zip-input {
    display: flex;
    flex-direction: column;
    gap: 12px;
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

  .file-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 2px;
    border-radius: var(--radius);
    transition: color 0.15s, background 0.15s;
  }

  .file-clear:hover {
    color: var(--text);
    background: var(--surface);
  }

  .export-selector {
    position: relative;
  }

  .dropdown-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 12px;
    transition: color 0.2s;
  }

  .dropdown-toggle:hover {
    color: var(--text);
  }

  .selector-label {
    font-weight: 500;
    font-size: 12px;
  }

  .chevron {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
  }

  .chevron.rotated {
    transform: rotate(180deg);
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin-top: 4px;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .dropdown-item {
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    text-align: left;
    color: var(--text);
    cursor: pointer;
    font-size: 12px;
    transition: background 0.2s;
  }

  .dropdown-item:hover {
    background: var(--surface);
  }

  .dropdown-item.active {
    color: var(--accent);
    font-weight: 600;
  }

  .dropdown-item:first-child {
    border-radius: var(--radius) var(--radius) 0 0;
  }

  .dropdown-item:last-child {
    border-radius: 0 0 var(--radius) var(--radius);
  }
</style>

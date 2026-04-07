<script lang="ts">
  import Switch from "./ui/Switch.svelte";
  import {
    compareMode,
    inzage,
    showAnswer,
    showInstruction,
    showLetter,
    sort,
    zoom,
    multiple,
    merge,
    randomizeAnswer,
    randomizeQuestion,
    darkMode,
  } from "../store";
  import { slide } from "svelte/transition";

  let state = $state({ main: true, extra: false, paperTest: false, file: false });
</script>

<div class="settings-panel">
  <div class="settings-section">
    <button class="section-header" onclick={() => state.main = !state.main}>
      <div class="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        <span>Main</span>
      </div>
      <div class="section-toggle" class:open={state.main}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </button>
    {#if state.main}
      <div class="section-content" transition:slide={{ duration: 200 }}>
        <div class="setting-row">
          <span class="setting-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Show Answer</span>
          </span>
          <Switch bind:checked={$showAnswer} />
        </div>
        <div class="setting-row">
          <span class="setting-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
            <span>Show Instruction</span>
          </span>
          <Switch bind:checked={$showInstruction} />
        </div>
      </div>
    {/if}
  </div>

    <div class="settings-section">
    <button class="section-header" onclick={() => state.paperTest = !state.paperTest}>
      <div class="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="12" y1="13" x2="16" y2="13"></line>
          <line x1="12" y1="17" x2="16" y2="17"></line>
          <polyline points="9 13 8 12 7 13"></polyline>
          <polyline points="9 17 8 16 7 17"></polyline>
        </svg>
        <span>Paper Test</span>
      </div>
      <div class="section-toggle" class:open={state.paperTest}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </button>
    {#if state.paperTest}
      <div class="section-content" transition:slide={{ duration: 200 }}>
        <div class="setting-row">
          <span class="setting-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="4 7 4 4 20 4 20 7"></polyline>
              <line x1="9" y1="20" x2="15" y2="20"></line>
              <line x1="12" y1="4" x2="12" y2="20"></line>
            </svg>
            <span>with Letter (A,B,C)</span>
          </span>
          <Switch bind:checked={$showLetter} />
        </div>
        <div class="setting-row">
          <span class="setting-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 3 21 3 21 8"></polyline>
              <line x1="4" y1="20" x2="21" y2="3"></line>
              <polyline points="21 16 21 21 16 21"></polyline>
              <line x1="15" y1="15" x2="21" y2="21"></line>
              <line x1="4" y1="4" x2="9" y2="9"></line>
            </svg>
            <span>Randomize Answer</span>
          </span>
          <Switch bind:checked={$randomizeAnswer} />
        </div>
        <div class="setting-row">
          <span class="setting-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 3 21 3 21 8"></polyline>
              <line x1="4" y1="20" x2="21" y2="3"></line>
              <polyline points="21 16 21 21 16 21"></polyline>
              <line x1="15" y1="15" x2="21" y2="21"></line>
              <line x1="4" y1="4" x2="9" y2="9"></line>
            </svg>
            <span>Randomize Question</span>
          </span>
          <Switch bind:checked={$randomizeQuestion} />
        </div>
      </div>
    {/if}
  </div>

  <div class="settings-section">
    <button class="section-header" onclick={() => state.extra = !state.extra}>
      <div class="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>
        <span>Extra</span>
      </div>
      <div class="section-toggle" class:open={state.extra}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </button>
    {#if state.extra}
      <div class="section-content" transition:slide={{ duration: 200 }}>
        <div class="setting-row">
          <span class="setting-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="12" y1="3" x2="12" y2="21"></line>
            </svg>
            <span>Compare Test</span>
          </span>
          <Switch bind:checked={$compareMode} />
        </div>
        <div class="setting-row">
          <span class="setting-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Inzage Mode</span>
          </span>
          <Switch bind:checked={$inzage} />
        </div>
        <div class="setting-row">
          <span class="setting-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="9" x2="20" y2="9"></line>
              <line x1="4" y1="15" x2="20" y2="15"></line>
              <line x1="10" y1="3" x2="8" y2="21"></line>
              <line x1="16" y1="3" x2="14" y2="21"></line>
            </svg>
            <span>Sort Question</span>
          </span>
          <Switch bind:checked={$sort} />
        </div>
        <div class="setting-row">
          <span class="setting-label">
            <span>Font Size</span>
          </span>
          <div class="zoom-control">
            <input 
              type="range" 
              min="0.8" 
              max="1.5" 
              step="0.1" 
              bind:value={$zoom} 
              class="zoom-slider"
            />
            <span class="zoom-value">{Math.round($zoom * 100)}%</span>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="settings-section">
    <button class="section-header" onclick={() => state.file = !state.file}>
      <div class="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Files</span>
      </div>
      <div class="section-toggle" class:open={state.file}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </button>
    {#if state.file}
      <div class="section-content" transition:slide={{ duration: 200 }}>
        <div class="setting-row">
          <span class="setting-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Multiple Files</span>
          </span>
          <Switch bind:checked={$multiple} />
        </div>
        {#if $multiple}
          <div class="setting-row sub-setting">
            <span class="setting-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Merge Files</span>
            </span>
            <Switch bind:checked={$merge} />
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .settings-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .settings-section {
    background: var(--surface-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .section-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
  }

  .section-header:hover {
    background: var(--surface);
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
  }

  .section-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    transition: transform 0.2s;
  }

  .section-toggle.open {
    transform: rotate(180deg);
  }

  .section-content {
    padding: 8px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-top: 1px solid var(--border);
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
  }

  .setting-row:not(:last-child) {
    border-bottom: 1px solid var(--border);
  }

  .setting-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text);
  }

  .sub-setting {
    padding-left: 8px;
  }

  .sub-setting .setting-label {
    font-size: 12px;
    color: var(--text-muted);
  }

  .zoom-control {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .zoom-slider {
    width: 80px;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--border);
    border-radius: 2px;
    outline: none;
  }

  .zoom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    background: var(--accent);
    border-radius: 50%;
    cursor: pointer;
  }

  .zoom-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    background: var(--accent);
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }

  .zoom-value {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    min-width: 40px;
    text-align: right;
  }
</style>

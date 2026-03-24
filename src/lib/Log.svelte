<script lang="ts">
  import { Level, errors } from "./log";
  import { slide } from "svelte/transition";

  const remove = (err: any) =>
      errors.update((errs) => errs.filter((e) => e !== err));
</script>

<div class="toast-container">
  {#if $errors}
      {#each $errors as error}
          <div
              class="toast level-{Level[error.level] || 'unknown'}"
              transition:slide={{ duration: 200 }}
              role="alert"
          >
            <div class="toast-icon">
              {#if Level[error.level] === 'ERROR'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              {:else if Level[error.level] === 'WARNING'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              {:else if Level[error.level] === 'INFO'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              {:else}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              {/if}
            </div>
            <span class="toast-message">{error.message}</span>
            <button class="toast-close" onclick={() => remove(error)} aria-label="Dismiss">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
      {/each}
  {/if}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 60px;
    right: 16px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 400px;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    animation: slideIn 0.2s ease-out;
  }

  .toast-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toast-message {
    flex: 1;
    font-size: 13px;
    line-height: 1.4;
  }

  .toast-close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.15s;
    padding: 0;
  }

  .toast-close:hover {
    opacity: 1;
  }

  .level-ERROR {
    background: var(--danger);
    color: var(--danger-foreground);
  }

  .level-ERROR .toast-icon {
    color: var(--danger-foreground);
  }

  .level-WARNING {
    background: var(--warning);
    color: var(--warning-foreground);
  }

  .level-WARNING .toast-icon {
    color: var(--warning-foreground);
  }

  .level-INFO {
    background: #0ea5e9;
    color: white;
  }

  .level-INFO .toast-icon {
    color: white;
  }

  .level-SUCCESS {
    background: var(--success);
    color: var(--success-foreground);
  }

  .level-SUCCESS .toast-icon {
    color: var(--success-foreground);
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
</style>

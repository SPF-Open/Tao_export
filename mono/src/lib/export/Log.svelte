<script lang="ts">
  import { Level, errors } from "./log";
  import { slide } from "svelte/transition";
  import { X, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-svelte';

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
                <AlertCircle size={16} />
              {:else if Level[error.level] === 'WARNING'}
                <AlertTriangle size={16} />
              {:else if Level[error.level] === 'INFO'}
                <Info size={16} />
              {:else}
                <CheckCircle size={16} />
              {/if}
            </div>
            <span class="toast-message">{error.message}</span>
            <button class="toast-close" onclick={() => remove(error)} aria-label="Dismiss">
              <X size={14} />
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

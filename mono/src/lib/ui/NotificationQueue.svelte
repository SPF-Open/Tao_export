<script lang="ts">
  import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-svelte";
  import { dismissNotification, notifications } from "./notifications";

  const icons = {
    error: AlertCircle,
    info: Info,
    success: CheckCircle2,
    warning: TriangleAlert,
  };
</script>

{#if $notifications.length > 0}
  <section class="notification-queue hide-print" aria-label="Notifications" aria-live="polite">
    {#each $notifications as notification (notification.id)}
      {@const Icon = icons[notification.variant]}
      <article class="notification" class:error={notification.variant === "error"} role={notification.variant === "error" ? "alert" : "status"}>
        <span class="notification-icon" aria-hidden="true">
          <Icon size={18} strokeWidth={1.8} />
        </span>
        <div class="notification-body">
          <strong>{notification.title}</strong>
          <p>{notification.message}</p>
        </div>
        <button
          type="button"
          class="notification-close"
          aria-label="Dismiss notification"
          onclick={() => dismissNotification(notification.id)}
        >
          <X size={14} strokeWidth={1.8} />
        </button>
      </article>
    {/each}
  </section>
{/if}

<style>
  .notification-queue {
    position: fixed;
    top: calc(var(--layout-header-height) + 12px);
    right: 12px;
    z-index: 400;
    display: flex;
    width: min(420px, calc(100vw - 24px));
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }

  .notification {
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr) 28px;
    gap: 10px;
    align-items: start;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface-elevated);
    box-shadow: var(--shadow-lg);
    color: var(--text);
    pointer-events: auto;
    animation: notification-rise 180ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .notification.error {
    border-color: color-mix(in srgb, var(--danger) 38%, var(--border));
  }

  .notification-icon,
  .notification-close {
    display: grid;
    place-items: center;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
  }

  .notification-icon {
    width: 34px;
    height: 34px;
    color: var(--text-muted);
  }

  .notification.error .notification-icon {
    color: var(--danger);
    background: color-mix(in srgb, var(--danger) 8%, var(--surface));
    border-color: color-mix(in srgb, var(--danger) 24%, var(--border));
  }

  .notification-body {
    min-width: 0;
  }

  .notification-body strong {
    display: block;
    color: var(--text);
    font-size: 0.86rem;
    line-height: 1.25;
  }

  .notification-body p {
    margin-top: 3px;
    color: var(--text-muted);
    font-size: 0.78rem;
    line-height: 1.4;
  }

  .notification-close {
    width: 28px;
    height: 28px;
    padding: 0;
    color: var(--text-muted);
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      color 0.15s ease,
      background 0.15s ease;
  }

  .notification-close:hover {
    color: var(--text);
    border-color: var(--border-strong);
  }

  .notification-close:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  @keyframes notification-rise {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 640px) {
    .notification-queue {
      top: calc(var(--layout-header-height) + 8px);
      right: 8px;
      width: calc(100vw - 16px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .notification {
      animation: none;
    }
  }
</style>

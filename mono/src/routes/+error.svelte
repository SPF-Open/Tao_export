<script lang="ts">
  import { page } from "$app/state";
  import DotCanvas from "$lib/ui/DotCanvas.svelte";
  import { Compass } from "lucide-svelte";

  const message = $derived(
    page.status === 404
      ? "This page does not exist."
      : (page.error?.message ?? "Something went wrong.")
  );
</script>

<svelte:head>
  <title>{page.status} — TAO</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="error-page">
  <div class="error-bg" aria-hidden="true">
    <DotCanvas />
  </div>
  <div class="error-halo" aria-hidden="true"></div>

  <div class="error-content">
    <div class="error-icon">
      <Compass size={20} strokeWidth={1.75} />
    </div>
    <p class="error-status">{page.status}</p>
    <h1 class="error-title">{message}</h1>
    <p class="error-hint">Check the address, or head back to the tools overview.</p>
    <a class="error-home" href="/">Back to home</a>
  </div>
</div>

<style>
  .error-page {
    position: relative;
    min-height: calc(100vh - 120px);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    text-align: center;
    padding: 48px 16px;
  }

  .error-bg {
    position: absolute;
    inset: 0;
  }

  .error-halo {
    position: absolute;
    width: 480px;
    height: 480px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(var(--brand-rgb), 0.10) 0%, transparent 65%);
    pointer-events: none;
  }

  .error-content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    animation: rise 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .error-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-lg);
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-muted);
    margin-bottom: 6px;
  }

  .error-status {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.14em;
    color: rgba(var(--brand-rgb), 0.9);
  }

  .error-title {
    margin: 0;
    font-size: clamp(1.4rem, 3.5vw, 2rem);
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--text);
  }

  .error-hint {
    margin: 0;
    font-size: 0.95rem;
    color: var(--text-muted);
    max-width: 420px;
  }

  .error-home {
    margin-top: 14px;
    padding: 9px 18px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    background: var(--surface-elevated);
    color: var(--text);
    font-size: 0.9rem;
    font-weight: 600;
    text-decoration: none;
    transition: border-color 150ms ease, color 150ms ease, background-color 150ms ease;
  }

  .error-home:hover {
    border-color: rgba(var(--brand-rgb), 0.5);
    color: var(--brand);
    background: rgba(var(--brand-rgb), 0.08);
  }

  .error-home:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(var(--brand-rgb), 0.18);
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .error-content {
      animation: none;
    }
  }
</style>

<script lang="ts">
  // TAO logomark (ringed triad). The ring slowly spins.
  let { size = 30 }: { size?: number } = $props();
</script>

<svg viewBox="0 0 32 32" width={size} height={size} fill="none">
  <circle
    class="ring"
    cx="16"
    cy="16"
    r="13"
    stroke="currentColor"
    stroke-width="1.4"
    opacity="0.35"
  />
  <circle cx="16" cy="8.5" r="2.1" fill="currentColor" />
  <circle cx="22.5" cy="19.5" r="2.1" fill="currentColor" opacity="0.65" />
  <circle cx="9.5" cy="19.5" r="2.1" fill="currentColor" opacity="0.65" />
  <path
    d="M16 8.5 L22.5 19.5 L9.5 19.5 Z"
    stroke="currentColor"
    stroke-width="1.2"
    opacity="0.5"
  />
</svg>

<style>
  .ring {
    transform-origin: 16px 16px;
    animation: spin 9s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ring {
      animation: none !important;
    }
  }
</style>

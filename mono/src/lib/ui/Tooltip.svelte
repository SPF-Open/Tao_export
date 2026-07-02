<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
    tip?: import('svelte').Snippet | string;
  }

  let { children, tip }: Props = $props();

  let visible = $state(false);
</script>

<!-- focusin/focusout bubble from the slotted trigger, unlike focus/blur,
     so keyboard users see the tip when the child receives focus. -->
<span
  class="tooltip-anchor"
  role="presentation"
  onmouseenter={() => (visible = true)}
  onmouseleave={() => (visible = false)}
  onfocusin={() => (visible = true)}
  onfocusout={() => (visible = false)}
  onkeydown={(e) => {
    if (e.key === "Escape") visible = false;
  }}
>
  {@render children?.()}
  {#if visible && tip}
    <span class="tooltip-box" role="tooltip">
      {#if typeof tip === "string"}
        {tip}
      {:else}
        {@render tip()}
      {/if}
    </span>
  {/if}
</span>

<style>
  .tooltip-anchor {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .tooltip-box {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--accent);
    color: var(--accent-foreground);
    font-size: 11px;
    line-height: 1.4;
    padding: 4px 8px;
    border-radius: var(--radius);
    white-space: nowrap;
    z-index: 50;
    pointer-events: none;
    box-shadow: var(--shadow);
  }
</style>

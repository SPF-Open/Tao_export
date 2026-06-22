<script lang="ts">
  interface Props {
    value?: number;
  }

  let { value = $bindable(1) }: Props = $props();

  const levels = [
    { label: "Small font", zoom: 0.85, font: 12 },
    { label: "Normal font", zoom: 1, font: 15 },
    { label: "Big font", zoom: 1.2, font: 19 },
  ];
</script>

<div class="zoom-control" role="group" aria-label="Zoom level">
  {#each levels as level (level.zoom)}
    <button
      type="button"
      class="zoom-btn"
      class:active={value === level.zoom}
      style="font-size: {level.font}px;"
      title={level.label}
      aria-label={level.label}
      aria-pressed={value === level.zoom}
      onclick={() => (value = level.zoom)}
    >A</button>
  {/each}
</div>

<style>
  .zoom-control {
    display: flex;
    gap: 2px;
    padding: 2px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }

  .zoom-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 26px;
    line-height: 1;
    background: transparent;
    border: none;
    border-radius: var(--radius);
    color: var(--text-muted);
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .zoom-btn:hover {
    color: var(--text);
  }

  .zoom-btn.active {
    background: var(--accent);
    color: var(--accent-foreground);
  }
</style>

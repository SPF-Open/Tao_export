<script lang="ts">
  interface Props {
    title?: import('svelte').Snippet;
    options?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
  }

  let { title, options, children }: Props = $props();
</script>

<div class="element">
  <h2>
    {@render title?.()}
  </h2>
  <div class="options">
    {@render options?.()}
  </div>
  <hr>
  <div class="content">
    <div class="lefttop corner"></div>
    <div class="rightbottom corner"></div>
    {@render children?.()}
  </div>
</div>

<style>
  .element {
    box-shadow: var(--shadow);
    border-radius: var(--radius-xl);
    border: 1px solid var(--border);
    background-color: var(--surface-elevated);
    max-width: 1450px;
    padding: 0.5rem;
    margin: 0.5rem auto;
  }
  h2 {
    text-align: center;
    color: var(--text);
    margin: 0.25rem 0;
  }
  hr {
    border: none;
    border-top: 1px solid var(--border);
    margin: 0.5rem 0;
  }
  .options {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.25rem;
    flex-wrap: wrap;
    padding: 0.25rem 0;
  }
  .options :global(>*) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.25rem;
  }
  .content {
    position: relative;
    margin: 1rem auto;
    width: fit-content;
    padding: 2rem;
  }

  /* Phones: stop the content box from sizing to a wide child (e.g. the
     calendar grid) — fill the viewport instead and let the child scroll. */
  @media (max-width: 640px) {
    .content {
      width: auto;
      max-width: 100%;
      padding: 1rem;
    }
  }

  .corner {
    width: 1rem;
    height: 1rem;
    border: 2px solid var(--border-strong);
    border-right: none;
    border-bottom: none;
    position: absolute;
  }
  .lefttop {
    top: 0.5rem;
    left: 0.5rem;
  }

  .rightbottom {
    bottom: 0.5rem;
    right: 0.5rem;
    rotate: 180deg;
  }
</style>

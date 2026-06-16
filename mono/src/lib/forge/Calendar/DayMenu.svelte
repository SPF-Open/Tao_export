<script lang="ts">
  import { createBubbler, stopPropagation } from 'svelte/legacy';

  const bubble = createBubbler();
  import type { Day } from "./Calendar.helper";
  import { Button, TextArea } from "$lib/ui";

  interface Props {
    day: Day;
    onClose?: any;
    onEnter?: any;
  }

  let { day = $bindable(), onClose = () => {}, onEnter = () => {
    
  } }: Props = $props();
</script>

<div class="menu" onclick={stopPropagation(bubble('click'))} onkeypress={onEnter}>
  <label for="bg">Background</label>
  <input type="color" name="" id="bg" bind:value={day.bg} class="color-input" />
  <label for="border">Border</label>
  <input type="color" name="" id="border" bind:value={day.bd} class="color-input" />
  <label for="text">Text</label>
  <TextArea bind:value={day.text} rows={3} />
  <div class="close-row">
    <Button variant="ghost" onclick={stopPropagation(onClose)}>Close</Button>
  </div>
</div>

<style>
  .menu {
    top: 80%;
    left: 50%;
    z-index: 1;
    position: absolute;
    background-color: var(--surface-elevated);
    border: 1px solid var(--border-strong);
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 0.5rem;
    width: fit-content;
    min-width: 160px;
    padding: 0.5rem;
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
  }

  label {
    font-size: var(--font-size-base);
    color: var(--text-muted);
    white-space: nowrap;
  }

  .color-input {
    width: 2.5rem;
    height: 1.75rem;
    padding: 0.1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    cursor: pointer;
  }

  .close-row {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
    margin-top: 0.25rem;
  }
</style>

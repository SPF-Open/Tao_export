<script lang="ts">
  import { Level, errors } from "./log";
  import { slide } from "svelte/transition";

  const remove = (err: any) =>
      errors.update((errs) => errs.filter((e) => e !== err));
</script>

<div class="errors">
  {#if $errors}
      {#each $errors as error}
          <button
              class="error level-{Level[error.level] || 'unknown'}"
              transition:slide
              on:click={() => remove(error)}
          >
              {error.message}
          </button>
      {/each}
  {/if}
</div>

<style>
  button{
      border: none;
      cursor: pointer;
      width: 100%;
      text-align: left;
  }
  .errors {
      position: absolute;
      top: 0;
      right: 0;
      padding: 0;
      margin: 0;
      padding-right: 0.5rem;
  }

  .error {
      padding: 0.5rem;
      margin: 0.5rem 0;
      border-radius: 5px;
  }

  .error.level-ERROR {
      background-color: #f8d7da;
      color: #721c24;
  }

  .error.level-WARNING {
      background-color: #fff3cd;
      color: #856404;
  }

  .error.level-INFO {
      background-color: #d1ecf1;
      color: #0c5460;
  }

  .error.level-SUCCESS {
      background-color: #d4edda;
      color: #155724;
  }
</style>
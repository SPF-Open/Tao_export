<script>
  import { errors } from '../store';
</script>

{#if $errors.length > 0}
  <nav class="errors-menu">
    {#each $errors as error}
      {#if error.visible}
        <button on:click={() => (error.visible = false)}>
          <div class="title">{error.title}</div>
          <div class="message">{error.txt}</div>
        </button>
      {/if}
    {/each}
  </nav>
{/if}

<style>
  .errors-menu {
    position: absolute;
    top: 0;
    right: 0;
    background-color: #f8f8f8;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    display: grid;
    min-width: 150px;
  }

  button {
    text-align: left;
    padding: 5px;
    margin: 5px 0;
    width: 100%;
  }

  .errors-menu .title {
    font-weight: bold;
  }
  .errors-menu .message {
    font-size: 0.8em;
  }
</style>

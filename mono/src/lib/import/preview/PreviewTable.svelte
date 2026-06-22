<script lang="ts">
  import { QCM } from "../helper/question";

  export let QCMs: QCM[] = [];
</script>

<table>
  <thead>
    <tr>
      <th> Title </th>
      <th>Alt 1</th>
      <th>Alt 2</th>
      <th>Alt 3</th>
      <th>Alt 4</th>
    </tr>
  </thead>
  <tbody>
    {#each QCMs as QCM}
      <tr>
        <td>
          {QCM.prompt}
        </td>
        {#each QCM.answers as answer}
          <td class={`${answer.correct ? 'lg-green-bg' : ''}`}>{answer.prompt}</td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
  table {
    border: 1px solid var(--border-strong);
    padding: 5px;
  }
  .lg-green-bg {
    text-align: left;
    background-color: color-mix(in srgb, var(--success) 30%, var(--surface));
  }
</style>

<!-- @migration-task Error while migrating Svelte code: `<tr>` cannot be a child of `<table>`. `<table>` only allows these children: `<caption>`, `<colgroup>`, `<tbody>`, `<thead>`, `<tfoot>`, `<style>`, `<script>`, `<template>`. The browser will 'repair' the HTML (by moving, removing, or inserting elements) which breaks Svelte's assumptions about the structure of your components.
https://svelte.dev/e/node_invalid_placement -->
<!-- @migration-task Error while migrating Svelte code: `<tr>` cannot be a child of `<table>`. `<table>` only allows these children: `<caption>`, `<colgroup>`, `<tbody>`, `<thead>`, `<tfoot>`, `<style>`, `<script>`, `<template>`. The browser will 'repair' the HTML (by moving, removing, or inserting elements) which breaks Svelte's assumptions about the structure of your components.
https://svelte.dev/e/node_invalid_placement -->
<script lang="ts">
    import { QCM } from "../helper/question";

  export let QCMs: QCM[] = [];
</script>

<table>
  <tr>
    <th> Title </th>
    <th>Alt 1</th>
    <th>Alt 2</th>
    <th>Alt 3</th>
    <th>Alt 4</th>
  </tr>
  {#each QCMs as QCM}
    <tr>
      <td>
        {QCM.prompt}
      </td>
      {#each QCM.answers as answer}
        <td class={`${answer.correct ? 'lg-green-bg' : ''}`}>{answer.prompt}</td
        >
      {/each}
    </tr>
  {/each}
</table>

<style>
  table {
    border: 1px solid rgb(78, 78, 78);
    padding: 5px;
  }
  .lg-green-bg {
    text-align: left;
    background-color: rgb(135, 228, 135);
  }
</style>

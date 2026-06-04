<script lang="ts">
  import Char from "$lib/ui/Char.svelte";
  import { onMount } from "svelte";

  interface Props {
    disabled?: boolean;
    value?: string;
  }

  let { disabled = $bindable(false), value = $bindable("") }: Props = $props();

  onMount(() => {
    onChange();
  });

  const onChange = () => {
    disabled = !disabled;
    value = "";
  };
</script>

<div class="input">
  <input type="checkbox" onchange={() => onChange()} />
  <Char bind:value={value} bind:disabled />
</div>

<style>
  .input {
    display: flex;
    justify-content: space-around;
    align-items: center;
    gap: 10px;
  }
  input {
    margin: 0;
  }
</style>

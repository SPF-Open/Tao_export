<script lang="ts">
  import RadioGroup from "$lib/ui/RadioGroup.svelte";

  interface inputChoice {
    value?: string | boolean | number;
    txt: string;
    id?: string;
    selected?: boolean;
    disabled?: boolean;
  }

  interface Props {
    title?: string;
    inputChoices?: inputChoice[];
    choice: string | boolean | number;
  }

  let { title = "", inputChoices = [], choice = $bindable() }: Props = $props();

  // Map old shape to RadioGroup shape and initialise `choice` from `selected` flag
  let choices = $derived(
    inputChoices.map((i) => ({
      label: i.txt,
      value: i.value !== undefined ? i.value : i.txt,
      disabled: i.disabled,
    }))
  );

  // Set initial value from the item marked selected (runs once)
  $effect.pre(() => {
    if (choice !== undefined && choice !== "") return;
    const sel = inputChoices.find((i) => i.selected) ?? inputChoices[0];
    if (sel) choice = sel.value !== undefined ? sel.value : sel.txt;
  });
</script>

<RadioGroup legend={title} {choices} bind:value={choice} />

<script lang="ts">
  import Fieldset from "../container/Fieldset.svelte";

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

  let { title = "", inputChoices = $bindable([]), choice = $bindable() }: Props = $props();

  let findSelection = () => {
    if (inputChoices.length < 1) return;
    let select = inputChoices.find((input) => input.selected);
    inputChoices = inputChoices.map((i) => ({
      id: Math.round(Math.random() * 100) + i.txt,
      ...i,
    }));
    if (!select) select = inputChoices[0];
    const { id, txt, value } = select;
    choice = value ? value : txt ? txt : id;
  };

  findSelection();
</script>

<Fieldset {title}>
  {#each inputChoices as { id, txt, value, disabled }}
    <div class={`radio ${disabled ? "disabled" : ""}`}>
      <input
        type="radio"
        name={id}
        id={id ? id : txt}
        value={value ? value : txt ? txt : id}
        bind:group={choice}
        {disabled}
      />
      <label for={id ? id : txt}>{txt}</label>
    </div>
  {/each}
</Fieldset>

<style>
  .radio {
    display: inline-flex;
    align-items: center;
    user-select: none;
  }
  input {
    margin-top: 0;
    margin-right: 0px;
    height: 10px;
    width: 10px;
    cursor: pointer;
    appearance: none;
    border-radius: 50%;
    border: 6px solid #d9d9d9;
    transition: 0.3s;
  }
  input:checked {
    border: 6px solid var(--primary-color);
  }

  input:focus {
    outline: none;
  }

  .disabled > * {
    color: #d9d9d9;
    cursor: not-allowed;
  }
  label {
    font-size: var(--font-size-md);
    cursor: pointer;
    padding-left: 4px;
    margin-top: -2px;
  }
</style>

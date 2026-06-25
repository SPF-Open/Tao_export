<script lang="ts">
  import { writable } from "svelte/store";
  import type { Writable } from "svelte/store";

  import { Day, Size, formatedDate, weekOfTheDay } from "./Calendar.helper";
  import DayMenu from "./DayMenu.svelte";
  import { lang } from "../store";
  import Element from "../Element.svelte";
  import { Button, Combobox, Numeric, Switch, TextInput } from "$lib/ui";

  
  interface Props {
    // Stores
    date?: Writable<Date>;
    dateString?: Writable<string>;
  }

  let { date = writable(new Date()), dateString = writable("") }: Props = $props();

  // Construction
  let days: Day[] = $state([]);
  let rows = $derived(Math.floor(days.length / 7));

  // Options
  let size = $state<string>(Size.md);
  let yearOffset = $state(0);
  let showNonCurrentMonth = $state(false);

  // When we update the date with datepicker
  $effect(() => {
    return dateString.subscribe((d: string) => {
      const dateStringTemp = $date.toISOString().split("T")[0];
      if (d && dateStringTemp !== $dateString) {
        date.update(() => new Date(d));
      }
    });
  });

  $effect(() => {
    return date.subscribe((d: Date) => {
      const dateStringTemp = $date.toISOString().split("T")[0];
      if (dateStringTemp !== $dateString) {
        dateString.update(() => dateStringTemp);
        console.log(dateStringTemp);
      }
      days = Day.from(d);
    });
  });

  const changeMonth = (offset: number) => {
    date.update((d: Date) => new Date(d.getFullYear(), d.getMonth() + offset, 15));
  };

  const onDayClick = (day: Day, force = true) => {
    if (force) days.map((d) => (d.menu = false));
    day.menu = !day.menu;
    days = [...days];
  };
</script>

<Element>
  {#snippet title()}
    <span >Calendar</span>
  {/snippet}
  {#snippet options()}
  
      <nav>
        <Button variant="secondary" onclick={() => changeMonth(-1)}>Previous</Button>
        <Button variant="secondary" onclick={() => changeMonth(+1)}>Next</Button>
      </nav>
      <TextInput type="date" bind:value={$dateString} />
      <Combobox
        legend="Size"
        choices={[
          { label: "Small", value: Size.sm },
          { label: "Medium", value: Size.md },
          { label: "Large", value: Size.lg },
        ]}
        bind:value={size}
      />
      <div class="option-row">
        <label for="offset">Offset</label>
        <Numeric name="offset" bind:value={yearOffset} size="sm" />
      </div>
      <div class="option-row">
        <span>Non-current month</span>
        <Switch bind:checked={showNonCurrentMonth} />
      </div>
    
  {/snippet}
  {#snippet children()}
  
      <h2 class="date">
        {formatedDate($date, $lang)}{yearOffset
          ? (yearOffset > 0 ? "+" : "") + yearOffset
          : ""}
      </h2>
      <div class="grid" style="--nbRow:{rows}}">
        {#each weekOfTheDay[$lang] as day}
          <div class="weekday cell {size}">{day}</div>
        {/each}
        {#each days as day}
          <div
            class="day cell {size}"
            class:currentMonth={day.isCurrentMonth || showNonCurrentMonth}
            role="button"
            tabindex="0"
            onclick={() => onDayClick(day)}
            onkeydown={(event) => {
              if (event.key === "Enter" || event.key === " ") onDayClick(day);
            }}
            style="background:{day.bg};"
          >
            <div class="innerCell" style="border-color:{day.bd}">
              <span> {day.day}</span>
              <span>{day.text}</span>
            </div>
            {#if day.menu && (day.isCurrentMonth || showNonCurrentMonth)}
              <DayMenu {day} onClose={() => onDayClick(day, false)} />
            {/if}
          </div>
        {/each}
      </div>
    
  {/snippet}
</Element>


<style>
  .date {
    margin: 0.2rem;
    font-size: 2rem;
    text-align: center;
    color: var(--text);
  }

  .option-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--font-size-base);
    color: var(--text-muted);
  }

  .grid {
    --bd: var(--border);
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(var(--rows), 1fr);
    border-radius: var(--radius-lg);
    position: relative;
    box-shadow: var(--shadow);
    border: 1px solid var(--bd);
    width: fit-content;
    margin: 0 auto;
    overflow: hidden;
    background: var(--surface-elevated);
  }

  .weekday {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
    background: var(--surface);
    padding: 0.5rem 0;
    min-height: 0;
  }

  .cell.sm {
    width: 6rem;
  }

  .cell.md {
    width: 8rem;
  }

  .cell.lg {
    width: 10rem;
  }

  .cell:last-child,
  .cell:last-child > * {
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  }

  .cell:nth-last-child(7),
  .cell:nth-last-child(7) > * {
    border-radius: 0 0 0 var(--radius-lg);
  }

  .cell:nth-child(7n) {
    border-right: 1px solid transparent;
  }

  .cell:nth-last-child(-n + 7) {
    border-bottom: 1px solid transparent;
  }

  .cell {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    border-right: 1px solid var(--bd);
    border-bottom: 1px solid var(--bd);
    font-weight: bold;
    color: var(--text-muted);
    transition: box-shadow 150ms ease, color 150ms ease;
  }

  .day.currentMonth {
    cursor: pointer;
  }

  .day.currentMonth:hover {
    box-shadow: inset 0 0 0 2px rgba(var(--brand-rgb), 0.5);
    color: var(--text);
    z-index: 1;
  }

  .innerCell {
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    border: 10px solid transparent;
    box-sizing: border-box;
    -moz-box-sizing: border-box;
    -webkit-box-sizing: border-box;
  }

  .day {
    text-align: center;
    color: var(--text-muted);
  }

  .currentMonth {
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--text);
  }

</style>

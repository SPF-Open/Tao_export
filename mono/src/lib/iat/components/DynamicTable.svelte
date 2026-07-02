<script lang="ts">
  import {
    Button,
    Card,
    Combobox,
    Modal,
    Numeric,
    Switch,
    TextArea,
    Tooltip,
  } from "$lib/ui";
  import { Search } from "lucide-svelte";
  import type { Alternative, PageInfo, Question } from "$lib/iat/store";
  import { visibleColumns, colorRules } from "./DynamicTable";
  import { read, utils, write } from "xlsx";
  import { file } from "$lib/iat/store";
  import { onMount } from "svelte";

  let { pagesData }: { pagesData: Record<number, PageInfo> } = $props();

  // One table row: a question enriched with its page-level stats plus the
  // user annotations edited in the detail modal (exported with the sheet).
  type TableRow = Question & {
    instruction: boolean;
    duration_mean: number;
    duration_sd: number;
    extraInfo?: string;
    action?: string;
  };

  // Define the structure of a column (excluding alternatives)
  type Column = {
    id: keyof TableRow & string;
    label: string;
    tooltip?: string;
    renderer: (row: TableRow) => string | number;
  };

  // Configure your columns here (the renderer formats the cell value)
  let columns: Column[] = [
    { id: "page", label: "Page", renderer: (row) => row.page || "" },
    { id: "itemRank", label: "Item", renderer: (row) => row.itemRank || "" },
    {
      id: "instruction",
      label: "Instruction",
      renderer: (row) => (row.instruction ? "true" : ""),
    },
    {
      id: "duration_mean",
      label: "Mean",
      renderer: (row) => {
        try {
          return row.duration_mean.toFixed(2) + "s";
        } catch {
          return "";
        }
      },
    },
    {
      id: "duration_sd",
      label: "SD",
      renderer: (row) => {
        try {
          return row.duration_sd.toFixed(2) + "s";
        } catch {
          return "";
        }
      },
    },
    {
      id: "testCode",
      label: "Test Code",
      renderer: (row) => row.testCode || "",
    },
    { id: "diplome", label: "Diploma", renderer: (row) => row.diplome || "" },
    {
      id: "nCandidates",
      label: "Total",
      renderer: (row) => row.nCandidates || "",
    },
    {
      id: "correct_pct",
      label: "Correct %",
      renderer: (row) => {
        try {
          return row.correct_pct.toFixed(2) + "%";
        } catch {
          return "";
        }
      },
    },
    {
      id: "incorrect_pct",
      label: "Incorrect %",
      renderer: (row) => {
        try {
          return row.incorrect_pct.toFixed(2) + "%";
        } catch {
          return "";
        }
      },
    },
    {
      id: "empty_pct",
      label: "Empty %",
      renderer: (row) => {
        try {
          return row.empty_pct.toFixed(2) + "%";
        } catch {
          return "";
        }
      },
    },
    {
      id: "not_seen_pct",
      label: "Not Seen %",
      renderer: (row) => {
        try {
          return row.not_seen_pct.toFixed(2) + "%";
        } catch {
          return "";
        }
      },
    },
    {
      id: "answered_pct",
      label: "Answered %",
      renderer: (row) => {
        try {
          return row.answered_pct.toFixed(2) + "%";
        } catch {
          return "";
        }
      },
    },
    {
      id: "difficulty",
      label: "Difficulty",
      renderer: (row) => {
        try {
          return row.difficulty.toFixed(4);
        } catch {
          return "";
        }
      },
    },
    {
      id: "discr_comp",
      label: "Discr Comp",
      renderer: (row) => {
        try {
          return row.discr_comp.toFixed(4);
        } catch {
          return "";
        }
      },
    },
    {
      id: "discr_test",
      label: "Discr Test",
      renderer: (row) => {
        try {
          return row.discr_test.toFixed(4);
        } catch {
          return "";
        }
      },
    },
    {
      id: "d_index_comp",
      label: "D-Index Comp",
      renderer: (row) => {
        try {
          return row.d_index_comp.toFixed(4);
        } catch {
          return "";
        }
      },
    },
    {
      id: "d_index_test",
      label: "D-Index Test",
      renderer: (row) => {
        try {
          return row.d_index_test.toFixed(4);
        } catch {
          return "";
        }
      },
    },
  ];

  // Toggle for the alternatives column(s)
  let showAlternatives = $state(true);

  // Control to show or hide the column toggle menu
  let showToggleMenu = $state(false);

  // Define groups with associated column IDs
  const groups = [
    { label: "Duration", ids: ["duration_mean", "duration_sd"] },
    { label: "Candidats", ids: ["diplome", "nCandidates"] },
    { label: "Difficulty", ids: ["correct_pct", "incorrect_pct"] },
    {
      label: "Abstentions",
      ids: ["empty_pct", "not_seen_pct", "answered_pct"],
    },
    {
      label: "Indices",
      ids: [
        "difficulty",
        "discr_comp",
        "discr_test",
        "d_index_comp",
        "d_index_test",
      ],
    },
  ];

  // Create a set of all grouped column IDs
  const groupedIds = new Set(groups.flatMap((group) => group.ids));

  // Non-grouped columns are those not part of any group
  const nonGroupColumns = columns.filter((col) => !groupedIds.has(col.id));

  // Mapping from column id to column object
  let colMap: Record<string, Column> = {};
  columns.forEach((col) => {
    colMap[col.id] = col;
  });

  let rows = $state<TableRow[] | null>(null);

  // Flatten page data for table display
  onMount(() => {
    rows = Object.values(pagesData).flatMap((page) =>
      page.questions.map((question) => ({
        ...question,
        // Ensure to add page-level data so the renderer functions work
        page: page.page ?? "",
        instruction: page.instruction,
        duration_mean: page.duration.mean,
        duration_sd: page.duration.sd,
      }))
    );
  });

  // Helper function to determine if a column is the last visible in its group
  function getGroupBorderClass(colId: string): string {
    for (const group of groups) {
      if (group.ids.includes(colId)) {
        const visibleGroupCols = group.ids.filter((id) => $visibleColumns[id]);
        if (
          visibleGroupCols.length &&
          visibleGroupCols[visibleGroupCols.length - 1] === colId
        ) {
          return "group-border";
        }
        return "";
      }
    }
    return "group-border";
  }

  // Helper function to apply color rules if defined and cell value is numeric.
  function getColorClass(colId: string, cellValue: unknown): string {
    const rule = colorRules[colId];
    if (rule && typeof cellValue === "number") {
      if (cellValue < rule.max && cellValue >= rule.min) return rule.inClass;
      if (cellValue < rule.min) return rule.belowClass;
      if (cellValue > rule.max) return rule.aboveClass;
      return "";
    }
    return "";
  }

  // Configurable thresholds for alternative heat mapping
  let altThresholdHigh: number = $state(10);
  let altThresholdMedium: number = $state(5);
  let altThresholdLow: number = $state(10);

  // Refactored heat map function for alternatives with configurable thresholds
  function getAltHeatClass(
    row: TableRow,
    alt: { pct: number; isCorrect: boolean }
  ): string {
    const correctAlt = row.alternatives.find((a: Alternative) => a.isCorrect);
    const correctPct = correctAlt ? correctAlt.pct : 0;
    if (!alt.isCorrect) {
      const diff = alt.pct - correctPct;
      if (diff > altThresholdHigh) return "heat-high"; // significantly more chosen → red
      if (diff > altThresholdMedium) return "heat-medium"; // moderately more chosen → orange
      if (alt.pct < altThresholdLow) return "heat-cold"; // almost never chosen → "cold" (blue)
    }
    return "";
  }

  let showModal = $state(false);
  let selectedRow: TableRow | null = $state(null);

  function openModal(row: TableRow) {
    selectedRow = row;
    showModal = true;
  }

  // New export function to add a new sheet with table rows to the original workbook
  async function exportToExcel() {
    if (!$file || !rows) {
      alert("No original file available for export.");
      return;
    }
    const arrayBuffer = await $file.arrayBuffer();
    const workbook = read(arrayBuffer, { type: "array" });

    // Create a new sheet from table rows
    const newSheet = utils.json_to_sheet(rows);
    const sheetName = "Analysis";
    workbook.SheetNames.push(sheetName);
    workbook.Sheets[sheetName] = newSheet;

    const wbout = write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exported.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="hide-print">
  <Card>
    {#snippet title()}
      <Button variant="info" onclick={() => (showToggleMenu = !showToggleMenu)}>
        {showToggleMenu ? "Hide Columns" : "Show Columns"}
      </Button>
      <div class="threshold-row">
        <div class="threshold-item">
          <Tooltip tip="Threshold above which an incorrect alt is flagged red">
            <span class="threshold-label">High</span>
          </Tooltip>
          <Numeric bind:value={altThresholdHigh} size="sm" />
        </div>
        <div class="threshold-item">
          <Tooltip tip="Threshold above which an incorrect alt is flagged orange">
            <span class="threshold-label">Medium</span>
          </Tooltip>
          <Numeric bind:value={altThresholdMedium} size="sm" />
        </div>
        <div class="threshold-item">
          <Tooltip tip="Below this % an alt is flagged blue (cold)">
            <span class="threshold-label">Low</span>
          </Tooltip>
          <Numeric bind:value={altThresholdLow} size="sm" />
        </div>
      </div>
      <Button variant="success" onclick={exportToExcel}>Export Table</Button>
    {/snippet}
    {#if showToggleMenu}
      <div class="toggle-menu">
        <div class="switches">
          {#each Object.keys($visibleColumns) as colId}
            <label class="switch-label">
              <Switch bind:checked={$visibleColumns[colId]} />
              <span>{colId}</span>
            </label>
          {/each}
          <label class="switch-label">
            <Switch bind:checked={showAlternatives} />
            <span>Alternatives</span>
          </label>
        </div>
      </div>
    {/if}
  </Card>
</div>

<div class="table-wrap">
  <table class="data-table">
    <thead>
      <!-- First header row: non-group columns and group headers -->
      <tr>
        {#each nonGroupColumns as col}
          {#if $visibleColumns[col.id]}
            <th rowspan="2" class="group-border"
              >{col.label}
              {#if col.tooltip}
                <Tooltip>{col.tooltip}</Tooltip>
              {/if}
            </th>
          {/if}
        {/each}
        {#each groups as group}
          {@const visibleCount = group.ids.filter(
            (id) => $visibleColumns[id]
          ).length}
          {#if visibleCount > 0}
            <th colspan={visibleCount} class="txt-center group-header"
              >{group.label}</th
            >
          {/if}
        {/each}
        {#if showAlternatives}
          <th rowspan="1" colspan="4" class="txt-center">Alternatives</th>
        {/if}
        <th rowspan="2" class="hide-print"></th>
      </tr>
      <!-- Second header row: individual headers for grouped columns -->
      <tr>
        {#each groups as group}
          {#each group.ids as colId}
            {#if $visibleColumns[colId]}
              <th class={getGroupBorderClass(colId)}>
                {colMap[colId].label}
                {#if colMap[colId].tooltip}
                  <Tooltip>{colMap[colId].tooltip}</Tooltip>
                {/if}
              </th>
            {/if}
          {/each}
        {/each}
        {#if showAlternatives}
          <th class="txt-center"> Correct </th>
          <th class="txt-center">B</th>
          <th class="txt-center">C</th>
          <th class="txt-center">D</th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#each rows as row}
        <tr>
          {#each columns as col}
            {#if $visibleColumns[col.id]}
              <td
                class="{getColorClass(
                  col.id,
                  row[col.id]
                )} {getGroupBorderClass(col.id)}"
              >
                {col.renderer(row)}
              </td>
            {/if}
          {/each}
          {#if showAlternatives}
            {#each row.alternatives as alt}
              <td
                class={getAltHeatClass(row, alt)}
                style="width: {alt.isCorrect ? '34%' : '22%'}"
              >
                <span class="text-right" class:correct={alt.isCorrect}>
                  {alt.pct.toFixed(2)}%
                </span>
              </td>
            {/each}
            <td class="hide-print">
              <Button variant="ghost" onclick={() => openModal(row)}>
                <Search size={15} />
              </Button>
            </td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

{#if showModal && selectedRow}
  {@const row = selectedRow}
  <Modal bind:open={showModal} size="xl">
    {#snippet title()}
      Details for item: {row.itemRank}
    {/snippet}
    <div class="modal-content">
      <div class="alt-cards">
        {#each row.alternatives as alt, index}
          <Card status={alt.isCorrect ? "success" : undefined}>
            {#snippet title()}
              <span>Alternative {index + 1}</span>
              <span class="alt-pct">{alt.pct.toFixed(2)}%</span>
            {/snippet}
            {alt.text}
          </Card>
        {/each}
      </div>
    </div>
    {#snippet footer()}
      <div class="modal-actions">
        <TextArea
          disabled
          rows={4}
          placeholder="Additional info"
          bind:value={row.extraInfo}
        />
        <div class="modal-action-row">
          <Combobox
            legend="Action"
            choices={[
              { label: "Archiver", value: "archive" },
              { label: "Modifier la bonne réponse", value: "change" },
              { label: "Supprimer", value: "delete" },
              { label: "Autre", value: "other" },
            ]}
            bind:value={row.action}
          />
          <Button variant="danger" onclick={() => (showModal = false)}>Cancel</Button>
          <Button variant="success" disabled>Save</Button>
        </div>
      </div>
    {/snippet}
  </Modal>
{/if}

<style>
  /* Heat map colours using CSS vars */
  .red    { background-color: color-mix(in srgb, var(--danger) 15%, transparent); }
  .orange { background-color: color-mix(in srgb, var(--warning) 20%, transparent); }
  .green  { background-color: color-mix(in srgb, var(--success) 15%, transparent); }

  .correct { font-weight: 700; }

  /* Table */
  .table-wrap {
    overflow-x: auto;
    max-width: 100%;
    -webkit-overflow-scrolling: touch;
  }

  .data-table {
    border-collapse: collapse;
    width: 100%;
    background-color: var(--surface-elevated);
  }

  th, td {
    white-space: nowrap;
    font-size: 0.8rem;
    padding: 0.4em 0.6em;
    text-align: left;
    border: 1px solid var(--border);
    color: var(--text);
  }

  td { text-align: right; }

  .txt-center { text-align: center !important; }

  .group-header,
  .group-border { border-right: 2px solid var(--border-strong); }

  thead th {
    background-color: var(--surface);
    font-weight: 600;
    color: var(--text-muted);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  tbody tr:hover { background-color: var(--surface); }

  /* Toggle menu */
  .toggle-menu {
    padding: 0.75rem 0 0.25rem;
    border-top: 1px solid var(--border);
    margin-top: 0.5rem;
  }

  .switches {
    display: grid;
    grid-template-columns: repeat(5, auto);
    gap: 0.4rem 0.75rem;
  }

  @media (max-width: 640px) {
    .switches {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    }
  }

  .switch-label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--font-size-base);
    color: var(--text);
    cursor: pointer;
    user-select: none;
    width: fit-content;
  }

  /* Toolbar */
  .threshold-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .threshold-item {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .threshold-label {
    font-size: var(--font-size-base);
    color: var(--text-muted);
    white-space: nowrap;
  }

  /* Alternative heat colours */
  .heat-high { background-color: color-mix(in srgb, var(--danger)  20%, transparent); }
  .heat-medium { background-color: color-mix(in srgb, var(--warning) 25%, transparent); }
  .heat-cold { background-color: color-mix(in srgb, var(--primary)  15%, transparent); }

  /* Modal */
  .modal-content {
    max-height: 60vh;
    overflow-y: auto;
  }

  .alt-cards {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .alt-cards > :global(*) {
    flex: 1;
    min-width: 180px;
  }

  .alt-pct {
    font-size: 12px;
    font-weight: 400;
    color: var(--text-muted);
  }

  .modal-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .modal-action-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
</style>

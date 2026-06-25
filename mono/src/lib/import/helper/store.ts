import { derived, writable } from 'svelte/store';
import type { WorkBook } from 'xlsx';

export enum TemplateColumn {
  FIN = 'FIN',
  OLD_BOSA = 'OLD_BOSA',
  OLD_FIN = 'OLD_FIN',
  OTHER = 'OTHER',
}

export const templateList = Object.values(TemplateColumn).map((v, i) => ({
  txt: v,
  selected: i === 0,
  value: v,
}));

export type BindingTemplateDef = {
  column: {
    title: string | undefined,
    prompt: string | undefined,
    correct?: string | undefined,
    // Optional metadata columns (empty string = no default for this template).
    competency?: string,
    indicator?: string,
    competencyDescr?: string,
    masteryDescr?: string,
  },
  row: {
    offset: number,
    alternative: number,
    skipRow: number,
  },
};

export const bindingTemplate: Record<TemplateColumn, BindingTemplateDef> = {
  [TemplateColumn.FIN]: {
    column: {
      title: 'G',
      prompt: 'H',
      correct: "",
      competency: 'C',
      competencyDescr: 'D',
      masteryDescr: 'E',
      indicator: 'F',
    },
    row: {
      offset: 17,
      alternative: 4,
      skipRow: 0,
    },
  },
  [TemplateColumn.OLD_BOSA]: {
    column: {
      title: 'F',
      prompt: 'H',
      correct: 'I',
      competency: '',
      indicator: '',
      competencyDescr: '',
      masteryDescr: '',
    },
    row: {
      offset: 16,
      alternative: 4,
      skipRow: 0,
    },
  },
  [TemplateColumn.OLD_FIN]: {
    column: {
      title: 'D',
      prompt: 'F',
      correct: 'G',
      competency: '',
      indicator: '',
      competencyDescr: '',
      masteryDescr: '',
    },
    row: {
      offset: 7,
      alternative: 4,
      skipRow: 0,
    },
  },
  [TemplateColumn.OTHER]: {
    // Remains unchanged or can be adjusted as needed.
    column: {
      title: '',
      prompt: '',
      correct: '',
    },
    row: {
      offset: 0,
      alternative: 0,
      skipRow: 0,
    },
  },
};

// file input
export const file = writable<File | null>(null);
export const name = writable('TAO');
export const workbook = writable<null | WorkBook>(null);

// Menu
export const currentSheet = writable<string>('');
export const selectedFormat = writable('CSV');
export const hideAnswer = writable(false);
export const langOutput = writable('FR');

// Column
export const followTemplate = writable<TemplateColumn>(TemplateColumn.FIN);
export const titleColumn = writable("");
export const promptColumn = writable("");
export const correctColumn = writable("");

export const competencyColumn = writable("");
export const indicatorColumn = writable("");

export const competencyDescrColumn = writable("");
export const masteryDescrColumn = writable("");

// Row
export const rowOffset = writable(7);
export const alternative = writable(4);
export const skipRow = writable(0);

// Detect any change to template change
followTemplate.subscribe((value) => {
  const v = bindingTemplate[value]
  if (value === TemplateColumn.OTHER) return;
  titleColumn.set(v.column.title ?? "");
  promptColumn.set(v.column.prompt ?? "");
  correctColumn.set(v.column.correct ?? "");
  competencyColumn.set(v.column.competency ?? "");
  indicatorColumn.set(v.column.indicator ?? "");
  competencyDescrColumn.set(v.column.competencyDescr ?? "");
  masteryDescrColumn.set(v.column.masteryDescr ?? "");
  rowOffset.set(v.row.offset);
  alternative.set(v.row.alternative);
  skipRow.set(v.row.skipRow);
});

// Detect any change to column/row event
export const column_row = derived(
  [titleColumn, promptColumn, correctColumn, rowOffset, alternative],
  ([$titleColumn, $promptColumn, $correctColumn, $rowOffset, $alternative]) => [
    $titleColumn,
    $promptColumn,
    $correctColumn,
    $rowOffset,
    $alternative
  ],
);

// Pdf
export const TaoPreviewBind = writable();

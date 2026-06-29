// NOTE: The /audit route no longer uses this config — it parses Excel via the
// Import pipeline (`fromExcel.ts` + `bindingTemplate`). These `ExcelConfig`
// presets remain in use by library ingest (`lib/library/parse/ingestFromExcel.ts`)
// and the Excel adapter (`lib/questions/adapters/excel.ts`).
import type { ExcelConfig } from './types';

export const DEFAULT_CONFIG: ExcelConfig = {
  rowOffset: 12,
  alternativeCount: 4,
  skipRows: 1,
  answerLayout: 'same_column',
  ignoreTitleMismatch: true,
  columns: {
    title: 'E',
    prompt: 'F',
    answers: 'F',
    answerMarker: 'G',
    competency: 'A',
    dimension: 'B',
    indicator: 'C',
  },
};

export const PRESET_CONFIGS: Record<string, ExcelConfig> = {
  Bosa: DEFAULT_CONFIG,
  OLD_Fin: {
    ...DEFAULT_CONFIG,
    skipRows: 0,
  },
};

export function validateConfig(config: ExcelConfig): string[] {
  const errors: string[] = [];

  if (config.rowOffset < 0) {
    errors.push('Row offset must be >= 0');
  }

  if (config.alternativeCount < 1 || config.alternativeCount > 26) {
    errors.push('Alternative count must be between 1 and 26');
  }

  if (config.skipRows < 0) {
    errors.push('Skip rows must be >= 0');
  }

  if (!config.columns.prompt) {
    errors.push('Prompt column is required');
  }

  if (!config.columns.answers) {
    errors.push('Answer column(s) required');
  }

  // If spread_columns layout, answers must be array
  if (config.answerLayout === 'spread_columns') {
    if (!Array.isArray(config.columns.answers)) {
      errors.push('For spread_columns layout, answers must be an array of columns');
    } else if ((config.columns.answers as string[]).length !== config.alternativeCount) {
      errors.push(
        `Answer columns length (${(config.columns.answers as string[]).length}) must match alternative count (${config.alternativeCount})`
      );
    }
  }

  // If same_column layout, answers must be string
  if (config.answerLayout === 'same_column') {
    if (typeof config.columns.answers !== 'string') {
      errors.push('For same_column layout, answers must be a single column letter');
    }
  }

  return errors;
}

export function serializeConfig(config: ExcelConfig): string {
  return JSON.stringify(config);
}

export function deserializeConfig(json: string): ExcelConfig {
  try {
    const parsed = JSON.parse(json);
    // Ensure answerLayout is set for backwards compatibility
    if (!parsed.answerLayout) {
      parsed.answerLayout = Array.isArray(parsed.columns?.answers) ? 'spread_columns' : 'same_column';
    }
    return parsed;
  } catch {
    console.warn('Failed to deserialize config, using default');
    return DEFAULT_CONFIG;
  }
}

export function configToCSV(config: ExcelConfig): string {
  const answerDisplay = Array.isArray(config.columns.answers)
    ? (config.columns.answers as string[]).join(', ')
    : config.columns.answers;

  const lines = [
    `Row Offset,${config.rowOffset}`,
    `Alternative Count,${config.alternativeCount}`,
    `Skip Rows,${config.skipRows}`,
    `Answer Layout,${config.answerLayout}`,
    `Title Column,${config.columns.title || 'N/A'}`,
    `Prompt Column,${config.columns.prompt}`,
    `Answer Columns,"${answerDisplay}"`,
  ];

  if (config.answerLayout === 'same_column' && config.columns.answerMarker) {
    lines.push(`Answer Marker Column,${config.columns.answerMarker}`);
  }

  lines.push(`Competency Column,${config.columns.competency || 'N/A'}`);
  lines.push(`Dimension Column,${config.columns.dimension || 'N/A'}`);
  lines.push(`Indicator Column,${config.columns.indicator || 'N/A'}`);

  return lines.join('\n');
}

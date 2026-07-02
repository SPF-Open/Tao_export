import * as XLSX from 'xlsx';
import type { ExcelConfig, ExcelQuestion } from './types';

/**
 * Get list of available sheet names from Excel file
 * @param buffer - File buffer from upload
 * @returns Array of sheet names
 */
export function getExcelSheets(buffer: ArrayBuffer): string[] {
  try {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    return wb.SheetNames;
  } catch (error) {
    console.error('Failed to read Excel sheets:', error);
    return [];
  }
}

/**
 * Parse Excel file with configurable structure
 * @param buffer - File buffer from upload
 * @param config - Excel structure configuration
 * @param sheetName - Name of sheet to parse (default: first sheet)
 * @returns Array of parsed questions
 */
export async function parseExcel(
  buffer: ArrayBuffer,
  config: ExcelConfig,
  sheetName?: string
): Promise<ExcelQuestion[]> {
  try {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const selectedSheet = sheetName || wb.SheetNames[0];

    if (!selectedSheet) {
      throw new Error('No sheets found in Excel file');
    }

    const sheet = wb.Sheets[selectedSheet];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 'A' });

    if (!rows || rows.length === 0) {
      throw new Error('No data found in Excel sheet');
    }


    const questions = extractQuestions(rows as Record<string, any>[], config);
    
    
    return questions;
  } catch (error) {
    throw new Error(`Failed to parse Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function extractQuestions(rows: Record<string, any>[], config: ExcelConfig): ExcelQuestion[] {
  const questions: ExcelQuestion[] = [];
  let rowIndex = config.rowOffset;

  while (rowIndex < rows.length) {
    const row = rows[rowIndex];

    // Skip empty rows
    if (!row || Object.keys(row).length === 0) {
      rowIndex += 1 + config.skipRows;
      continue;
    }

    // Skip rows that don't have prompt data
    const prompt = normalizeCell(row[config.columns.prompt]);
    if (!prompt || prompt.trim().length === 0) {
      rowIndex += 1 + config.skipRows;
      continue;
    }

    try {
      const { answers, correctAnswerIndex } = extractAnswers(rows, rowIndex, config);

      if (answers.length === 0) {
        rowIndex += 1 + config.skipRows;
        continue;
      }

      const question: ExcelQuestion = {
        rowIndex,
        title: config.columns.title ? normalizeCell(row[config.columns.title]) : undefined,
        prompt,
        answers,
        correctAnswerIndex,
        competency: config.columns.competency
          ? normalizeCell(row[config.columns.competency])
          : undefined,
        dimension: config.columns.dimension
          ? normalizeCell(row[config.columns.dimension])
          : undefined,
        indicator: config.columns.indicator
          ? normalizeCell(row[config.columns.indicator])
          : undefined,
        metadata: {
          excelRow: rowIndex + 1, // 1-based for display
          sheetName: 'Sheet1',
        },
      };

      questions.push(question);

      // For same_column layout, skip past all the answer rows we just read
      if (config.answerLayout === 'same_column') {
        rowIndex += answers.length + config.skipRows;
      } else {
        rowIndex += 1 + config.skipRows;
      }
    } catch (error) {
      console.warn(`Error parsing row ${rowIndex}:`, error);
      rowIndex += 1 + config.skipRows;
    }
  }

  return questions;
}

function extractAnswers(
  rows: Record<string, any>[],
  promptRowIndex: number,
  config: ExcelConfig
): { answers: string[]; correctAnswerIndex: number } {
  const answers: string[] = [];
  let correctAnswerIndex = 0; // Default: first answer is correct

  if (config.answerLayout === 'spread_columns') {
    // Original behavior: answers are in separate columns on the same row
    const row = rows[promptRowIndex];
    const answerCols = config.columns.answers as string[];

    for (const answerCol of answerCols) {
      const answer = normalizeCell(row[answerCol]);
      if (answer) {
        answers.push(answer);
      }
    }
  } else if (config.answerLayout === 'same_column') {
    // New behavior: answers are in subsequent rows of the same column
    const answerCol = config.columns.answers as string;
    const markerCol = config.columns.answerMarker;
    let answerRowIndex = promptRowIndex + 1;
    let answerCount = 0;

    while (answerCount < config.alternativeCount && answerRowIndex < rows.length) {
      const answerRow = rows[answerRowIndex];

      if (!answerRow) {
        break;
      }

      const answer = normalizeCell(answerRow[answerCol]);

      if (!answer || answer.trim().length === 0) {
        break; // Stop at empty cell
      }

      answers.push(answer);

      // Check for answer marker (X/x) to identify correct answer
      if (markerCol) {
        const marker = normalizeCell(answerRow[markerCol]);
        if (marker && (marker.toUpperCase() === 'X' || marker.toUpperCase() === 'OUI')) {
          correctAnswerIndex = answerCount;
        }
      }

      answerCount++;
      answerRowIndex++;
    }
  }

  return { answers, correctAnswerIndex };
}

function normalizeCell(cell: any): string {
  if (cell === null || cell === undefined) {
    return '';
  }

  if (typeof cell === 'string') {
    return cell.trim();
  }

  if (typeof cell === 'number') {
    return String(cell);
  }

  return String(cell).trim();
}

/**
 * Detect Excel structure by analyzing sample rows
 * Useful for auto-configuration
 */
export function detectExcelStructure(
  rows: Record<string, any>[],
  maxRows: number = 50
): Partial<ExcelConfig> | null {
  // This is a simplified version - in production you'd do more sophisticated analysis
  const analysisRows = rows.slice(0, maxRows);

  // Find potential column positions by looking for patterns
  const columnStats: Record<string, number> = {};

  for (const row of analysisRows) {
    for (const [col, value] of Object.entries(row)) {
      if (value && typeof value === 'string' && value.trim().length > 0) {
        columnStats[col] = (columnStats[col] || 0) + 1;
      }
    }
  }

  // Find the most populated columns
  const sortedCols = Object.entries(columnStats)
    .sort(([, a], [, b]) => b - a)
    .map(([col]) => col);

  if (sortedCols.length < 2) {
    return null;
  }

  return {
    answerLayout: 'spread_columns',
    columns: {
      title: sortedCols[0],
      prompt: sortedCols[1],
      answers: sortedCols.slice(2, 6), // Up to 4 answer columns
    },
  };
}

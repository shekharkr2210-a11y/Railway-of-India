import { z } from 'zod';

export interface CsvParseOptions<T> {
  delimiter?: string;
  columnMapping?: Record<string, keyof T>;
  transform?: (row: Record<string, any>) => Partial<T>;
  skipEmptyLines?: boolean;
}

export interface CsvParseResult<T> {
  data: T[];
  errors: { row: number; error: string; data?: any }[];
  validCount: number;
  errorCount: number;
}

export function parseCSV<T>(csvText: string, options: CsvParseOptions<T> = {}): CsvParseResult<T> {
  const {
    delimiter = ',',
    columnMapping = {},
    transform,
    skipEmptyLines = true
  } = options;

  const result: CsvParseResult<T> = {
    data: [],
    errors: [],
    validCount: 0,
    errorCount: 0
  };

  if (!csvText || csvText.trim() === '') {
    return result;
  }

  const lines = parseCSVLines(csvText, delimiter);
  if (lines.length < 2) {
    return result;
  }

  const headers = lines[0].map(h => h.trim());

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i];
    
    if (skipEmptyLines && values.length === 1 && values[0].trim() === '') {
      continue;
    }

    if (values.length !== headers.length) {
      result.errors.push({
        row: i + 1,
        error: `Expected ${headers.length} columns, but got ${values.length}`,
        data: values
      });
      result.errorCount++;
      continue;
    }

    const rowObj: Record<string, any> = {};
    for (let j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = values[j].trim();
    }

    try {
      const mappedObj: Record<string, any> = {};
      
      for (const [csvCol, internalCol] of Object.entries(columnMapping)) {
        if (rowObj[csvCol] !== undefined) {
          mappedObj[internalCol as string] = rowObj[csvCol];
        }
      }

      for (const [csvCol, val] of Object.entries(rowObj)) {
        if (!Object.keys(columnMapping).includes(csvCol)) {
          mappedObj[csvCol] = val;
        }
      }

      const finalObj = transform ? { ...mappedObj, ...transform(mappedObj) } : mappedObj;
      result.data.push(finalObj as T);
      result.validCount++;
    } catch (err) {
      result.errors.push({
        row: i + 1,
        error: err instanceof Error ? err.message : 'Unknown parsing error',
        data: rowObj
      });
      result.errorCount++;
    }
  }

  return result;
}

function parseCSVLines(text: string, delimiter: string): string[][] {
  const result: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentValue += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !insideQuotes) {
      if (char === '\r') i++;
      currentRow.push(currentValue);
      result.push(currentRow);
      currentRow = [];
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  if (currentValue !== '' || currentRow.length > 0) {
    currentRow.push(currentValue);
    result.push(currentRow);
  }

  return result;
}

export function parseIndianDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export function parseIndianDateString(dateStr: string): string | null {
  const date = parseIndianDate(dateStr);
  return date ? date.toISOString() : null;
}

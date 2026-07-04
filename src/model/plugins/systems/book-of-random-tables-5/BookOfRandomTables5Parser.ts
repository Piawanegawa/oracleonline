import type { RandomTable, RandomTableEntry } from "../../../tables/RandomTable.js";
import {
  BOOK_OF_RANDOM_TABLES_5_SOURCE_ID,
  BOOK_OF_RANDOM_TABLES_5_SOURCE_TITLE,
  type BookOfRandomTables5TableDefinition
} from "./BookOfRandomTables5TableDefinitions.js";
import { cleanPdfLines, containsFooterNoise, normalizeEntryText } from "./BookOfRandomTables5TextNormalizer.js";

export interface BookOfRandomTables5ParseFailure {
  title: string;
  pageRange: string;
  missingEntryNumbers: number[];
  duplicateEntryNumbers: number[];
  suspiciousEmptyEntries: number[];
  suspiciousFooterEntries: number[];
}

export class BookOfRandomTables5ParseError extends Error {
  constructor(readonly failure: BookOfRandomTables5ParseFailure) {
    super(formatFailure(failure));
  }
}

export class BookOfRandomTables5Parser {
  parseTable(definition: BookOfRandomTables5TableDefinition, pageTexts: string[]): RandomTable {
    const parsedEntries = parseNumberedEntries(pageTexts.join("\n"));
    const entries = [...parsedEntries.entriesByNumber.entries()]
      .sort(([left], [right]) => left - right)
      .map(([entryNumber, text]): RandomTableEntry => ({
        min: entryNumber,
        max: entryNumber,
        text: normalizeEntryText(text)
      }));

    const failure = validateD100Entries(definition, entries, parsedEntries.duplicateEntryNumbers);
    if (failure !== undefined) {
      throw new BookOfRandomTables5ParseError(failure);
    }

    return {
      id: definition.id,
      sourceId: BOOK_OF_RANDOM_TABLES_5_SOURCE_ID,
      sourceTitle: BOOK_OF_RANDOM_TABLES_5_SOURCE_TITLE,
      title: definition.title,
      category: definition.category,
      page: definition.printedStartPage,
      dice: "1d100",
      tags: definition.tags,
      entries
    };
  }
}

interface ParsedEntries {
  entriesByNumber: Map<number, string>;
  duplicateEntryNumbers: number[];
}

function parseNumberedEntries(text: string): ParsedEntries {
  const entriesByNumber = new Map<number, string>();
  const duplicateEntryNumbers = new Set<number>();
  let currentEntryNumber: number | undefined;

  for (const line of cleanPdfLines(text)) {
    const tokens = findEntryTokens(line);
    if (tokens.length === 0) {
      if (currentEntryNumber !== undefined) {
        appendEntryText(entriesByNumber, currentEntryNumber, line);
      }
      continue;
    }

    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index];
      if (token === undefined) continue;

      const nextToken = tokens[index + 1];
      const entryText = line.slice(token.end, nextToken?.start).trim();
      if (entriesByNumber.has(token.entryNumber)) {
        duplicateEntryNumbers.add(token.entryNumber);
      }

      entriesByNumber.set(token.entryNumber, entryText);
      currentEntryNumber = token.entryNumber;
    }
  }

  return {
    entriesByNumber,
    duplicateEntryNumbers: [...duplicateEntryNumbers].sort((left, right) => left - right)
  };
}

interface EntryToken {
  entryNumber: number;
  start: number;
  end: number;
}

function findEntryTokens(line: string): EntryToken[] {
  const tokens: EntryToken[] = [];
  const tokenPattern = /(?:^|\s)(\d{1,3})\s*[\.)]\s*/g;
  let match = tokenPattern.exec(line);

  while (match !== null) {
    const rawEntryNumber = match[1];
    if (rawEntryNumber !== undefined) {
      const entryNumber = Number(rawEntryNumber);
      if (entryNumber >= 1 && entryNumber <= 100) {
        tokens.push({
          entryNumber,
          start: match.index,
          end: tokenPattern.lastIndex
        });
      }
    }
    match = tokenPattern.exec(line);
  }

  return tokens;
}

function appendEntryText(entriesByNumber: Map<number, string>, entryNumber: number, text: string): void {
  const existingText = entriesByNumber.get(entryNumber) ?? "";
  entriesByNumber.set(entryNumber, normalizeEntryText(`${existingText} ${text}`));
}

function validateD100Entries(
  definition: BookOfRandomTables5TableDefinition,
  entries: RandomTableEntry[],
  duplicateEntryNumbers: number[]
): BookOfRandomTables5ParseFailure | undefined {
  const presentEntryNumbers = new Set(entries.map((entry) => entry.min));
  const missingEntryNumbers = Array.from({ length: 100 }, (_, index) => index + 1).filter(
    (entryNumber) => !presentEntryNumbers.has(entryNumber)
  );
  const suspiciousEmptyEntries = entries.filter((entry) => entry.text === "").map((entry) => entry.min);
  const suspiciousFooterEntries = entries
    .filter((entry) => containsFooterNoise(entry.text))
    .map((entry) => entry.min);

  if (
    missingEntryNumbers.length === 0 &&
    duplicateEntryNumbers.length === 0 &&
    suspiciousEmptyEntries.length === 0 &&
    suspiciousFooterEntries.length === 0
  ) {
    return undefined;
  }

  return {
    title: definition.title,
    pageRange: pageRange(definition),
    missingEntryNumbers,
    duplicateEntryNumbers,
    suspiciousEmptyEntries,
    suspiciousFooterEntries
  };
}

function pageRange(definition: BookOfRandomTables5TableDefinition): string {
  return definition.printedStartPage === definition.printedEndPage
    ? `${definition.printedStartPage}`
    : `${definition.printedStartPage}-${definition.printedEndPage}`;
}

function formatFailure(failure: BookOfRandomTables5ParseFailure): string {
  return [
    `Failed to parse ${failure.title} on printed page(s) ${failure.pageRange}.`,
    `Missing entries: ${formatNumbers(failure.missingEntryNumbers)}.`,
    `Duplicate entries: ${formatNumbers(failure.duplicateEntryNumbers)}.`,
    `Empty entries: ${formatNumbers(failure.suspiciousEmptyEntries)}.`,
    `Footer/noise entries: ${formatNumbers(failure.suspiciousFooterEntries)}.`
  ].join(" ");
}

function formatNumbers(numbers: number[]): string {
  return numbers.length === 0 ? "none" : numbers.join(", ");
}

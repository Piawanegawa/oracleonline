import type { RandomTable, RandomTableEntry } from "../../../tables/RandomTable.js";
import {
  BOOK_OF_RANDOM_TABLES_1_TO_4_SOURCE_ID,
  BOOK_OF_RANDOM_TABLES_1_TO_4_SOURCE_TITLE,
  type BookOfRandomTables1To4TableDefinition
} from "./BookOfRandomTables1To4TableOfContents.js";
import { cleanPdfLines, containsFooterNoise, normalizeEntryText } from "./BookOfRandomTables1To4TextNormalizer.js";

export interface BookOfRandomTables1To4ParseFailure {
  title: string;
  pageRange: string;
  missingEntryNumbers: number[];
  duplicateEntryNumbers: number[];
  suspiciousEmptyEntries: string[];
  suspiciousFooterEntries: string[];
}

export class BookOfRandomTables1To4ParseError extends Error {
  constructor(readonly failure: BookOfRandomTables1To4ParseFailure) {
    super(formatFailure(failure));
  }
}

export class BookOfRandomTables1To4Parser {
  parseTable(definition: BookOfRandomTables1To4TableDefinition, pageTexts: string[]): RandomTable {
    const text = pageTexts.join("\n");
    const parsedEntries = parseNumberedEntries(
      text,
      allowsInlineEntryTokens(definition) || hasColumnarInlineEntryTokens(text)
    );
    const entries = parsedEntries.entries.sort((left, right) => left.min - right.min || left.max - right.max);
    const highestEntryNumber = Math.max(...entries.map((entry) => entry.max));
    const failure = validateContinuousEntries(definition, entries, parsedEntries.duplicateEntryNumbers, highestEntryNumber);

    if (failure !== undefined) {
      throw new BookOfRandomTables1To4ParseError(failure);
    }

    return {
      id: definition.id,
      sourceId: BOOK_OF_RANDOM_TABLES_1_TO_4_SOURCE_ID,
      sourceTitle: BOOK_OF_RANDOM_TABLES_1_TO_4_SOURCE_TITLE,
      title: definition.title,
      category: definition.category,
      page: definition.printedStartPage,
      dice: `1d${highestEntryNumber}`,
      tags: definition.tags,
      entries
    };
  }
}

interface ParsedEntries {
  entries: RandomTableEntry[];
  duplicateEntryNumbers: number[];
}

function parseNumberedEntries(text: string, allowInlineEntryTokens: boolean): ParsedEntries {
  const entries: RandomTableEntry[] = [];
  const coveredEntryNumbers = new Set<number>();
  const duplicateEntryNumbers = new Set<number>();
  let currentEntry: RandomTableEntry | undefined;

  for (const line of cleanPdfLines(text)) {
    const tokens = findEntryTokens(line, allowInlineEntryTokens);
    if (tokens.length === 0) {
      if (currentEntry !== undefined) {
        currentEntry.text = normalizeEntryText(`${currentEntry.text} ${line}`);
      }
      continue;
    }

    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index];
      if (token === undefined) continue;

      const nextToken = tokens[index + 1];
      const textForEntry = normalizeEntryText(line.slice(token.end, nextToken?.start).trim());
      const entry = {
        min: token.min,
        max: token.max,
        text: textForEntry
      };

      for (let entryNumber = entry.min; entryNumber <= entry.max; entryNumber += 1) {
        if (coveredEntryNumbers.has(entryNumber)) duplicateEntryNumbers.add(entryNumber);
        coveredEntryNumbers.add(entryNumber);
      }

      entries.push(entry);
      currentEntry = entry;
    }
  }

  return {
    entries,
    duplicateEntryNumbers: [...duplicateEntryNumbers].sort((left, right) => left - right)
  };
}

interface EntryToken {
  min: number;
  max: number;
  start: number;
  end: number;
}

function findEntryTokens(line: string, allowInlineEntryTokens: boolean): EntryToken[] {
  const tokens: EntryToken[] = [];
  const tokenPattern = /(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?\s*\.\s*/g;
  let match = tokenPattern.exec(line);

  while (match !== null) {
    const rawMin = match[1];
    if (rawMin !== undefined && isLikelyEntryToken(line, match.index, match[2] !== undefined, allowInlineEntryTokens)) {
      const min = Number(rawMin);
      const max = match[2] === undefined ? min : Number(match[2]);
      if (min >= 1 && min <= 100 && max >= min && max <= 100) {
        tokens.push({
          min,
          max,
          start: match.index,
          end: tokenPattern.lastIndex
        });
      }
    }
    match = tokenPattern.exec(line);
  }

  return tokens;
}

function isLikelyEntryToken(
  line: string,
  tokenStart: number,
  hasRange: boolean,
  allowInlineEntryTokens: boolean
): boolean {
  if (tokenStart === 0) return true;
  if (!allowInlineEntryTokens) return false;
  if (!hasRange) return true;

  const previousText = line.slice(0, tokenStart).trimEnd();
  if (previousText === "") return true;

  const previousCharacter = previousText.at(-1);
  return previousCharacter !== undefined && /[)\]}>”"'.!?]/.test(previousCharacter);
}

function allowsInlineEntryTokens(definition: BookOfRandomTables1To4TableDefinition): boolean {
  const category = definition.category[0] ?? "";
  return (
    category === "Book Titles" ||
    category === "Dungeon Rooms" ||
    category === "Food" ||
    category === "Names" ||
    definition.title.startsWith("Items in a Dungeon Room")
  );
}

function hasColumnarInlineEntryTokens(text: string): boolean {
  const linesWithInlineEntryTokens = cleanPdfLines(text).filter((line) => {
    const tokens = findEntryTokens(line, true);
    return tokens.length >= 2 && tokens.some((token) => token.start > 0 && token.min > 20);
  });

  return linesWithInlineEntryTokens.length >= 8;
}

function validateContinuousEntries(
  definition: BookOfRandomTables1To4TableDefinition,
  entries: RandomTableEntry[],
  duplicateEntryNumbers: number[],
  highestEntryNumber: number
): BookOfRandomTables1To4ParseFailure | undefined {
  const coveredEntryNumbers = new Set<number>();
  for (const entry of entries) {
    for (let entryNumber = entry.min; entryNumber <= entry.max; entryNumber += 1) {
      coveredEntryNumbers.add(entryNumber);
    }
  }

  const missingEntryNumbers = Array.from({ length: highestEntryNumber }, (_, index) => index + 1).filter(
    (entryNumber) => !coveredEntryNumbers.has(entryNumber)
  );
  const suspiciousEmptyEntries = entries
    .filter((entry) => entry.text === "")
    .map((entry) => formatEntryRange(entry));
  const suspiciousFooterEntries = entries
    .filter((entry) => containsFooterNoise(entry.text))
    .map((entry) => formatEntryRange(entry));

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

function pageRange(definition: BookOfRandomTables1To4TableDefinition): string {
  return definition.printedStartPage === definition.printedEndPage
    ? `${definition.printedStartPage}`
    : `${definition.printedStartPage}-${definition.printedEndPage}`;
}

function formatEntryRange(entry: RandomTableEntry): string {
  return entry.min === entry.max ? `${entry.min}` : `${entry.min}-${entry.max}`;
}

function formatFailure(failure: BookOfRandomTables1To4ParseFailure): string {
  return [
    `Failed to parse ${failure.title} on printed page(s) ${failure.pageRange}.`,
    `Missing entries: ${formatNumbers(failure.missingEntryNumbers)}.`,
    `Duplicate entries: ${formatNumbers(failure.duplicateEntryNumbers)}.`,
    `Empty entries: ${failure.suspiciousEmptyEntries.length === 0 ? "none" : failure.suspiciousEmptyEntries.join(", ")}.`,
    `Footer/noise entries: ${failure.suspiciousFooterEntries.length === 0 ? "none" : failure.suspiciousFooterEntries.join(", ")}.`
  ].join(" ");
}

function formatNumbers(numbers: number[]): string {
  return numbers.length === 0 ? "none" : numbers.join(", ");
}

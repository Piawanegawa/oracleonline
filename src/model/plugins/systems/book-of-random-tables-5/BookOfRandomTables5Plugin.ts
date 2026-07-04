import path from "node:path";
import type { PdfFile } from "../../../pdf/PdfFile.js";
import type { PdfTextExtractor } from "../../../pdf/PdfTextExtractor.js";
import { PdfJsTextExtractor } from "../../../pdf/PdfTextExtractor.js";
import type { RandomTable } from "../../../tables/RandomTable.js";
import type { RulebookPlugin, RulebookSourceRequirement } from "../../RulebookPlugin.js";
import { BookOfRandomTables5Parser } from "./BookOfRandomTables5Parser.js";
import {
  BOOK_OF_RANDOM_TABLES_5_AUTHOR,
  BOOK_OF_RANDOM_TABLES_5_SOURCE_ID,
  BOOK_OF_RANDOM_TABLES_5_SOURCE_TITLE,
  bookOfRandomTables5TableDefinitions
} from "./BookOfRandomTables5TableDefinitions.js";

const acceptedFilenames = new Set([
  "The Book of Random Tables 5.pdf",
  "The_Book_of_Random_Tables_5.pdf",
  "book-of-random-tables-5.pdf"
]);

const markerChecks = [
  { label: "title", pattern: /the book of random tables/i },
  { label: "random tables", pattern: /random tables/i },
  { label: "author", pattern: /matt davids/i },
  { label: "dicegeeks", pattern: /dicegeeks\.com/i },
  { label: "how to use", pattern: /how to use this book/i },
  { label: "dragon names", pattern: /dragon names/i },
  { label: "town happenings", pattern: /town happenings/i }
];

export interface BookOfRandomTables5DetectionResult {
  found: boolean;
  confidence: number;
  reason: string;
  fingerprint?: string;
}

export class BookOfRandomTables5Plugin implements RulebookPlugin {
  readonly id = BOOK_OF_RANDOM_TABLES_5_SOURCE_ID;
  readonly name = BOOK_OF_RANDOM_TABLES_5_SOURCE_TITLE;

  constructor(
    private readonly textExtractor: PdfTextExtractor = new PdfJsTextExtractor(),
    private readonly parser = new BookOfRandomTables5Parser()
  ) {}

  requiredSources(): RulebookSourceRequirement[] {
    return [
      {
        id: BOOK_OF_RANDOM_TABLES_5_SOURCE_ID,
        title: `${BOOK_OF_RANDOM_TABLES_5_SOURCE_TITLE} by ${BOOK_OF_RANDOM_TABLES_5_AUTHOR}`
      }
    ];
  }

  hasRequiredSources(availableSources: PdfFile[]): boolean {
    return this.findSource(availableSources) !== undefined;
  }

  async detectSource(availableSources: PdfFile[]): Promise<BookOfRandomTables5DetectionResult> {
    const source = this.findSource(availableSources);
    if (source === undefined) {
      return {
        found: false,
        confidence: 0,
        reason: "No accepted local PDF filename was found in rulebooks/."
      };
    }

    const pageTexts = await this.textExtractor.extractPageTexts(source.path, detectionPageNumbers());
    const searchableText = [...pageTexts.values()].join("\n");
    const matchedMarkers = markerChecks.filter((marker) => marker.pattern.test(searchableText)).map((marker) => marker.label);
    const hasStrongIdentityMarker = matchedMarkers.includes("title") || matchedMarkers.includes("author");
    const confidence = Math.min(1, matchedMarkers.length / 5);
    const found = hasStrongIdentityMarker && matchedMarkers.length >= 3;

    return {
      found,
      confidence,
      reason: found
        ? `Matched markers: ${matchedMarkers.join(", ")}.`
        : `Only matched markers: ${matchedMarkers.length === 0 ? "none" : matchedMarkers.join(", ")}.`,
      ...(source.sha256 === undefined ? {} : { fingerprint: source.sha256 })
    };
  }

  async extractRandomTables(availableSources: PdfFile[]): Promise<RandomTable[]> {
    const source = this.findSource(availableSources);
    if (source === undefined) return [];

    const detection = await this.detectSource([source]);
    if (!detection.found) {
      throw new Error(`Could not identify ${BOOK_OF_RANDOM_TABLES_5_SOURCE_TITLE}: ${detection.reason}`);
    }

    const pageTexts = await this.textExtractor.extractPageTexts(source.path, tablePageNumbers());

    return bookOfRandomTables5TableDefinitions.map((definition) => {
      const texts = printedPages(definition.printedStartPage, definition.printedEndPage).map((printedPage) => {
        const pdfPageNumber = printedPageToPdfPageNumber(printedPage);
        return pageTexts.get(pdfPageNumber) ?? "";
      });
      return this.parser.parseTable(definition, texts);
    });
  }

  private findSource(availableSources: PdfFile[]): PdfFile | undefined {
    return availableSources.find((source) => {
      const filename = path.basename(source.path);
      return source.id === BOOK_OF_RANDOM_TABLES_5_SOURCE_ID || acceptedFilenames.has(filename);
    });
  }
}

function tablePageNumbers(): number[] {
  return [
    ...new Set(
      bookOfRandomTables5TableDefinitions.flatMap((definition) =>
        printedPages(definition.printedStartPage, definition.printedEndPage).map(printedPageToPdfPageNumber)
      )
    )
  ].sort((left, right) => left - right);
}

function detectionPageNumbers(): number[] {
  return [...new Set([...Array.from({ length: 15 }, (_, index) => index + 1), ...tablePageNumbers()])].sort(
    (left, right) => left - right
  );
}

function printedPages(startPage: number, endPage: number): number[] {
  return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
}

function printedPageToPdfPageNumber(printedPage: number): number {
  return printedPage + 1;
}

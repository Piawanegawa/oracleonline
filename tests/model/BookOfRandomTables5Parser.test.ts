import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LocalPdfScanner } from "../../src/model/pdf/PdfScanner.js";
import { BookOfRandomTables5Plugin } from "../../src/model/plugins/systems/book-of-random-tables-5/BookOfRandomTables5Plugin.js";
import {
  BOOK_OF_RANDOM_TABLES_5_SOURCE_ID,
  type BookOfRandomTables5TableDefinition
} from "../../src/model/plugins/systems/book-of-random-tables-5/BookOfRandomTables5TableDefinitions.js";
import {
  BookOfRandomTables5ParseError,
  BookOfRandomTables5Parser
} from "../../src/model/plugins/systems/book-of-random-tables-5/BookOfRandomTables5Parser.js";

const parser = new BookOfRandomTables5Parser();

describe("BookOfRandomTables5Parser", () => {
  it("parses a single-page d100-like table with entries out of order", () => {
    const table = parser.parseTable(definition(), [numberedLines([...range(51, 100), ...range(1, 50)])]);

    expect(table.entries).toHaveLength(100);
    expect(table.entries[0]).toEqual({ min: 1, max: 1, text: "Synthetic entry 1" });
    expect(table.entries[99]).toEqual({ min: 100, max: 100, text: "Synthetic entry 100" });
  });

  it("handles two-column extraction where entries 51-100 appear before 1-50", () => {
    const lines = range(1, 50).map((entryNumber) => `${entryNumber + 50}. Right ${entryNumber + 50} ${entryNumber}. Left ${entryNumber}`);
    const table = parser.parseTable(definition(), [lines.join("\n")]);

    expect(table.entries[0]?.text).toBe("Left 1");
    expect(table.entries[50]?.text).toBe("Right 51");
  });

  it("attaches wrapped lines to the previous numbered entry", () => {
    const lines = numberedLines(range(1, 100)).replace("42. Synthetic entry 42", "42. Wrapped start\nwrapped finish");
    const table = parser.parseTable(definition(), [lines]);

    expect(table.entries[41]?.text).toBe("Wrapped start wrapped finish");
  });

  it("handles an entry number on its own line", () => {
    const lines = numberedLines(range(1, 100)).replace("1. Synthetic entry 1", "1.\nFirst entry text");
    const table = parser.parseTable(definition(), [lines]);

    expect(table.entries[0]?.text).toBe("First entry text");
  });

  it("normalizes common PDF ligatures", () => {
    const lines = numberedLines(range(1, 100)).replace("2. Synthetic entry 2", "2. ﬁ ﬂ ﬀ ﬃ ﬄ");
    const table = parser.parseTable(definition(), [lines]);

    expect(table.entries[1]?.text).toBe("fi fl ff ffi ffl");
  });

  it("removes footer and watermark lines", () => {
    const lines = numberedLines(range(1, 100)).replace(
      "3. Synthetic entry 3",
      "3. Clean start\nThe Book of Random Tables 5\n42\ndicegeeks.com\nClean finish"
    );
    const table = parser.parseTable(definition(), [lines]);

    expect(table.entries[2]?.text).toBe("Clean start Clean finish");
  });

  it("reports validation failures when an entry is missing", () => {
    expect(() => parser.parseTable(definition(), [numberedLines(range(1, 99))])).toThrow(BookOfRandomTables5ParseError);

    try {
      parser.parseTable(definition(), [numberedLines(range(1, 99))]);
    } catch (error) {
      expect(error).toBeInstanceOf(BookOfRandomTables5ParseError);
      expect((error as BookOfRandomTables5ParseError).failure.missingEntryNumbers).toEqual([100]);
    }
  });

  it("parses a synthetic multi-page table", () => {
    const table = parser.parseTable(definition({ printedStartPage: 10, printedEndPage: 11 }), [
      numberedLines(range(1, 50)),
      numberedLines(range(51, 100))
    ]);

    expect(table.entries).toHaveLength(100);
    expect(table.page).toBe(10);
  });
});

describe("BookOfRandomTables5Plugin optional PDF integration", () => {
  it.skipIf(!existsSync("rulebooks/The_Book_of_Random_Tables_5.pdf"))(
    "detects and extracts metadata/counts from the local PDF",
    async () => {
      const scanner = new LocalPdfScanner();
      const sources = await scanner.findAvailableSources();
      const plugin = new BookOfRandomTables5Plugin();

      const detection = await plugin.detectSource(sources);
      const tables = await plugin.extractRandomTables(sources);

      expect(detection.found).toBe(true);
      expect(tables).toHaveLength(25);
      expect(tables).toContainEqual(expect.objectContaining({ id: `${BOOK_OF_RANDOM_TABLES_5_SOURCE_ID}-dragon-names` }));
      expect(tables).toContainEqual(expect.objectContaining({ id: `${BOOK_OF_RANDOM_TABLES_5_SOURCE_ID}-town-happenings` }));
      expect(tables.every((table) => table.entries.length === 100)).toBe(true);
      expect(
        tables.flatMap((table) => table.entries).every((entry) => !/order\s*#|watermark|dicegeeks\.com/i.test(entry.text))
      ).toBe(true);
    },
    60_000
  );
});

function definition(overrides: Partial<BookOfRandomTables5TableDefinition> = {}): BookOfRandomTables5TableDefinition {
  return {
    id: `${BOOK_OF_RANDOM_TABLES_5_SOURCE_ID}-synthetic`,
    title: "Synthetic Table",
    category: ["Synthetic"],
    printedStartPage: 1,
    printedEndPage: 1,
    tags: ["synthetic"],
    ...overrides
  };
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function numberedLines(entryNumbers: number[]): string {
  return entryNumbers.map((entryNumber) => `${entryNumber}. Synthetic entry ${entryNumber}`).join("\n");
}

import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LocalPdfScanner } from "../../src/model/pdf/PdfScanner.js";
import { BookOfRandomTables1To4Parser } from "../../src/model/plugins/systems/book-of-random-tables-1-4/BookOfRandomTables1To4Parser.js";
import { BookOfRandomTables1To4Plugin } from "../../src/model/plugins/systems/book-of-random-tables-1-4/BookOfRandomTables1To4Plugin.js";
import {
  BOOK_OF_RANDOM_TABLES_1_TO_4_SOURCE_ID,
  type BookOfRandomTables1To4TableDefinition
} from "../../src/model/plugins/systems/book-of-random-tables-1-4/BookOfRandomTables1To4TableOfContents.js";

const parser = new BookOfRandomTables1To4Parser();

describe("BookOfRandomTables1To4Parser", () => {
  it("parses d100 entries with ranges", () => {
    const table = parser.parseTable(definition({ title: "Critical Range Table" }), [
      range(1, 100, 2).map((entryNumber) => `${entryNumber}-${entryNumber + 1}. Synthetic range ${entryNumber}`).join("\n")
    ]);

    expect(table.dice).toBe("1d100");
    expect(table.entries).toHaveLength(50);
    expect(table.entries[0]).toEqual({ min: 1, max: 2, text: "Synthetic range 1" });
  });

  it("infers d50 tables from the highest covered entry number", () => {
    const table = parser.parseTable(definition({ title: "Short Table" }), [
      range(1, 50).map((entryNumber) => `${entryNumber}. Synthetic entry ${entryNumber}`).join("\n")
    ]);

    expect(table.dice).toBe("1d50");
    expect(table.entries).toHaveLength(50);
  });

  it("ignores inline numbered sublists in long-form item descriptions", () => {
    const text = range(1, 100)
      .map((entryNumber) =>
        entryNumber === 44
          ? "44. Synthetic item. If used, roll 1D6. 1. First effect. 2. Second effect. 3. Third effect."
          : `${entryNumber}. Synthetic entry ${entryNumber}`
      )
      .join("\n");

    const table = parser.parseTable(definition({ category: ["Items & Things"], title: "Synthetic Items" }), [text]);

    expect(table.entries).toHaveLength(100);
    expect(table.entries[43]?.text).toContain("First effect");
  });

  it("splits compact two-column lines for encounter tables", () => {
    const lines = range(1, 50)
      .map((entryNumber) => `${entryNumber}. Left entry ${entryNumber} ${entryNumber + 50}. Right entry ${entryNumber + 50}`)
      .join("\n");

    const table = parser.parseTable(definition({ category: ["Encounters, Jobs, & Rumors"], title: "Synthetic Encounters" }), [
      lines
    ]);

    expect(table.dice).toBe("1d100");
    expect(table.entries).toHaveLength(100);
    expect(table.entries[0]?.text).toBe("Left entry 1");
    expect(table.entries[50]?.text).toBe("Right entry 51");
  });
});

describe("BookOfRandomTables1To4Plugin optional PDF integration", () => {
  it.skipIf(!existsSync("rulebooks/The_Book_of_Random_Tables_1-4.pdf"))(
    "detects and extracts metadata/counts from the local PDF",
    async () => {
      const scanner = new LocalPdfScanner();
      const sources = await scanner.findAvailableSources();
      const plugin = new BookOfRandomTables1To4Plugin();

      const detection = await plugin.detectSource(sources);
      const tables = await plugin.extractRandomTables(sources);

      expect(detection.found).toBe(true);
      expect(tables).toHaveLength(120);
      expect(tables).toContainEqual(expect.objectContaining({ id: `${BOOK_OF_RANDOM_TABLES_1_TO_4_SOURCE_ID}-book-titles-1` }));
      expect(tables).toContainEqual(
        expect.objectContaining({
          id: `${BOOK_OF_RANDOM_TABLES_1_TO_4_SOURCE_ID}-reasons-why-a-player-character-is-absent-for-a-session`
        })
      );
      expect(tables.every((table) => table.entries.length > 0)).toBe(true);
      expect(tables.every((table) => table.dice === "1d50" || table.dice === "1d100")).toBe(true);
      expect(
        tables.flatMap((table) => table.entries).every((entry) => !/order\s*#|watermark|dicegeeks\.com/i.test(entry.text))
      ).toBe(true);
    },
    60_000
  );
});

function definition(overrides: Partial<BookOfRandomTables1To4TableDefinition> = {}): BookOfRandomTables1To4TableDefinition {
  return {
    id: `${BOOK_OF_RANDOM_TABLES_1_TO_4_SOURCE_ID}-synthetic`,
    title: "Synthetic Table",
    category: ["Synthetic"],
    printedStartPage: 1,
    printedEndPage: 1,
    tags: ["synthetic"],
    ...overrides
  };
}

function range(start: number, end: number, step = 1): number[] {
  return Array.from({ length: Math.floor((end - start) / step) + 1 }, (_, index) => start + index * step);
}

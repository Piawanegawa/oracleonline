import { readFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export const BOOK_OF_RANDOM_TABLES_1_TO_4_SOURCE_ID = "book-of-random-tables-1-4";
export const BOOK_OF_RANDOM_TABLES_1_TO_4_SOURCE_TITLE = "The Great Book of Random Tables";
export const BOOK_OF_RANDOM_TABLES_1_TO_4_AUTHOR = "Matt Davids";

export interface BookOfRandomTables1To4TableDefinition {
  id: string;
  title: string;
  category: string[];
  printedStartPage: number;
  printedEndPage: number;
  tags: string[];
}

interface PositionedText {
  str: string;
  x: number;
  y: number;
}

const categoryHeadings = new Set([
  "Book Titles",
  "Critical Rolls",
  "Dungeon Rooms",
  "Encounters, Jobs, & Rumors",
  "Food",
  "Items & Things",
  "Names",
  "NPCs & Characters"
]);

export async function extractBookOfRandomTables1To4Definitions(
  pdfPath: string
): Promise<BookOfRandomTables1To4TableDefinition[]> {
  const itemsByPage = await extractTocItems(pdfPath, [5, 6]);
  const definitions: BookOfRandomTables1To4TableDefinition[] = [];

  for (const pageItems of itemsByPage) {
    for (const column of [leftColumn(pageItems), rightColumn(pageItems)]) {
      definitions.push(...parseColumnLines(positionedItemsToLines(column)));
    }
  }

  const byId = new Map<string, BookOfRandomTables1To4TableDefinition>();
  for (const definition of definitions) {
    if (definition.title === "How to Use this Book") continue;
    byId.set(definition.id, definition);
  }

  return [...byId.values()].sort((left, right) => left.printedStartPage - right.printedStartPage);
}

async function extractTocItems(pdfPath: string, pageNumbers: number[]): Promise<PositionedText[][]> {
  const bytes = await readFile(pdfPath);
  const loadingTask = getDocument({
    data: new Uint8Array(bytes),
    disableFontFace: true
  });
  const document = await loadingTask.promise;
  const pages: PositionedText[][] = [];

  for (const pageNumber of pageNumbers) {
    const page = await document.getPage(pageNumber);
    const textContent = await page.getTextContent();
    pages.push(
      (textContent.items as unknown[])
        .map(toPositionedText)
        .filter((item): item is PositionedText => item !== undefined)
    );
    page.cleanup();
  }

  await loadingTask.destroy();
  return pages;
}

function toPositionedText(item: unknown): PositionedText | undefined {
  if (typeof item !== "object" || item === null || !("str" in item) || !("transform" in item)) return undefined;

  const textItem = item as { str: unknown; transform: unknown };
  if (typeof textItem.str !== "string" || !Array.isArray(textItem.transform)) return undefined;

  const x = textItem.transform[4];
  const y = textItem.transform[5];
  if (typeof x !== "number" || typeof y !== "number" || textItem.str.trim() === "") return undefined;

  return { str: textItem.str, x, y };
}

function leftColumn(items: PositionedText[]): PositionedText[] {
  return items.filter((item) => item.x >= 70 && item.x < 300 && item.y > 90);
}

function rightColumn(items: PositionedText[]): PositionedText[] {
  return items.filter((item) => item.x >= 300 && item.y > 90);
}

function positionedItemsToLines(items: PositionedText[]): string[] {
  const rows = new Map<number, PositionedText[]>();
  for (const item of items) {
    const rowKey = [...rows.keys()].find((key) => Math.abs(key - item.y) <= 2) ?? item.y;
    rows.set(rowKey, [...(rows.get(rowKey) ?? []), item]);
  }

  return [...rows.entries()]
    .sort(([leftY], [rightY]) => rightY - leftY)
    .map(([, row]) =>
      row
        .sort((left, right) => left.x - right.x)
        .map((item) => item.str.trim())
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter((line) => line !== "")
    .filter((line) => line !== "Table of Contents")
    .filter((line) => !/^\d+$/.test(line))
    .filter((line) => !/order\s*#/i.test(line));
}

function parseColumnLines(lines: string[]): BookOfRandomTables1To4TableDefinition[] {
  const definitions: BookOfRandomTables1To4TableDefinition[] = [];
  let category = "General";
  let pendingTitle = "";

  for (const line of lines) {
    if (categoryHeadings.has(line)) {
      category = line;
      pendingTitle = "";
      continue;
    }

    const entry = parseTocEntry(pendingTitle === "" ? line : `${pendingTitle} ${line}`);
    if (entry === undefined) {
      pendingTitle = categoryHeadings.has(line) ? "" : line;
      continue;
    }

    definitions.push(createDefinition(entry.title, category, entry.startPage, entry.endPage));
    pendingTitle = "";
  }

  return definitions;
}

function parseTocEntry(line: string): { title: string; startPage: number; endPage: number } | undefined {
  const match = /^(.*?)\.{2,}\s*(\d+)(?:\s*-\s*(\d+))?$/.exec(line);
  if (match === null || match[1] === undefined || match[2] === undefined) return undefined;

  const startPage = Number(match[2]);
  const endPage = match[3] === undefined ? startPage : Number(match[3]);

  return {
    title: match[1].replace(/\s+/g, " ").trim(),
    startPage,
    endPage
  };
}

function createDefinition(
  title: string,
  category: string,
  printedStartPage: number,
  printedEndPage: number
): BookOfRandomTables1To4TableDefinition {
  return {
    id: `${BOOK_OF_RANDOM_TABLES_1_TO_4_SOURCE_ID}-${slugify(title)}`,
    title,
    category: [category],
    printedStartPage,
    printedEndPage,
    tags: uniqueTags([...titleTags(title), ...categoryTags(category)])
  };
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/#/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleTags(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/#\d+/g, "")
    .replace(/[^a-z0-9/ &-]/g, " ")
    .split(/[\s/&-]+/)
    .filter((word) => word.length > 1 && !["in", "on", "of", "and", "for", "a", "an"].includes(word));
}

function categoryTags(category: string): string[] {
  return category.toLowerCase().split(/\s*&\s*|\s+/).filter((word) => word.length > 1);
}

function uniqueTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag !== ""))];
}

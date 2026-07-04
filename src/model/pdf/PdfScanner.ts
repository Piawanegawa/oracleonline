import type { PdfFile } from "./PdfFile.js";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

export interface PdfScanner {
  findAvailableSources(): Promise<PdfFile[]>;
}

export class EmptyPdfScanner implements PdfScanner {
  async findAvailableSources(): Promise<PdfFile[]> {
    return [];
  }
}

export class LocalPdfScanner implements PdfScanner {
  constructor(private readonly rulebooksDirectory = path.resolve("rulebooks")) {}

  async findAvailableSources(): Promise<PdfFile[]> {
    const bookOfRandomTables5 = await this.findBookOfRandomTables5();
    return bookOfRandomTables5 === undefined ? [] : [bookOfRandomTables5];
  }

  private async findBookOfRandomTables5(): Promise<PdfFile | undefined> {
    const filenames = [
      "The_Book_of_Random_Tables_5.pdf",
      "The Book of Random Tables 5.pdf",
      "book-of-random-tables-5.pdf"
    ];

    for (const filename of filenames) {
      const pdfPath = path.join(this.rulebooksDirectory, filename);
      if (!existsSync(pdfPath)) continue;

      return {
        id: "book-of-random-tables-5",
        title: "The Book of Random Tables 5",
        path: pdfPath,
        sha256: await sha256File(pdfPath)
      };
    }

    return undefined;
  }
}

async function sha256File(filePath: string): Promise<string> {
  const bytes = await readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex");
}

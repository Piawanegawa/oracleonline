import type { PdfFile } from "./PdfFile.js";

export interface PdfScanner {
  findAvailableSources(): Promise<PdfFile[]>;
}

export class EmptyPdfScanner implements PdfScanner {
  async findAvailableSources(): Promise<PdfFile[]> {
    return [];
  }
}

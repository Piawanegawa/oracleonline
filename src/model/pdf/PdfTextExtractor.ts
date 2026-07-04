import { readFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export interface PdfTextExtractor {
  extractPageTexts(pdfPath: string, pageNumbers: number[]): Promise<Map<number, string>>;
}

export class PdfJsTextExtractor implements PdfTextExtractor {
  async extractPageTexts(pdfPath: string, pageNumbers: number[]): Promise<Map<number, string>> {
    const bytes = await readFile(pdfPath);
    const loadingTask = getDocument({
      data: new Uint8Array(bytes),
      disableFontFace: true
    });
    const document = await loadingTask.promise;

    const pageTexts = new Map<number, string>();
    for (const pageNumber of pageNumbers) {
      if (pageNumber < 1 || pageNumber > document.numPages) continue;

      const page = await document.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const items = (textContent.items as unknown[]).filter(isTextItem);
      pageTexts.set(pageNumber, textItemsToLines(items));
      page.cleanup();
    }

    await loadingTask.destroy();
    return pageTexts;
  }
}

interface TextItemLike {
  str: string;
  transform: number[];
}

function isTextItem(item: unknown): item is TextItemLike {
  return typeof item === "object" && item !== null && "str" in item && "transform" in item;
}

interface PositionedText {
  str: string;
  x: number;
  y: number;
}

function textItemsToLines(items: TextItemLike[]): string {
  const positionedItems = items
    .map((item): PositionedText | undefined => {
      const x = item.transform[4];
      const y = item.transform[5];
      if (x === undefined || y === undefined || item.str.trim() === "") return undefined;
      return { str: item.str, x, y };
    })
    .filter((item): item is PositionedText => item !== undefined)
    .sort((left, right) => {
      const yDistance = right.y - left.y;
      if (Math.abs(yDistance) > 2) return yDistance;
      return left.x - right.x;
    });

  const lines: PositionedText[][] = [];
  for (const item of positionedItems) {
    const line = lines.find((candidate) => Math.abs((candidate[0]?.y ?? item.y) - item.y) <= 2);
    if (line === undefined) {
      lines.push([item]);
    } else {
      line.push(item);
    }
  }

  return lines
    .map((line) =>
      line
        .sort((left, right) => left.x - right.x)
        .map((item) => item.str)
        .join(" ")
    )
    .join("\n");
}

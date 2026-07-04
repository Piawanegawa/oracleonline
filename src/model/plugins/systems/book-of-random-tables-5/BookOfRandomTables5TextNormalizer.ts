const footerPatterns = [
  /^\d+$/,
  /^the book of random tables\s*5$/i,
  /^matt davids$/i,
  /^dicegeeks\.com$/i,
  /^random tables$/i,
  /order\s*#/i,
  /watermark/i,
  /www\.dicegeeks\.com/i,
  /copyright/i,
  /all rights reserved/i
];

export function normalizePdfText(text: string): string {
  return text
    .replaceAll("ﬁ", "fi")
    .replaceAll("ﬂ", "fl")
    .replaceAll("ﬀ", "ff")
    .replaceAll("ﬃ", "ffi")
    .replaceAll("ﬄ", "ffl")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ");
}

export function cleanPdfLines(text: string): string[] {
  return normalizePdfText(text)
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line !== "")
    .filter((line) => !footerPatterns.some((pattern) => pattern.test(line)));
}

export function normalizeEntryText(text: string): string {
  return normalizePdfText(text).replace(/\s+/g, " ").trim();
}

export function containsFooterNoise(text: string): boolean {
  return footerPatterns.some((pattern) => pattern.test(text));
}

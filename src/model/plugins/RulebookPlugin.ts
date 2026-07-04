import type { PdfFile } from "../pdf/PdfFile.js";
import type { RandomTable } from "../tables/RandomTable.js";

export interface RulebookSourceRequirement {
  id: string;
  title: string;
}

export interface RulebookPlugin {
  id: string;
  name: string;
  requiredSources(): RulebookSourceRequirement[];
  hasRequiredSources(availableSources: PdfFile[]): boolean;
  extractRandomTables(availableSources: PdfFile[]): Promise<RandomTable[]>;
}

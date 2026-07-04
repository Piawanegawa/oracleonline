import type { FavoriteRepository } from "../../model/storage/FavoriteRepository.js";
import type { TableRepository } from "../../model/tables/TableRepository.js";
import type { DiceRoller } from "../../model/dice/DiceRoller.js";
import type { PluginRegistry } from "../../model/plugins/PluginRegistry.js";
import type { PdfScanner } from "../../model/pdf/PdfScanner.js";

export interface RouteContext {
  tableRepository: TableRepository;
  favoriteRepository: FavoriteRepository;
  diceRoller: DiceRoller;
  pluginRegistry: PluginRegistry;
  pdfScanner: PdfScanner;
}

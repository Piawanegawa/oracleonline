import type { PdfFile } from "../pdf/PdfFile.js";
import type { RandomTable } from "../tables/RandomTable.js";
import { validateRandomTable } from "../tables/TableValidator.js";
import type { RulebookPlugin } from "./RulebookPlugin.js";

export class PluginRegistry {
  private readonly plugins = new Map<string, RulebookPlugin>();

  register(plugin: RulebookPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin already registered: ${plugin.id}`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  list(): RulebookPlugin[] {
    return [...this.plugins.values()];
  }

  async extractTables(availableSources: PdfFile[]): Promise<RandomTable[]> {
    const tables: RandomTable[] = [];

    for (const plugin of this.plugins.values()) {
      if (!plugin.hasRequiredSources(availableSources)) continue;

      const pluginTables = await plugin.extractRandomTables(availableSources);
      for (const table of pluginTables) {
        const validation = validateRandomTable(table);
        if (!validation.valid) {
          throw new Error(`Plugin ${plugin.id} produced invalid table ${table.id}: ${validation.errors.join(" ")}`);
        }
        tables.push(table);
      }
    }

    return tables;
  }
}

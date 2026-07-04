import { describe, expect, it } from "vitest";
import { PluginRegistry } from "../../src/model/plugins/PluginRegistry.js";
import type { RulebookPlugin } from "../../src/model/plugins/RulebookPlugin.js";

describe("PluginRegistry", () => {
  it("registers plugins and extracts validated tables", async () => {
    const registry = new PluginRegistry();
    registry.register(createSyntheticPlugin());

    const tables = await registry.extractTables([]);

    expect(registry.list()).toHaveLength(1);
    expect(tables.map((table) => table.id)).toContain("synthetic-table");
  });

  it("rejects duplicate plugin ids", () => {
    const registry = new PluginRegistry();
    registry.register(createSyntheticPlugin());

    expect(() => registry.register(createSyntheticPlugin())).toThrow("Plugin already registered");
  });
});

function createSyntheticPlugin(): RulebookPlugin {
  return {
    id: "synthetic-plugin",
    name: "Synthetic Plugin",
    requiredSources: () => [],
    hasRequiredSources: () => true,
    extractRandomTables: async () => [
      {
        id: "synthetic-table",
        sourceId: "synthetic-source",
        sourceTitle: "Synthetic Source",
        title: "Synthetic Table",
        category: ["Testing"],
        dice: "1d2",
        tags: ["test"],
        entries: [
          { min: 1, max: 1, text: "One" },
          { min: 2, max: 2, text: "Two" }
        ]
      }
    ]
  };
}

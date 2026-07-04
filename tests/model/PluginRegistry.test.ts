import { describe, expect, it } from "vitest";
import { PluginRegistry } from "../../src/model/plugins/PluginRegistry.js";
import { TestBookPlugin } from "../../src/model/plugins/TestBookPlugin.js";

describe("PluginRegistry", () => {
  it("registers plugins and extracts validated tables", async () => {
    const registry = new PluginRegistry();
    registry.register(new TestBookPlugin());

    const tables = await registry.extractTables([]);

    expect(registry.list()).toHaveLength(1);
    expect(tables.map((table) => table.id)).toContain("test-book-forest-encounters");
  });

  it("rejects duplicate plugin ids", () => {
    const registry = new PluginRegistry();
    registry.register(new TestBookPlugin());

    expect(() => registry.register(new TestBookPlugin())).toThrow("Plugin already registered");
  });
});

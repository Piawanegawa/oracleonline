import { describe, expect, it } from "vitest";
import { DiceRoller } from "../../src/model/dice/DiceRoller.js";
import { InMemoryFavoriteRepository } from "../../src/model/storage/FavoriteRepository.js";
import { InMemoryTableRepository } from "../../src/model/tables/TableRepository.js";
import { EmptyPdfScanner } from "../../src/model/pdf/PdfScanner.js";
import { PluginRegistry } from "../../src/model/plugins/PluginRegistry.js";
import { buildApp } from "../../src/app.js";

describe("rollRoutes", () => {
  it("resolves inline dice expressions in roll result text", async () => {
    const app = await buildApp({
      tableRepository: new InMemoryTableRepository([
        {
          id: "inline-dice-table",
          sourceId: "test",
          sourceTitle: "Test",
          title: "Inline Dice",
          category: ["Testing"],
          dice: "1d1",
          tags: [],
          entries: [{ min: 1, max: 1, text: "Arrows (stuck in the ground, 1D100)" }]
        }
      ]),
      favoriteRepository: new InMemoryFavoriteRepository(),
      diceRoller: new DiceRoller(() => 0.36),
      pluginRegistry: new PluginRegistry(),
      pdfScanner: new EmptyPdfScanner()
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/roll/inline-dice-table"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      tableId: "inline-dice-table",
      roll: 1,
      text: "37 arrows (stuck in the ground)",
      originalText: "Arrows (stuck in the ground, 1D100)",
      inlineRolls: [
        {
          expression: "1D100",
          total: 37,
          rolls: [37],
          modifier: 0
        }
      ]
    });

    await app.close();
  });
});

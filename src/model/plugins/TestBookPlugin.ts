import type { PdfFile } from "../pdf/PdfFile.js";
import type { RandomTable } from "../tables/RandomTable.js";
import type { RulebookPlugin, RulebookSourceRequirement } from "./RulebookPlugin.js";

export class TestBookPlugin implements RulebookPlugin {
  readonly id = "test-book";
  readonly name = "Test Book";

  requiredSources(): RulebookSourceRequirement[] {
    return [{ id: "test-book-pdf", title: "Test Book PDF" }];
  }

  hasRequiredSources(_availableSources: PdfFile[]): boolean {
    return true;
  }

  async extractRandomTables(_availableSources: PdfFile[]): Promise<RandomTable[]> {
    return [
      {
        id: "test-book-forest-encounters",
        sourceId: "test-book-pdf",
        sourceTitle: "Test Book",
        title: "Forest Encounters",
        category: ["Wilderness", "Encounters"],
        page: 12,
        dice: "1d6",
        tags: ["forest", "travel", "encounter"],
        entries: [
          { min: 1, max: 1, text: "A broken shrine covered in fresh moss." },
          { min: 2, max: 2, text: "A wary hunter who has lost the trail home." },
          { min: 3, max: 3, text: "A ring of mushrooms humming in the rain." },
          { min: 4, max: 4, text: "A patrol of lantern-bearing scouts." },
          { min: 5, max: 5, text: "A fallen tree hiding a half-buried coffer." },
          { min: 6, max: 6, text: "A distant horn answered by something deeper in the woods." }
        ]
      },
      {
        id: "test-book-tavern-rumors",
        sourceId: "test-book-pdf",
        sourceTitle: "Test Book",
        title: "Tavern Rumors",
        category: ["Settlement", "Rumors"],
        page: 34,
        dice: "1d4",
        tags: ["tavern", "social", "rumor"],
        entries: [
          { min: 1, max: 1, text: "The old mill has started turning without wind." },
          { min: 2, max: 2, text: "A merchant paid in coins no one can identify." },
          { min: 3, max: 3, text: "The baron keeps a sealed room beneath the chapel." },
          { min: 4, max: 4, text: "Someone saw blue fire on the western road." }
        ]
      }
    ];
  }
}

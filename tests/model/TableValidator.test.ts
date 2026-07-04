import { describe, expect, it } from "vitest";
import { validateRandomTable } from "../../src/model/tables/TableValidator.js";
import type { RandomTable } from "../../src/model/tables/RandomTable.js";

const validTable: RandomTable = {
  id: "table",
  sourceId: "source",
  sourceTitle: "Source",
  title: "Table",
  category: ["Category"],
  dice: "1d4",
  tags: [],
  entries: [
    { min: 1, max: 2, text: "Low" },
    { min: 3, max: 4, text: "High" }
  ]
};

describe("validateRandomTable", () => {
  it("accepts a valid table", () => {
    expect(validateRandomTable(validTable)).toEqual({ valid: true, errors: [] });
  });

  it("rejects overlapping ranges", () => {
    const result = validateRandomTable({
      ...validTable,
      entries: [
        { min: 1, max: 3, text: "First" },
        { min: 3, max: 4, text: "Second" }
      ]
    });

    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toContain("overlaps");
  });
});

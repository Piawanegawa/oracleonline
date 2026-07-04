import { describe, expect, it } from "vitest";
import { parseDiceExpression } from "../../src/model/dice/DiceExpression.js";
import { DiceRoller } from "../../src/model/dice/DiceRoller.js";

describe("DiceRoller", () => {
  it("parses dice expressions", () => {
    expect(parseDiceExpression("2d6+1")).toEqual({ count: 2, sides: 6, modifier: 1 });
    expect(parseDiceExpression("d8")).toEqual({ count: 1, sides: 8, modifier: 0 });
  });

  it("rolls with an injectable random generator", () => {
    const roller = new DiceRoller(() => 0);

    expect(roller.roll("2d6+3")).toEqual({
      total: 5,
      rolls: [1, 1],
      modifier: 3
    });
  });
});

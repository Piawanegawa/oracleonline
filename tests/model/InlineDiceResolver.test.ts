import { describe, expect, it } from "vitest";
import { DiceRoller } from "../../src/model/dice/DiceRoller.js";
import { resolveInlineDice } from "../../src/model/dice/InlineDiceResolver.js";

describe("resolveInlineDice", () => {
  it("rolls parenthesized quantity expressions and moves the quantity to the front", () => {
    const resolver = resolveInlineDice("Arrows (stuck in the ground, 1D100)", new DiceRoller(() => 0.36));

    expect(resolver.text).toBe("37 arrows (stuck in the ground)");
    expect(resolver.rolls).toEqual([
      {
        expression: "1D100",
        total: 37,
        rolls: [37],
        modifier: 0
      }
    ]);
  });

  it("rolls plain parenthesized dice expressions and replaces them with totals", () => {
    const resolver = resolveInlineDice("A pouch containing (2d6) coins", new DiceRoller(() => 0));

    expect(resolver.text).toBe("A pouch containing 2 coins");
  });

  it("moves trailing quantity dice to the front", () => {
    const resolver = resolveInlineDice("Soldiers (1D4)", new DiceRoller(() => 0.75));

    expect(resolver.text).toBe("4 soldiers");
    expect(resolver.rolls[0]?.total).toBe(4);
  });

  it("leaves text without dice expressions unchanged", () => {
    expect(resolveInlineDice("No extra quantity", new DiceRoller(() => 0)).text).toBe("No extra quantity");
  });
});

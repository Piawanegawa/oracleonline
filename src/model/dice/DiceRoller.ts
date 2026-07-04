import { parseDiceExpression } from "./DiceExpression.js";

export interface DiceRoll {
  total: number;
  rolls: number[];
  modifier: number;
}

export type RandomNumberGenerator = () => number;

export class DiceRoller {
  constructor(private readonly random: RandomNumberGenerator = Math.random) {}

  roll(expression: string): DiceRoll {
    const dice = parseDiceExpression(expression);
    const rolls = Array.from({ length: dice.count }, () => Math.floor(this.random() * dice.sides) + 1);
    const total = rolls.reduce((sum, value) => sum + value, 0) + dice.modifier;

    return {
      total,
      rolls,
      modifier: dice.modifier
    };
  }
}

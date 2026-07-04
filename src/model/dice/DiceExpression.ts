export interface DiceExpression {
  count: number;
  sides: number;
  modifier: number;
}

const diceExpressionPattern = /^(?:(\d*)d)?(\d+)([+-]\d+)?$/i;

export function parseDiceExpression(expression: string): DiceExpression {
  const match = diceExpressionPattern.exec(expression.trim());
  if (match === null) {
    throw new Error(`Invalid dice expression: ${expression}`);
  }

  const hasDicePrefix = match[1] !== undefined || expression.toLowerCase().includes("d");
  const count = hasDicePrefix ? Number(match[1] === "" || match[1] === undefined ? 1 : match[1]) : 1;
  const sides = Number(match[2]);
  const modifier = match[3] === undefined ? 0 : Number(match[3]);

  if (!Number.isInteger(count) || count < 1) throw new Error("Dice count must be at least 1.");
  if (!Number.isInteger(sides) || sides < 1) throw new Error("Dice sides must be at least 1.");

  return { count, sides, modifier };
}

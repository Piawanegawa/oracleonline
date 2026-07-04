import type { DiceRoller } from "./DiceRoller.js";

export interface InlineDiceRoll {
  expression: string;
  total: number;
  rolls: number[];
  modifier: number;
}

export interface InlineDiceResolution {
  text: string;
  rolls: InlineDiceRoll[];
}

const parenthesizedQuantityPattern = /^([^()]+?)\s*\((.*?),\s*(\d*d\d+(?:[+-]\d+)?)\)$/i;
const trailingQuantityPattern = /^([^()]+?)\s*\((\d*d\d+(?:[+-]\d+)?)\)$/i;
const inlineDicePattern = /\((\d*d\d+(?:[+-]\d+)?)\)/gi;

export function resolveInlineDice(text: string, diceRoller: DiceRoller): InlineDiceResolution {
  const rolls: InlineDiceRoll[] = [];
  const parenthesizedQuantityMatch = parenthesizedQuantityPattern.exec(text);

  if (
    parenthesizedQuantityMatch !== null &&
    parenthesizedQuantityMatch[1] !== undefined &&
    parenthesizedQuantityMatch[2] !== undefined &&
    parenthesizedQuantityMatch[3] !== undefined
  ) {
    const roll = diceRoller.roll(parenthesizedQuantityMatch[3]);
    rolls.push({
      expression: parenthesizedQuantityMatch[3],
      total: roll.total,
      rolls: roll.rolls,
      modifier: roll.modifier
    });

    return {
      text: `${roll.total} ${parenthesizedQuantityMatch[1].trim().toLowerCase()} (${parenthesizedQuantityMatch[2].trim()})`,
      rolls
    };
  }

  const trailingQuantityMatch = trailingQuantityPattern.exec(text);
  if (
    trailingQuantityMatch !== null &&
    trailingQuantityMatch[1] !== undefined &&
    trailingQuantityMatch[2] !== undefined
  ) {
    const roll = diceRoller.roll(trailingQuantityMatch[2]);
    rolls.push({
      expression: trailingQuantityMatch[2],
      total: roll.total,
      rolls: roll.rolls,
      modifier: roll.modifier
    });

    return {
      text: `${roll.total} ${trailingQuantityMatch[1].trim().toLowerCase()}`,
      rolls
    };
  }

  return {
    text: text.replace(inlineDicePattern, (_match, expression: string) => {
      const roll = diceRoller.roll(expression);
      rolls.push({
        expression,
        total: roll.total,
        rolls: roll.rolls,
        modifier: roll.modifier
      });
      return String(roll.total);
    }),
    rolls
  };
}

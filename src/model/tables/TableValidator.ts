import type { RandomTable } from "./RandomTable.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRandomTable(table: RandomTable): ValidationResult {
  const errors: string[] = [];

  if (table.id.trim() === "") errors.push("Table id is required.");
  if (table.sourceId.trim() === "") errors.push("Source id is required.");
  if (table.sourceTitle.trim() === "") errors.push("Source title is required.");
  if (table.title.trim() === "") errors.push("Table title is required.");
  if (table.dice.trim() === "") errors.push("Dice expression is required.");
  if (table.category.length === 0) errors.push("At least one category is required.");
  if (table.entries.length === 0) errors.push("At least one table entry is required.");

  const sortedEntries = [...table.entries].sort((left, right) => left.min - right.min);
  for (const entry of sortedEntries) {
    if (!Number.isInteger(entry.min) || !Number.isInteger(entry.max)) {
      errors.push("Entry ranges must use integer values.");
    }
    if (entry.min > entry.max) errors.push(`Entry range ${entry.min}-${entry.max} is invalid.`);
    if (entry.text.trim() === "") errors.push(`Entry ${entry.min}-${entry.max} text is required.`);
  }

  for (let index = 1; index < sortedEntries.length; index += 1) {
    const previous = sortedEntries[index - 1];
    const current = sortedEntries[index];
    if (previous !== undefined && current !== undefined && current.min <= previous.max) {
      errors.push(`Entry range ${current.min}-${current.max} overlaps ${previous.min}-${previous.max}.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

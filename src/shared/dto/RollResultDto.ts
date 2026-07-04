export interface RollResultDto {
  tableId: string;
  roll: number;
  text: string;
  originalText?: string;
  inlineRolls: InlineRollResultDto[];
}

export interface InlineRollResultDto {
  expression: string;
  total: number;
  rolls: number[];
  modifier: number;
}

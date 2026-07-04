export interface RandomTable {
  id: string;
  sourceId: string;
  sourceTitle: string;
  title: string;
  category: string[];
  page?: number;
  dice: string;
  tags: string[];
  entries: RandomTableEntry[];
}

export interface RandomTableEntry {
  min: number;
  max: number;
  text: string;
}

export interface RandomTableDto {
  id: string;
  sourceId: string;
  sourceTitle: string;
  title: string;
  category: string[];
  page?: number;
  dice: string;
  tags: string[];
  entries: RandomTableEntryDto[];
  isFavorite: boolean;
}

export interface RandomTableEntryDto {
  min: number;
  max: number;
  text: string;
}

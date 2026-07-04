import type { RandomTableDto } from "../../shared/dto/RandomTableDto.js";
import type { RandomTable } from "../../model/tables/RandomTable.js";

export function toRandomTableDto(table: RandomTable, favoriteIds: Set<string>): RandomTableDto {
  return {
    ...table,
    isFavorite: favoriteIds.has(table.id)
  };
}

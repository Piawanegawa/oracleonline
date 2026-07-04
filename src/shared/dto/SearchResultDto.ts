import type { RandomTableDto } from "./RandomTableDto.js";

export interface SearchResultDto {
  query: string;
  results: RandomTableDto[];
}

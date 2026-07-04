import type { FastifyInstance } from "fastify";
import type { SearchResultDto } from "../../shared/dto/SearchResultDto.js";
import type { RouteContext } from "./routeContext.js";
import { toRandomTableDto } from "./tableMapper.js";

export async function searchRoutes(app: FastifyInstance, context: RouteContext): Promise<void> {
  app.get<{ Querystring: { q?: string } }>("/api/search", async (request): Promise<SearchResultDto> => {
    const query = request.query.q ?? "";
    const [tables, favorites] = await Promise.all([
      context.tableRepository.search(query),
      context.favoriteRepository.list()
    ]);

    return {
      query,
      results: tables.map((table) => toRandomTableDto(table, favorites))
    };
  });
}

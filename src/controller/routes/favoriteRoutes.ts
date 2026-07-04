import type { FastifyInstance } from "fastify";
import type { RouteContext } from "./routeContext.js";
import { toRandomTableDto } from "./tableMapper.js";

export async function favoriteRoutes(app: FastifyInstance, context: RouteContext): Promise<void> {
  app.get("/api/favorites", async () => {
    const [tables, favorites] = await Promise.all([
      context.tableRepository.list(),
      context.favoriteRepository.list()
    ]);
    return tables.filter((table) => favorites.has(table.id)).map((table) => toRandomTableDto(table, favorites));
  });

  app.post<{ Params: { tableId: string } }>("/api/favorites/:tableId", async (request, reply) => {
    const table = await context.tableRepository.findById(request.params.tableId);
    if (table === undefined) {
      return reply.code(404).send({ message: "Table not found." });
    }

    await context.favoriteRepository.add(table.id);
    const favorites = await context.favoriteRepository.list();
    return toRandomTableDto(table, favorites);
  });

  app.delete<{ Params: { tableId: string } }>("/api/favorites/:tableId", async (request, reply) => {
    const table = await context.tableRepository.findById(request.params.tableId);
    if (table === undefined) {
      return reply.code(404).send({ message: "Table not found." });
    }

    await context.favoriteRepository.remove(table.id);
    const favorites = await context.favoriteRepository.list();
    return toRandomTableDto(table, favorites);
  });
}

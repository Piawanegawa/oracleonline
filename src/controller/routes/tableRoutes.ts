import type { FastifyInstance } from "fastify";
import type { RouteContext } from "./routeContext.js";
import { toRandomTableDto } from "./tableMapper.js";

export async function tableRoutes(app: FastifyInstance, context: RouteContext): Promise<void> {
  app.get("/api/tables", async () => {
    const [tables, favorites] = await Promise.all([
      context.tableRepository.list(),
      context.favoriteRepository.list()
    ]);
    return tables.map((table) => toRandomTableDto(table, favorites));
  });

  app.get<{ Params: { id: string } }>("/api/tables/:id", async (request, reply) => {
    const table = await context.tableRepository.findById(request.params.id);
    if (table === undefined) {
      return reply.code(404).send({ message: "Table not found." });
    }

    const favorites = await context.favoriteRepository.list();
    return toRandomTableDto(table, favorites);
  });
}

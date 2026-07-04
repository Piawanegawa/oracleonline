import type { FastifyInstance } from "fastify";
import type { RouteContext } from "./routeContext.js";

export async function indexRoutes(app: FastifyInstance, context: RouteContext): Promise<void> {
  app.post("/api/index/rebuild", async () => {
    const sources = await context.pdfScanner.findAvailableSources();
    const tables = await context.pluginRegistry.extractTables(sources);
    await context.tableRepository.replaceAll(tables);

    return {
      tableCount: tables.length
    };
  });
}

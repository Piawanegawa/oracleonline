import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { fileURLToPath } from "node:url";
import { favoriteRoutes } from "./controller/routes/favoriteRoutes.js";
import { indexRoutes } from "./controller/routes/indexRoutes.js";
import { rollRoutes } from "./controller/routes/rollRoutes.js";
import { searchRoutes } from "./controller/routes/searchRoutes.js";
import { tableRoutes } from "./controller/routes/tableRoutes.js";
import type { RouteContext } from "./controller/routes/routeContext.js";
import { DiceRoller } from "./model/dice/DiceRoller.js";
import { LocalPdfScanner } from "./model/pdf/PdfScanner.js";
import { PluginRegistry } from "./model/plugins/PluginRegistry.js";
import { BookOfRandomTables5Plugin } from "./model/plugins/systems/book-of-random-tables-5/BookOfRandomTables5Plugin.js";
import { InMemoryFavoriteRepository } from "./model/storage/FavoriteRepository.js";
import { InMemoryTableRepository } from "./model/tables/TableRepository.js";

export async function createDefaultRouteContext(): Promise<RouteContext> {
  const pluginRegistry = new PluginRegistry();
  pluginRegistry.register(new BookOfRandomTables5Plugin());

  const pdfScanner = new LocalPdfScanner();
  const tableRepository = new InMemoryTableRepository();
  const favoriteRepository = new InMemoryFavoriteRepository();
  const diceRoller = new DiceRoller();

  const tables = await pluginRegistry.extractTables(await pdfScanner.findAvailableSources());
  await tableRepository.replaceAll(tables);

  return {
    tableRepository,
    favoriteRepository,
    diceRoller,
    pluginRegistry,
    pdfScanner
  };
}

export async function buildApp(context?: RouteContext): Promise<FastifyInstance> {
  const routeContext = context ?? (await createDefaultRouteContext());
  const app = Fastify({
    logger: true
  });

  await app.register(cors, {
    origin: true
  });

  await app.register(tableRoutes, routeContext);
  await app.register(searchRoutes, routeContext);
  await app.register(rollRoutes, routeContext);
  await app.register(favoriteRoutes, routeContext);
  await app.register(indexRoutes, routeContext);

  return app;
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  const app = await buildApp();
  const port = Number(process.env.PORT ?? 3000);

  await app.listen({
    port,
    host: "127.0.0.1"
  });
}

import type { FastifyInstance } from "fastify";
import { resolveInlineDice } from "../../model/dice/InlineDiceResolver.js";
import type { RollResultDto } from "../../shared/dto/RollResultDto.js";
import type { RouteContext } from "./routeContext.js";

export async function rollRoutes(app: FastifyInstance, context: RouteContext): Promise<void> {
  app.post<{ Params: { tableId: string } }>("/api/roll/:tableId", async (request, reply): Promise<RollResultDto | void> => {
    const table = await context.tableRepository.findById(request.params.tableId);
    if (table === undefined) {
      return reply.code(404).send({ message: "Table not found." });
    }

    const roll = context.diceRoller.roll(table.dice);
    const entry = table.entries.find((candidate) => roll.total >= candidate.min && roll.total <= candidate.max);
    if (entry === undefined) {
      return reply.code(422).send({ message: `Roll ${roll.total} does not match any entry.` });
    }

    const inlineDiceResolution = resolveInlineDice(entry.text, context.diceRoller);

    return {
      tableId: table.id,
      roll: roll.total,
      text: inlineDiceResolution.text,
      ...(inlineDiceResolution.rolls.length === 0 ? {} : { originalText: entry.text }),
      inlineRolls: inlineDiceResolution.rolls
    };
  });
}

import { describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";

describe("table loading", () => {
  it("serves indexed tables through the API", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/tables"
    });

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.json())).toBe(true);

    await app.close();
  });
});

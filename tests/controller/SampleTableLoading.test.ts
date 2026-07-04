import { describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";

describe("sample table loading", () => {
  it("serves sample tables through the API", async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/tables"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "test-book-forest-encounters",
          isFavorite: false
        })
      ])
    );

    await app.close();
  });
});

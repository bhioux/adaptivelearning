import { describe, expect, it } from "vitest";
import { AppError, badRequest, forbidden, notFound, toErrorPayload } from "../src/errors/AppError";

describe("AppError", () => {
  it("maps AppError to {status, body}", () => {
    const { status, body } = toErrorPayload(badRequest("bad input", { field: "x" }));
    expect(status).toBe(400);
    expect(body.error.code).toBe("BAD_REQUEST");
    expect(body.error.message).toBe("bad input");
    expect(body.error.details).toEqual({ field: "x" });
  });

  it("maps non-AppError to 500 INTERNAL_ERROR", () => {
    const { status, body } = toErrorPayload(new Error("boom"));
    expect(status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });

  it("sets expected status codes and codes", () => {
    expect(new AppError(404, "NOT_FOUND").statusCode).toBe(404);
    expect(forbidden().statusCode).toBe(403);
    expect(forbidden().code).toBe("FORBIDDEN");
    expect(notFound().statusCode).toBe(404);
    expect(badRequest("x").code).toBe("BAD_REQUEST");
  });
});

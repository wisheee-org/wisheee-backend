import { describe, expect, it } from "vitest";
import { CreateRequestSchema, ListRequestsSchema, RequestIdParamsSchema } from "./request.validation";

describe("friend request validation", () => {
  it("rejects an empty addressee id", () => {
    expect(() => CreateRequestSchema.parse({ addresseeId: "" })).toThrow();
  });

  it("defaults request direction to incoming", () => {
    expect(ListRequestsSchema.parse({})).toEqual({ direction: "incoming" });
  });

  it("rejects an unsupported request direction", () => {
    expect(() => ListRequestsSchema.parse({ direction: "all" })).toThrow();
  });

  it("requires a non-empty request id", () => {
    expect(() => RequestIdParamsSchema.parse({ requestId: "" })).toThrow();
  });
});

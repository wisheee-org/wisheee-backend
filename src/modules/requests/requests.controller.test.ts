import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

const { requestsServiceMock } = vi.hoisted(() => ({
  requestsServiceMock: {
    acceptRequest: vi.fn(),
    deleteRequest: vi.fn(),
    getRequests: vi.fn(),
    sendRequest: vi.fn(),
  },
}));

vi.mock("./requests.service", () => ({ requestsService: requestsServiceMock }));

import { requestsController } from "./requests.controller";

function createResponse() {
  const response = {
    json: vi.fn(),
    send: vi.fn(),
    status: vi.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  response.send.mockReturnValue(response);
  return response as unknown as Response;
}

function createRequest(overrides: Partial<Request> = {}) {
  return {
    body: {},
    params: {},
    query: {},
    user: { id: "sender" },
    ...overrides,
  } as Request;
}

describe("requestsController", () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.resetAllMocks();
    next = vi.fn();
  });

  it("returns 201 for a newly pending request", async () => {
    const result = { status: "pending", request: { id: "request-1" } };
    requestsServiceMock.sendRequest.mockResolvedValue(result);
    const response = createResponse();

    await requestsController.create(createRequest({ body: { addresseeId: "addressee" } }), response, next);

    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith({ data: result });
  });

  it("returns 200 when a reverse request is accepted", async () => {
    const result = { status: "accepted", friend: { id: "addressee" } };
    requestsServiceMock.sendRequest.mockResolvedValue(result);
    const response = createResponse();

    await requestsController.create(createRequest({ body: { addresseeId: "addressee" } }), response, next);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ data: result });
  });

  it("returns incoming requests by default", async () => {
    requestsServiceMock.getRequests.mockResolvedValue([{ id: "request-1" }]);
    const response = createResponse();

    await requestsController.getList(createRequest(), response, next);

    expect(requestsServiceMock.getRequests).toHaveBeenCalledWith("sender", "incoming");
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it("returns the accepted friend", async () => {
    requestsServiceMock.acceptRequest.mockResolvedValue({ id: "friend" });
    const response = createResponse();

    await requestsController.accept(createRequest({ params: { requestId: "request-1" } }), response, next);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ data: { id: "friend" } });
  });

  it("returns 204 after cancellation or rejection", async () => {
    requestsServiceMock.deleteRequest.mockResolvedValue(undefined);
    const response = createResponse();

    await requestsController.delete(createRequest({ params: { requestId: "request-1" } }), response, next);

    expect(response.status).toHaveBeenCalledWith(204);
    expect(response.send).toHaveBeenCalledWith();
  });

  it("forwards service errors to error middleware", async () => {
    const error = new Error("failed");
    requestsServiceMock.sendRequest.mockRejectedValue(error);

    await requestsController.create(
      createRequest({ body: { addresseeId: "addressee" } }),
      createResponse(),
      next,
    );

    expect(next).toHaveBeenCalledWith(error);
  });
});

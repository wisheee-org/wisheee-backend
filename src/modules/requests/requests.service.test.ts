import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
    friend: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    friendRequest: {
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { requestsService } from "./requests.service";

const sender = {
  id: "sender",
  email: "sender@example.com",
  username: "sender",
  avatar: null,
  createdAt: new Date("2026-08-01T00:00:00.000Z"),
};

const addressee = {
  id: "addressee",
  email: "addressee@example.com",
  username: "addressee",
  avatar: null,
  createdAt: new Date("2026-08-02T00:00:00.000Z"),
};

describe("requestsService.sendRequest", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));
  });

  it("creates one pending request for an unordered user pair", async () => {
    prismaMock.user.findUnique.mockResolvedValue(addressee);
    prismaMock.friend.findUnique.mockResolvedValue(null);
    prismaMock.friendRequest.findUnique.mockResolvedValue(null);
    prismaMock.friendRequest.create.mockResolvedValue({
      id: "request-1",
      sender,
      addressee,
      createdAt: new Date("2026-08-08T00:00:00.000Z"),
    });

    const result = await requestsService.sendRequest("sender", "addressee");

    expect(result).toEqual({
      status: "pending",
      request: {
        id: "request-1",
        sender,
        addressee,
        createdAt: new Date("2026-08-08T00:00:00.000Z"),
      },
    });
    expect(prismaMock.friendRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          senderId: "sender",
          addresseeId: "addressee",
          pairKey: "addressee:sender",
        },
      }),
    );
  });

  it("rejects a request sent to the same user", async () => {
    await expect(requestsService.sendRequest("sender", "sender")).rejects.toMatchObject({
      statusCode: 400,
      code: "SELF_FRIEND_REQUEST",
    });
  });

  it("rejects a request to an unknown user", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(requestsService.sendRequest("sender", "missing")).rejects.toMatchObject({
      statusCode: 404,
      code: "USER_NOT_FOUND",
    });
  });

  it("rejects a request when the users are already friends", async () => {
    prismaMock.user.findUnique.mockResolvedValue(addressee);
    prismaMock.friend.findUnique.mockResolvedValue({ id: "friendship" });

    await expect(requestsService.sendRequest("sender", "addressee")).rejects.toMatchObject({
      statusCode: 409,
      code: "ALREADY_FRIENDS",
    });
  });

  it("rejects a duplicate request in the same direction", async () => {
    prismaMock.user.findUnique.mockResolvedValue(addressee);
    prismaMock.friend.findUnique.mockResolvedValue(null);
    prismaMock.friendRequest.findUnique.mockResolvedValue({
      id: "request-1",
      senderId: "sender",
      addresseeId: "addressee",
    });

    await expect(requestsService.sendRequest("sender", "addressee")).rejects.toMatchObject({
      statusCode: 409,
      code: "FRIEND_REQUEST_ALREADY_EXISTS",
    });
  });

  it("accepts a reverse request and returns the new friend", async () => {
    prismaMock.user.findUnique.mockResolvedValue(addressee);
    prismaMock.friend.findUnique.mockResolvedValue(null);
    prismaMock.friendRequest.findUnique.mockResolvedValue({
      id: "request-1",
      senderId: "addressee",
      addresseeId: "sender",
    });
    prismaMock.friend.create.mockResolvedValue({ id: "friendship" });
    prismaMock.friendRequest.delete.mockResolvedValue({ id: "request-1" });

    await expect(requestsService.sendRequest("sender", "addressee")).resolves.toEqual({
      status: "accepted",
      friend: addressee,
    });
    expect(prismaMock.friend.create).toHaveBeenCalledWith({
      data: { user1Id: "addressee", user2Id: "sender" },
    });
    expect(prismaMock.friendRequest.delete).toHaveBeenCalledWith({ where: { id: "request-1" } });
  });

  it.each(["P2002", "P2034"])("retries Prisma %s once", async (code) => {
    prismaMock.$transaction
      .mockRejectedValueOnce({ code })
      .mockImplementationOnce(async (callback) => callback(prismaMock));
    prismaMock.user.findUnique.mockResolvedValue(addressee);
    prismaMock.friend.findUnique.mockResolvedValue(null);
    prismaMock.friendRequest.findUnique.mockResolvedValue(null);
    prismaMock.friendRequest.create.mockResolvedValue({
      id: "request-1",
      sender,
      addressee,
      createdAt: new Date("2026-08-08T00:00:00.000Z"),
    });

    await expect(requestsService.sendRequest("sender", "addressee")).resolves.toMatchObject({ status: "pending" });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(2);
  });
});

describe("requestsService request lifecycle", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));
  });

  it("lists incoming requests newest first", async () => {
    const request = { id: "request-1", sender, addressee, createdAt: new Date("2026-08-08T00:00:00.000Z") };
    prismaMock.friendRequest.findMany.mockResolvedValue([request]);

    await expect(requestsService.getRequests("addressee", "incoming")).resolves.toEqual([request]);
    expect(prismaMock.friendRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { addresseeId: "addressee" }, orderBy: { createdAt: "desc" } }),
    );
  });

  it("lists outgoing requests", async () => {
    prismaMock.friendRequest.findMany.mockResolvedValue([]);

    await requestsService.getRequests("sender", "outgoing");

    expect(prismaMock.friendRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { senderId: "sender" } }),
    );
  });

  it("lets only the addressee accept a request", async () => {
    prismaMock.friendRequest.findUnique.mockResolvedValue({
      id: "request-1",
      senderId: "sender",
      addresseeId: "addressee",
      sender,
    });
    prismaMock.friend.create.mockResolvedValue({ id: "friendship" });
    prismaMock.friendRequest.delete.mockResolvedValue({ id: "request-1" });

    await expect(requestsService.acceptRequest("addressee", "request-1")).resolves.toEqual(sender);
    expect(prismaMock.friend.create).toHaveBeenCalledWith({ data: { user1Id: "addressee", user2Id: "sender" } });
  });

  it("rejects acceptance by a user other than the addressee", async () => {
    prismaMock.friendRequest.findUnique.mockResolvedValue({
      id: "request-1",
      senderId: "sender",
      addresseeId: "addressee",
      sender,
    });

    await expect(requestsService.acceptRequest("stranger", "request-1")).rejects.toMatchObject({
      statusCode: 403,
      code: "FRIEND_REQUEST_FORBIDDEN",
    });
  });

  it("returns not found for a missing request", async () => {
    prismaMock.friendRequest.findUnique.mockResolvedValue(null);

    await expect(requestsService.acceptRequest("addressee", "missing")).rejects.toMatchObject({
      statusCode: 404,
      code: "FRIEND_REQUEST_NOT_FOUND",
    });
  });

  it.each(["sender", "addressee"])("lets %s delete the request", async (userId) => {
    prismaMock.friendRequest.findUnique.mockResolvedValue({
      id: "request-1",
      senderId: "sender",
      addresseeId: "addressee",
    });
    prismaMock.friendRequest.delete.mockResolvedValue({ id: "request-1" });

    await expect(requestsService.deleteRequest(userId, "request-1")).resolves.toBeUndefined();
  });

  it("rejects deletion by an unrelated user", async () => {
    prismaMock.friendRequest.findUnique.mockResolvedValue({
      id: "request-1",
      senderId: "sender",
      addresseeId: "addressee",
    });

    await expect(requestsService.deleteRequest("stranger", "request-1")).rejects.toMatchObject({
      statusCode: 403,
      code: "FRIEND_REQUEST_FORBIDDEN",
    });
  });
});

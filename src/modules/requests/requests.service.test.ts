import { beforeEach, describe, expect, it, vi } from "vitest";

const { friendNotificationWriterMock, prismaMock, realtimeServerFake } = vi.hoisted(() => ({
  friendNotificationWriterMock: {
    createPair: vi.fn(),
  },
  realtimeServerFake: {
    to: () => ({
      emit: () => undefined,
    }),
  },
  prismaMock: {
    $transaction: vi.fn(),
    friend: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    friendNotification: {
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    friendRequest: {
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("../notifications/notifications.writer", () => ({
  friendNotificationWriter: friendNotificationWriterMock,
}));
vi.mock("@/lib/realtime/realtime.server", () => ({
  getRealtimeServer: () => realtimeServerFake,
}));

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

const request = {
  id: "request-1",
  senderId: "sender",
  addresseeId: "addressee",
  sender,
};

describe("requestsService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));
  });

  describe("sendRequest", () => {
    it("creates a pending request and a notification pair", async () => {
      const createdAt = new Date("2026-08-08T00:00:00.000Z");
      prismaMock.user.findUnique.mockResolvedValue(addressee);
      prismaMock.friend.findUnique.mockResolvedValue(null);
      prismaMock.friendRequest.findUnique.mockResolvedValue(null);
      prismaMock.friendRequest.create.mockResolvedValue({
        id: "request-1",
        sender,
        addressee,
        createdAt,
      });

      const result = await requestsService.sendRequest("sender", "addressee");

      expect(result).toEqual({
        status: "pending",
        request: { id: "request-1", sender, addressee, createdAt },
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
      expect(friendNotificationWriterMock.createPair).toHaveBeenCalledWith(prismaMock, {
        actorId: "sender",
        otherUserId: "addressee",
        entityId: "request-1",
        type: "FRIEND_REQUEST_CREATED",
        occurredAt: expect.any(Date),
      });
    });

    it("rejects a request sent to the same user", async () => {
      await expect(requestsService.sendRequest("sender", "sender")).rejects.toMatchObject({
        statusCode: 400,
        code: "SELF_FRIEND_REQUEST",
      });
      expect(friendNotificationWriterMock.createPair).not.toHaveBeenCalled();
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
      prismaMock.friendRequest.findUnique.mockResolvedValue(request);

      await expect(requestsService.sendRequest("sender", "addressee")).rejects.toMatchObject({
        statusCode: 409,
        code: "FRIEND_REQUEST_ALREADY_EXISTS",
      });
    });

    it("accepts a reverse request and replaces its notification pair", async () => {
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
      expect(prismaMock.friendNotification.deleteMany).toHaveBeenCalledWith({
        where: { entityId: "request-1", type: "FRIEND_REQUEST_CREATED" },
      });
      expect(friendNotificationWriterMock.createPair).toHaveBeenCalledWith(prismaMock, {
        actorId: "sender",
        otherUserId: "addressee",
        entityId: "request-1",
        type: "FRIEND_REQUEST_ACCEPTED",
        occurredAt: expect.any(Date),
      });
    });

    it.each(["P2002", "P2034"])("retries Prisma %s once", async (code) => {
      prismaMock.$transaction.mockRejectedValueOnce({ code }).mockImplementationOnce(async (callback) => callback(prismaMock));
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
      expect(friendNotificationWriterMock.createPair).toHaveBeenCalledTimes(1);
    });
  });

  describe("acceptRequest", () => {
    it("lets only the addressee accept and replaces the notification pair", async () => {
      prismaMock.friendRequest.findUnique.mockResolvedValue(request);
      prismaMock.friend.create.mockResolvedValue({ id: "friendship" });
      prismaMock.friendRequest.delete.mockResolvedValue({ id: "request-1" });

      await expect(requestsService.acceptRequest("addressee", "request-1")).resolves.toEqual(sender);

      expect(prismaMock.friend.create).toHaveBeenCalledWith({
        data: { user1Id: "addressee", user2Id: "sender" },
      });
      expect(prismaMock.friendNotification.deleteMany).toHaveBeenCalledWith({
        where: { entityId: "request-1", type: "FRIEND_REQUEST_CREATED" },
      });
      expect(friendNotificationWriterMock.createPair).toHaveBeenCalledWith(prismaMock, {
        actorId: "addressee",
        otherUserId: "sender",
        entityId: "request-1",
        type: "FRIEND_REQUEST_ACCEPTED",
        occurredAt: expect.any(Date),
      });
    });

    it("rejects acceptance by a user other than the addressee", async () => {
      prismaMock.friendRequest.findUnique.mockResolvedValue(request);

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
  });

  describe("rejectRequest", () => {
    it("lets only the addressee reject and replaces the notification pair", async () => {
      prismaMock.friendRequest.findUnique.mockResolvedValue(request);
      prismaMock.friendRequest.delete.mockResolvedValue({ id: "request-1" });

      await expect(requestsService.rejectRequest("addressee", "request-1")).resolves.toEqual(sender);

      expect(prismaMock.friend.create).not.toHaveBeenCalled();
      expect(prismaMock.friendNotification.deleteMany).toHaveBeenCalledWith({
        where: { entityId: "request-1", type: "FRIEND_REQUEST_CREATED" },
      });
      expect(friendNotificationWriterMock.createPair).toHaveBeenCalledWith(prismaMock, {
        actorId: "addressee",
        otherUserId: "sender",
        entityId: "request-1",
        type: "FRIEND_REQUEST_REJECTED",
        occurredAt: expect.any(Date),
      });
    });

    it("rejects rejection by a user other than the addressee", async () => {
      prismaMock.friendRequest.findUnique.mockResolvedValue(request);

      await expect(requestsService.rejectRequest("sender", "request-1")).rejects.toMatchObject({
        statusCode: 403,
        code: "FRIEND_REQUEST_FORBIDDEN",
      });
    });
  });

  describe("deleteRequest", () => {
    it("lets the sender cancel a request and deletes its notification pair", async () => {
      prismaMock.friendRequest.findUnique.mockResolvedValue(request);
      prismaMock.friendRequest.delete.mockResolvedValue({ id: "request-1" });

      await expect(requestsService.deleteRequest("sender", "request-1")).resolves.toBeUndefined();

      expect(prismaMock.friendNotification.deleteMany).toHaveBeenCalledWith({
        where: { entityId: "request-1" },
      });
      expect(friendNotificationWriterMock.createPair).not.toHaveBeenCalled();
    });

    it("lets the addressee delete the request", async () => {
      prismaMock.friendRequest.findUnique.mockResolvedValue(request);
      prismaMock.friendRequest.delete.mockResolvedValue({ id: "request-1" });

      await expect(requestsService.deleteRequest("addressee", "request-1")).resolves.toBeUndefined();

      expect(prismaMock.friendNotification.deleteMany).toHaveBeenCalledWith({
        where: { entityId: "request-1" },
      });
    });

    it("rejects cancellation by an unrelated user", async () => {
      prismaMock.friendRequest.findUnique.mockResolvedValue(request);

      await expect(requestsService.deleteRequest("stranger", "request-1")).rejects.toMatchObject({
        statusCode: 403,
        code: "FRIEND_REQUEST_FORBIDDEN",
      });
    });
  });
});

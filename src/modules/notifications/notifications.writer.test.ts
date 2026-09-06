import type { Prisma } from "@/generated/prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { friendNotificationWriter } from "./notifications.writer";

describe("friendNotificationWriter.createPair", () => {
  const create = vi.fn();
  const tx = {
    friendNotification: { create },
  } as unknown as Prisma.TransactionClient;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each([
    "FRIEND_REQUEST_CREATED",
    "FRIEND_REQUEST_ACCEPTED",
    "FRIEND_REQUEST_REJECTED",
  ] as const)("creates personal history and inbox rows for %s", async (type) => {
    const occurredAt = new Date("2026-09-06T10:00:00.000Z");
    create.mockResolvedValue({ id: "notification" });

    await friendNotificationWriter.createPair(tx, {
      actorId: "actor",
      otherUserId: "other-user",
      entityId: "request-1",
      type,
      occurredAt,
    });

    expect(create).toHaveBeenNthCalledWith(1, {
      data: {
        actorId: "actor",
        recipientId: "actor",
        counterpartyId: "other-user",
        type,
        entityId: "request-1",
        readAt: occurredAt,
      },
    });
    expect(create).toHaveBeenNthCalledWith(2, {
      data: {
        actorId: "actor",
        recipientId: "other-user",
        counterpartyId: "actor",
        type,
        entityId: "request-1",
        readAt: null,
      },
    });
  });
});

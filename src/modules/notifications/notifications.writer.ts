import type { FriendNotificationType, Prisma } from "@/generated/prisma/client";

export const friendNotificationWriter = {
  async createPair(
    tx: Prisma.TransactionClient,
    {
      actorId,
      otherUserId,
      entityId,
      type,
      occurredAt,
    }: { actorId: string; otherUserId: string; entityId: string; type: FriendNotificationType; occurredAt: Date | null },
  ) {
    await tx.friendNotification.create({
      data: {
        recipientId: actorId,
        actorId,
        counterpartyId: otherUserId,
        type,
        entityId,
        readAt: occurredAt,
      },
    });
    await tx.friendNotification.create({
      data: {
        recipientId: otherUserId,
        actorId: actorId,
        counterpartyId: actorId,
        type,
        entityId,
        readAt: null,
      },
    });
  },
};

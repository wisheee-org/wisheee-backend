import { prisma } from "@/lib/prisma";
import { friendNotificationSelect, type NotificationListDto } from "./notifications.responses";

// function _getPair(userId: string, otherUserId: string) {
//   const [user1Id, user2Id] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];
//   return { user1Id, user2Id, pairKey: `${user1Id}:${user2Id}` };
// }

// function _isRetryableTransactionError(error: unknown): error is { code: "P2002" | "P2034" } {
//   if (typeof error !== "object" || error === null || !("code" in error)) return false;
//   return error.code === "P2002" || error.code === "P2034";
// }

// async function _runSerializable<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
//   for (let attempt = 0; attempt < 2; attempt += 1) {
//     try {
//       return await prisma.$transaction(operation, {
//         isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
//       });
//     } catch (e) {
//       if (attempt === 1 || !_isRetryableTransactionError(e)) throw e;
//     }
//   }

//   throw new Error("Unreachable transaction retry state");
// }

export const notificationsService = {
  async getList(id: string): Promise<NotificationListDto> {
    const friendNotifications = await prisma.friendNotification.findMany({
      where: { recipientId: id },
      select: friendNotificationSelect,
      orderBy: { createdAt: "desc" },
    });

    let unreadCount = 0;
    for (const notification of friendNotifications) {
      if (!notification.readAt) unreadCount++;
    }

    return { items: friendNotifications, unreadCount };
  },
};

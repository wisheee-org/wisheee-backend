import type { Prisma } from "@/generated/prisma/client";
import { publicUserSelect } from "@/shared/prisma/user.select";

export const friendNotificationSelect = {
  id: true,
  type: true,
  entityId: true,
  actor: { select: publicUserSelect },
  recipient: { select: publicUserSelect },
  counterparty: { select: publicUserSelect },
  readAt: true,
  createdAt: true,
};

export type NotificationListDto = {
  items: FriendNotification[];
  unreadCount: number;
};

export type FriendNotification = Prisma.FriendNotificationGetPayload<{
  select: typeof friendNotificationSelect;
}>;

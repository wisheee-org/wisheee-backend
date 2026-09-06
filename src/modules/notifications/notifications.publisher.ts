import { getRealtimeServer } from "@/lib/realtime/realtime.server";

export const notificationsPublisher = {
  changed(userIds: string[]) {
    const io = getRealtimeServer();

    for (const userId of new Set(userIds)) {
      io.to(`user:${userId}`).emit("notifications:changed");
    }
  },
};

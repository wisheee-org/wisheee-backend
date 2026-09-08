import { getPair } from "@/common/utils/get-ids-pair";
import { runSerializable } from "@/common/utils/run-serializable";
import { prisma } from "@/lib/prisma";
import { publicUserSelect, type PublicUserDto } from "@/shared/prisma/user.select";
import { notificationsPublisher } from "../notifications/notifications.publisher";

export const friendsService = {
  async getList(id: string): Promise<PublicUserDto[]> {
    const friends = await prisma.friend.findMany({
      where: {
        OR: [{ user1Id: id }, { user2Id: id }],
      },
      select: {
        user1: { select: publicUserSelect },
        user2: { select: publicUserSelect },
        user1Id: true,
        user2Id: true,
      },
    });
    return friends.map((friend) => (friend.user1Id === id ? friend.user2 : friend.user1));
  },

  async deleteFriend(id: string, friendId: string): Promise<void> {
    const pair = getPair(id, friendId);
    await runSerializable(async (tx) => {
      await tx.friend.deleteMany({ where: { user1Id: pair.user1Id, user2Id: pair.user2Id } });
      // TODO: conditions for deleting notifications
      // await tx.friendNotification.deleteMany({
      //   where: { actorId: id AND type: "FRIEND_REQUEST_ACCEPTED" },
      // });
      notificationsPublisher.changed([id, friendId]);
    });
  },
};

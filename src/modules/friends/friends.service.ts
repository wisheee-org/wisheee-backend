// before friendsheap creating
// const [user1Id, user2Id] =
//   requesterId < addresseeId
//     ? [requesterId, addresseeId]
//     : [addresseeId, requesterId];

import { prisma } from "@/lib/prisma";
import { publicUserSelect, type PublicUserDto } from "@/shared/prisma/user.select";

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
};

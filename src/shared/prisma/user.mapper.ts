import type { Prisma } from "@/generated/prisma/client";
import type { meSelect, MeDto } from "./user.select";

type MeData = Prisma.UserGetPayload<{ select: typeof meSelect }> & {
  _count: {
    friendshipsInitiated: number;
    friendshipsReceived: number;
    wishlists: number;
  };
};

export function mapMeDto(user: MeData): MeDto {
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    createdAt: user.createdAt,
    email: user.email,
    reservedItems: user.reservedItems.map(({ wishlist, ...item }) => ({
      ...item,
      owner: wishlist.owner,
    })),
    quantityOfFriends: user._count.friendshipsInitiated + user._count.friendshipsReceived,
    quantityOfWishlists: user._count.wishlists,
    quantityOfReservedGifts: user.reservedItems.length,
  };
}

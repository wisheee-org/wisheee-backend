import type { Prisma } from "@/generated/prisma/client";
import type { WishlistItemType } from "@/modules/wishlist-item/item.responses";

export const publicUserSelect = {
  id: true,
  username: true,
  avatar: true,
  createdAt: true,
} as const;

export const meSelect = {
  ...publicUserSelect,
  email: true,
  reservedItems: {
    include: { wishlist: { select: { owner: { select: publicUserSelect } } } },
  },
} as const;

export type PublicUserDto = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

export type PublicUserExtraDto = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}> & {
  quantityOfFriends: number;
  quantityOfPublicWishlists: number;
};

const { reservedItems, ...meSelectDto } = meSelect;
export type ReservedWishlistItemDto = WishlistItemType & {
  owner: PublicUserDto;
};

export type MeDto = Prisma.UserGetPayload<{
  select: typeof meSelectDto;
}> & {
  reservedItems: ReservedWishlistItemDto[];
  quantityOfFriends: number;
  quantityOfWishlists: number;
  quantityOfReservedGifts: number;
};

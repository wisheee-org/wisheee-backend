import type { Prisma } from "@/generated/prisma/client";

export const publicUserSelect = {
  id: true,
  username: true,
  avatar: true,
  createdAt: true,
} as const;

export const meSelect = {
  ...publicUserSelect,
  email: true,
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

export type MeDto = Prisma.UserGetPayload<{
  select: typeof meSelect;
}> & {
  quantityOfFriends: number;
  quantityOfWishlists: number;
  quantityOfReservedGifts: number;
};

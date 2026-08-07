import type { Prisma } from "@/generated/prisma/client";

export const wishlistItemSelect = {
  id: true,
  wishlistId: true,
  title: true,
  description: true,
  link: true,
  price: true,
  image: true,
  reserverId: true,
  createdAt: true,
} as const;

export type WishlistItemType = Prisma.WishlistItemGetPayload<{
  select: typeof wishlistItemSelect;
}>;

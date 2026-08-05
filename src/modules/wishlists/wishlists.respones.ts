import type { Prisma } from "@/generated/prisma/client";
import { wishlistItemSelect } from "../wishlist-item/item.responses";

export const publicWishlistSelect = {
  id: true,
  ownerId: true,
  title: true,
  description: true,
  isPublic: true,
  createdAt: true,
} as const;

export const publicWishlistWithItemsSelect = {
  id: true,
  ownerId: true,
  title: true,
  description: true,
  isPublic: true,
  createdAt: true,
  items: { select: wishlistItemSelect },
} as const;

export type PublicWishlistData = Prisma.WishlistGetPayload<{
  select: typeof publicWishlistSelect;
}>;
export type PublicWishlistWithItemsType = Prisma.WishlistGetPayload<{
  select: typeof publicWishlistWithItemsSelect;
}>;

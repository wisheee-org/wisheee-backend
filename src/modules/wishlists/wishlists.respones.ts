import type { Prisma } from "@/generated/prisma/client";

export const publicWishlistSelect = {
  id: true,
  ownerId: true,
  title: true,
  description: true,
  isPublic: true,
  createdAt: true,
} as const;

export type PublicWishlistData = Prisma.WishlistGetPayload<{
  select: typeof publicWishlistSelect;
}>;

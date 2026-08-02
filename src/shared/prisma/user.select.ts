import type { Prisma } from "@/generated/prisma/client";
import { publicWishlistSelect } from "@/modules/wishlists/wishlists.respones";

export const publicUserSelect = {
  id: true,
  email: true,
  username: true,
  avatar: true,
  wishlists: { select: publicWishlistSelect },
  createdAt: true,
} as const;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

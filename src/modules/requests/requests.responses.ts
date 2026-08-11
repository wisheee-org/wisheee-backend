import type { Prisma } from "@/generated/prisma/client";
import { publicUserSelect } from "@/shared/prisma/user.select";

export const friendRequestSelect = {
  id: true,
  sender: { select: publicUserSelect },
  addressee: { select: publicUserSelect },
  createdAt: true,
} as const;

export type FriendRequestDto = Prisma.FriendRequestGetPayload<{
  select: typeof friendRequestSelect;
}>;

export type SendRequestResult =
  | { status: "pending"; request: FriendRequestDto }
  | { status: "accepted"; friend: Prisma.UserGetPayload<{ select: typeof publicUserSelect }> };

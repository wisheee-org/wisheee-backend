import type { Prisma } from "@/generated/prisma/client";

export const publicUserSelect = {
  id: true,
  email: true,
  username: true,
  avatar: true,
  createdAt: true,
} as const;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

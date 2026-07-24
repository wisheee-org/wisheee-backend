import type { Prisma } from "@/generated/prisma/client";

export type PublicUser = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    username: true;
    avatar: true;
    createdAt: true;
  };
}>;

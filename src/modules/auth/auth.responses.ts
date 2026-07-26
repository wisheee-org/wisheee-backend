import type { Prisma } from "@/generated/prisma/client";

export const publicUserSelect = {
  id: true,
  email: true,
  username: true,
  avatar: true,
  createdAt: true,
} as const;

export const authUserSelect = {
  passwordHash: true,
  emailVerified: true,
} as const;

export type PublicUserDto = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

export interface SignInResponseDto extends AuthTokens {
  user: PublicUserDto;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

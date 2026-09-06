import type { PublicUserDto } from "@/shared/prisma/user.select";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SignInResponseDto extends AuthTokens {
  user: PublicUserDto;
}

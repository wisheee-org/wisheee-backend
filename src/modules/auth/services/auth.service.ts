import { prisma } from "@/lib/prisma";
import type { SignInSchemaType, SignUpSchemaType } from "@/modules/auth/auth.validation";
import { ConflictError } from "@/common/errors/conflict-error";
import { BadRequestError } from "@/common/errors/bad-request-error";
import { type AuthTokens, type SignInResponseDto } from "./../auth.responses";
import { UnauthorizedError } from "@/common/errors/unauthorized-error";
import { ForbiddenError } from "@/common/errors/forbidden-error";
import { cryptoService } from "./crypto.service";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { jwtService } from "./jwt.service";
import { meSelect, publicUserSelect, type MeDto } from "@/shared/prisma/user.select";
import { mapMeDto } from "@/shared/prisma/user.mapper";
import { passwordService } from "./password.service";
import { verificationTokenService } from "./verification-token.service";
import { mailService } from "./mail.service";

export const authService = {
  async init(refreshToken: string): Promise<MeDto | null> {
    if (!refreshToken) return null;

    const tokenHash = cryptoService.sha256(refreshToken);
    const tokenData = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: {
        expiresAt: true,
        user: {
          select: {
            ...meSelect,
            _count: {
              select: { friendshipsInitiated: true, friendshipsReceived: true, wishlists: true },
            },
          },
        },
      },
    });

    if (!tokenData || tokenData.expiresAt <= new Date()) return null;

    return mapMeDto(tokenData.user);
  },

  async signUp(dto: SignUpSchemaType): Promise<void> {
    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email: dto.email } }),
      prisma.user.findUnique({ where: { username: dto.username } }),
    ]);

    if (existingEmail) throw new ConflictError("EMAIL_ALREADY_EXISTS", "Пользователь с данным email уже существвует");
    if (existingUsername) throw new ConflictError("USERNAME_ALREADY_EXISTS", "Пользователь с данным username уже существвует");

    const passwordHash = await passwordService.hash(dto.password);

    const { token, tokenHash, expiresAt } = verificationTokenService.generate();

    const user = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash: passwordHash,
          username: dto.username,
        },
        select: meSelect,
      });

      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      return user;
    });

    mailService.sendVerificationEmail(user.email, token);
  },

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = cryptoService.sha256(token);

    const tokenData = await prisma.emailVerificationToken.findUnique({
      where: {
        tokenHash,
      },
      select: {
        id: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            emailVerified: true,
          },
        },
      },
    });

    if (!tokenData) throw new BadRequestError("INVALID_TOKEN", "Недействительный токен подтверждения.");
    if (tokenData.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: {
          id: tokenData.id,
        },
      });
      throw new ConflictError("TOKEN_IS_EXPIRED", "Токен устарел.");
    }
    if (tokenData?.user.emailVerified) throw new ConflictError("EMAIL_ALREADY_VERIFIED", "Email уже подтвержден.");

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: tokenData.user.id,
        },
        data: {
          emailVerified: true,
        },
        select: {
          ...publicUserSelect,
          emailVerified: true,
        },
      });

      await tx.emailVerificationToken.delete({
        where: {
          id: tokenData.id,
        },
      });
    });
  },

  async resendVerification(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        emailVerified: true,
      },
    });

    if (!user || user.emailVerified) return;

    const { token, tokenHash, expiresAt } = verificationTokenService.generate();

    await prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.deleteMany({
        where: {
          userId: user.id,
        },
      });
      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });
    });

    await mailService.sendVerificationEmail(email, token);
  },

  async signIn(dto: SignInSchemaType): Promise<SignInResponseDto> {
    const meData = await prisma.user.findUnique({
      where: {
        email: dto.email,
      },
      select: {
        ...meSelect,
        emailVerified: true,
        passwordHash: true,
        _count: {
          select: { friendshipsInitiated: true, friendshipsReceived: true, wishlists: true },
        },
      },
    });

    if (!meData) throw new UnauthorizedError("INVALID_CREDENTIALS", "Неверные email или пароль.");
    if (!meData.emailVerified) throw new ForbiddenError("EMAIL_NOT_VERIFIED", "Подтвердите email перед входом.");

    const isValidPassword = await passwordService.compare(dto.password, meData.passwordHash);
    if (!isValidPassword) throw new UnauthorizedError("INVALID_CREDENTIALS", "Неверные email или пароль.");

    const { accessToken, refreshToken } = await _createTokens(prisma, meData.id);

    return {
      user: mapMeDto(meData),
      accessToken,
      refreshToken,
    };
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    if (!refreshToken) throw new UnauthorizedError("NO_SESSION", "Недействительный refresh token.");

    const tokenHash = cryptoService.sha256(refreshToken);
    const tokenData = await prisma.refreshToken.findUnique({
      where: {
        tokenHash,
      },
      select: {
        tokenHash: true,
        expiresAt: true,
        userId: true,
      },
    });

    if (!tokenData) throw new UnauthorizedError("INVALID_REFRESH_TOKEN", "Недействительный refresh token.");
    if (tokenData.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: {
          tokenHash: tokenData.tokenHash,
        },
      });
      throw new UnauthorizedError("INVALID_REFRESH_TOKEN", "Refresh token истек.");
    }

    return prisma.$transaction(async (tx) => {
      await tx.refreshToken.delete({
        where: {
          tokenHash: tokenData.tokenHash,
        },
      });
      return await _createTokens(tx, tokenData.userId);
    });
  },

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    const tokenHash = cryptoService.sha256(refreshToken);
    await prisma.refreshToken.deleteMany({
      where: {
        tokenHash,
      },
    });
  },
};

async function _createTokens(db: Prisma.TransactionClient | PrismaClient, userId: string): Promise<AuthTokens> {
  const { accessToken, refreshTokenData } = jwtService.generateTokens({ sub: userId });

  const refreshTokenHash = cryptoService.sha256(refreshTokenData.token);
  await db.refreshToken.create({
    data: {
      userId,
      tokenHash: refreshTokenHash,
      expiresAt: refreshTokenData.expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenData.token,
  };
}

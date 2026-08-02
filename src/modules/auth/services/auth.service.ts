import { prisma } from "@/lib/prisma";
import type { SignInSchemaType, SignUpSchemaType } from "@/modules/auth/auth.validation";
import { ConflictError } from "@/common/errors/conflict-error";
import { PasswordService } from "@/modules/auth/services/password.service";
import { VerificationTokenService } from "@/modules/auth/services/verification-token.service";
import { MailService } from "./mail.service";
import { BadRequestError } from "@/common/errors/bad-request-error";
import { type AuthTokens, type SignInResponseDto } from "./../auth.responses";
import { UnauthorizedError } from "@/common/errors/unauthorized-error";
import { ForbiddenError } from "@/common/errors/forbidden-error";
import { CryptoService } from "./crypto.service";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { jwtService } from "./jwt.service";
import { publicUserSelect, type PublicUser } from "@/shared/prisma/user.select";

export class AuthService {
  private _prisma = prisma;
  private _jwtService = jwtService;
  private _passwordService = new PasswordService();
  private _verificationTokenService = new VerificationTokenService();
  private _mailService = new MailService();
  private _cryptoService = new CryptoService();

  async init(refreshToken: string): Promise<PublicUser | null> {
    if (!refreshToken) return null;

    const tokenHash = this._cryptoService.sha256(refreshToken);
    const data = await this._prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: {
        user: {
          select: publicUserSelect,
        },
      },
    });
    if (data) return data.user;
    return null;
  }

  async signUp(dto: SignUpSchemaType) {
    const [existingEmail, existingUsername] = await Promise.all([
      this._prisma.user.findUnique({ where: { email: dto.email } }),
      this._prisma.user.findUnique({ where: { username: dto.username } }),
    ]);

    if (existingEmail) throw new ConflictError("EMAIL_ALREADY_EXISTS", "Пользователь с данным email уже существвует");
    if (existingUsername) throw new ConflictError("USERNAME_ALREADY_EXISTS", "Пользователь с данным username уже существвует");

    const passwordHash = await this._passwordService.hash(dto.password);

    const { token, tokenHash, expiresAt } = this._verificationTokenService.generate();

    const user = await this._prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash: passwordHash,
          username: dto.username,
        },
        select: publicUserSelect,
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

    this._mailService.sendVerificationEmail(user.email, token);
  }

  async verifyEmail(token: string) {
    const tokenHash = this._cryptoService.sha256(token);

    const tokenData = await this._prisma.emailVerificationToken.findUnique({
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
      await this._prisma.emailVerificationToken.delete({
        where: {
          id: tokenData.id,
        },
      });
      throw new ConflictError("TOKEN_IS_EXPIRED", "Токен устарел.");
    }
    if (tokenData?.user.emailVerified) throw new ConflictError("EMAIL_ALREADY_VERIFIED", "Email уже подтвержден.");

    await this._prisma.$transaction(async (tx) => {
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
  }

  async resendVerification(email: string) {
    const user = await this._prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        emailVerified: true,
      },
    });

    if (!user || user.emailVerified) return;

    const { token, tokenHash, expiresAt } = this._verificationTokenService.generate();

    await this._prisma.$transaction(async (tx) => {
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

    await this._mailService.sendVerificationEmail(email, token);
  }

  async signIn(dto: SignInSchemaType): Promise<SignInResponseDto> {
    const user = await this._prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) throw new UnauthorizedError("INVALID_CREDENTIALS", "Неверные email или пароль.");
    if (!user.emailVerified) throw new ForbiddenError("EMAIL_NOT_VERIFIED", "Подтвердите email перед входом.");

    const isValidPassword = await this._passwordService.compare(dto.password, user.passwordHash);
    if (!isValidPassword) throw new UnauthorizedError("INVALID_CREDENTIALS", "Неверные email или пароль.");

    const { passwordHash, emailVerified, ...publicUser } = user;

    const { accessToken, refreshToken } = await this._createTokens(this._prisma, publicUser.id);

    return { user: publicUser, accessToken, refreshToken };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    if (!refreshToken) throw new UnauthorizedError("NO_SESSION", "Недействительный refresh token.");

    const tokenHash = this._cryptoService.sha256(refreshToken);
    const tokenData = await this._prisma.refreshToken.findUnique({
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
      await this._prisma.refreshToken.delete({
        where: {
          tokenHash: tokenData.tokenHash,
        },
      });
      throw new UnauthorizedError("INVALID_REFRESH_TOKEN", "Refresh token истек.");
    }

    return this._prisma.$transaction(async (tx) => {
      await tx.refreshToken.delete({
        where: {
          tokenHash: tokenData.tokenHash,
        },
      });
      return await this._createTokens(tx, tokenData.userId);
    });
  }

  async logout(refreshToken: string) {
    // if (!refreshToken) throw new UnauthorizedError("NO_SESSION", "Недействительный refresh token.");
    if (!refreshToken) return;
    const tokenHash = this._cryptoService.sha256(refreshToken);
    await this._prisma.refreshToken.deleteMany({
      where: {
        tokenHash,
      },
    });
  }

  private async _createTokens(db: Prisma.TransactionClient | PrismaClient, userId: string): Promise<AuthTokens> {
    const { accessToken, refreshTokenData } = this._jwtService.generateTokens({ sub: userId });

    const refreshTokenHash = this._cryptoService.sha256(refreshTokenData.token);
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
}

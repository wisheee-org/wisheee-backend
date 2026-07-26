import { prisma } from "@/lib/prisma";
import type { SignInSchemaType, SignUpSchemaType } from "@/modules/auth/auth.validation";
import { ConflictError } from "@/common/errors/conflict-error";
import { PasswordService } from "@/modules/auth/services/password.service";
import { VerificationTokenService } from "@/modules/auth/services/verification-token.service";
import { MailService } from "./mail.service";
import { BadRequestError } from "@/common/errors/bad-request-error";
import { authUserSelect, publicUserSelect, type AuthTokens, type SignInResponseDto } from "./../auth.responses";
import { UnauthorizedError } from "@/common/errors/unauthorized-error";
import { ForbiddenError } from "@/common/errors/forbidden-error";
import { JwtService, type TokenPayload } from "./jwt.service";
import { CryptoService } from "./crypto.service";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";

export class AuthService {
  private prisma = prisma;
  private passwordService = new PasswordService();
  private verificationTokenService = new VerificationTokenService();
  private mailService = new MailService();
  private jwtService = new JwtService();
  private cryptoService = new CryptoService();

  async signUp(dto: SignUpSchemaType) {
    const [existingEmail, existingUsername] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: dto.email } }),
      this.prisma.user.findUnique({ where: { username: dto.username } }),
    ]);

    if (existingEmail) throw new ConflictError("EMAIL_ALREADY_EXISTS", "Пользователь с данным email уже существвует");
    if (existingUsername) throw new ConflictError("USERNAME_ALREADY_EXISTS", "Пользователь с данным username уже существвует");

    const passwordHash = await this.passwordService.hash(dto.password);

    const { token, tokenHash, expiresAt } = this.verificationTokenService.generate();

    const user = await this.prisma.$transaction(async (tx) => {
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

    this.mailService.sendVerificationEmail(user.email, token);
  }

  async verifyEmail(token: string) {
    const tokenHash = this.cryptoService.sha256(token);

    const tokenData = await this.prisma.emailVerificationToken.findUnique({
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
      await this.prisma.emailVerificationToken.delete({
        where: {
          id: tokenData.id,
        },
      });
      throw new ConflictError("TOKEN_IS_EXPIRED", "Токен устарел.");
    }
    if (tokenData?.user.emailVerified) throw new ConflictError("EMAIL_ALREADY_VERIFIED", "Email уже подтвержден.");

    await this.prisma.$transaction(async (tx) => {
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
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        emailVerified: true,
      },
    });

    if (!user || user.emailVerified) return;

    const { token, tokenHash, expiresAt } = this.verificationTokenService.generate();

    await this.prisma.$transaction(async (tx) => {
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

    await this.mailService.sendVerificationEmail(email, token);
  }

  async signIn(dto: SignInSchemaType): Promise<SignInResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
      select: { ...publicUserSelect, ...authUserSelect },
    });

    if (!user) throw new UnauthorizedError("INVALID_CREDENTIALS", "Неверные email или пароль.");
    if (!user.emailVerified) throw new ForbiddenError("EMAIL_NOT_VERIFIED", "Подтвердите email перед входом.");

    const isValidPassword = await this.passwordService.compare(dto.password, user.passwordHash);
    if (!isValidPassword) throw new UnauthorizedError("INVALID_CREDENTIALS", "Неверные email или пароль.");

    const { passwordHash, ...publicUser } = user;

    const { accessToken, refreshToken } = await this._createTokens(this.prisma, { userId: publicUser.id });

    return { user: publicUser, accessToken, refreshToken };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = this.cryptoService.sha256(refreshToken);
    const tokenData = await this.prisma.refreshToken.findUnique({
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
      await this.prisma.refreshToken.delete({
        where: {
          tokenHash: tokenData.tokenHash,
        },
      });
      throw new UnauthorizedError("INVALID_REFRESH_TOKEN", "Refresh token истек.");
    }

    return this.prisma.$transaction(async (tx) => {
      await this.prisma.refreshToken.delete({
        where: {
          tokenHash: tokenData.tokenHash,
        },
      });
      return await this._createTokens(tx, { userId: tokenData.userId });
    });
  }

  async logout(refreshToken: string) {
    const tokenHash = this.cryptoService.sha256(refreshToken);
    await this.prisma.refreshToken.delete({
      where: {
        tokenHash,
      },
    });
  }

  private async _createTokens(db: Prisma.TransactionClient | PrismaClient, payload: TokenPayload): Promise<AuthTokens> {
    const { accessToken, refreshTokenData } = this.jwtService.generateTokens(payload);

    const refreshTokenHash = this.cryptoService.sha256(refreshTokenData.token);
    await db.refreshToken.create({
      data: {
        userId: payload.userId,
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

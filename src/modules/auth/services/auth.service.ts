import { prisma } from "@/lib/prisma";
import type { SignUpSchemaType } from "@/modules/auth/auth.validation";
import { ConflictError } from "@/common/errors/conflict-error";
import { PasswordService } from "@/modules/auth/services/password.service";
import { VerificationTokenService } from "@/modules/auth/services/verification-token.service";
import { MailService } from "./mail.service";
import { BadRequestError } from "@/common/errors/bad-request-error";

export class AuthService {
  private prisma = prisma;
  private passwordService = new PasswordService();
  private verificationTokenService = new VerificationTokenService();
  private mailService = new MailService();

  signUp = async (dto: SignUpSchemaType) => {
    const [existingEmail, existingUsername] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: dto.email } }),
      this.prisma.user.findUnique({ where: { username: dto.username } }),
    ]);

    if (existingEmail) throw new ConflictError("EMAIL_ALREADY_EXISTS", "Пользователь с данным email уже существвует");
    if (existingUsername) throw new ConflictError("USERNAME_ALREADY_EXISTS", "Пользователь с данным username уже существвует");

    const passwordHash = await this.passwordService.hash(dto.password);

    const token = this.verificationTokenService.generateVerificationToken();
    const tokenHash = this.verificationTokenService.hash(token);
    const expiresAt = this.verificationTokenService.getExpiresAt();

    const user = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash: passwordHash,
          username: dto.username,
        },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
          avatar: true,
        },
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
  };

  verifyEmail = async (token: string) => {
    const tokenHash = this.verificationTokenService.hash(token);

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
          id: true,
          email: true,
          username: true,
          avatar: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      await tx.emailVerificationToken.delete({
        where: {
          id: tokenData.id,
        },
      });
    });
  };

  resendVerification = async (email: string) => {
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

    const token = this.verificationTokenService.generateVerificationToken();
    const tokenHash = this.verificationTokenService.hash(token);
    const expiresAt = this.verificationTokenService.getExpiresAt();

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
  };
}

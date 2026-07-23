import { prisma } from "@/lib/prisma";
import type { SignUpSchemaType } from "@/modules/auth/auth.validation";
import { ConflictError } from "@/common/errors/conflict-error";
import { PasswordService } from "@/modules/auth/services/password.service";
import { VerificationTokenService } from "@/modules/auth/services/verification-token.service";

export class AuthService {
  private prisma = prisma;
  private passwordService = new PasswordService();
  private verificationTokenService = new VerificationTokenService();

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
          emailVerified: true,
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

    return user;
  };
}

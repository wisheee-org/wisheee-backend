import { prisma } from "@/lib/prisma";
import type { UserSignUpDto } from "./user.type";

export class AuthService {
  private prisma = prisma;

  signUp = async (user: UserSignUpDto) => {
    return this.prisma.user.create({
      data: user,
    });
  };
}

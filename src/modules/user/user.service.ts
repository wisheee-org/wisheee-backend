import { prisma } from "@/lib/prisma";
import type { SearchUserType, UpdateUserType } from "./user.validation";
import { publicUserSelect, type PublicUserDto } from "@/shared/prisma/user.select";

export const userService = {
  async search(userId: string, queries: SearchUserType): Promise<PublicUserDto[]> {
    const { q, page, limit } = queries;
    return await prisma.user.findMany({
      where: {
        id: {
          not: userId,
        },
        username: {
          contains: q,
          mode: "insensitive",
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      select: publicUserSelect,
    });
  },

  async getById(id: string): Promise<PublicUserDto | null> {
    return await prisma.user.findUnique({
      where: {
        id,
      },
      select: publicUserSelect,
    });
  },

  async update(id: string, data: UpdateUserType) {
    const updateData = {
      ...(data.username !== undefined && { username: data.username }),
      ...(data.avatar !== undefined && { avatar: data.avatar }),
    };

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: publicUserSelect,
    });

    return user;
  },
};

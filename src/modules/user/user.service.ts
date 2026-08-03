import { prisma } from "@/lib/prisma";
import type { UpdateUserType } from "./user.validation";
import { publicUserSelect, type PublicUser } from "@/shared/prisma/user.select";

export const userService = {
  async getById(id: string): Promise<PublicUser | null> {
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

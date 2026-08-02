import { prisma } from "@/lib/prisma";
import type { UpdateUserType } from "./user.validation";
import { publicUserSelect, type PublicUser } from "@/shared/prisma/user.select";

export class UserService {
  private _prisma = prisma;

  async me(id: string): Promise<PublicUser | null> {
    if (!id) return null;
    return await this._prisma.user.findUnique({
      where: {
        id,
      },
      select: publicUserSelect,
    });
  }

  async update(id: string, data: UpdateUserType) {
    const updateData = {
      ...(data.username !== undefined && { username: data.username }),
      ...(data.avatar !== undefined && { avatar: data.avatar }),
    };

    const user = await this._prisma.user.update({
      where: { id },
      data: updateData,
      select: publicUserSelect,
    });

    return user;
  }

  async getById(id: string) {
    if (!id) return null;
    return await this._prisma.user.findUnique({
      where: {
        id,
      },
      select: publicUserSelect,
    });
  }
}

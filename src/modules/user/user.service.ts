import { prisma } from "@/lib/prisma";
import type { SearchUserType, UpdateUserType } from "./user.validation";
import { meSelect, publicUserSelect, type MeDto, type PublicUserDto } from "@/shared/prisma/user.select";

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

  async getMe(id: string): Promise<MeDto | null> {
    const meData = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        ...meSelect,
        _count: {
          select: { friendshipsInitiated: true, friendshipsReceived: true, wishlists: true, reservedItems: true },
        },
      },
    });

    if (!meData) return null;

    const { _count, ...me } = meData;

    return {
      ...me,
      quantityOfFriends: _count.friendshipsInitiated + _count.friendshipsReceived,
      quantityOfReservedGifts: _count.reservedItems,
      quantityOfWishlists: _count.wishlists,
    } satisfies MeDto;
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

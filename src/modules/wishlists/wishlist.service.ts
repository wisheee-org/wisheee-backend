import { prisma } from "@/lib/prisma";
import {
  publicWishlistSelect,
  publicWishlistWithItemsSelect,
  type PublicWishlistData,
  type PublicWishlistWithItemsType,
} from "./wishlists.respones";
import type { UpdateWishlistType, CreateWishlistType } from "./wishlists.validation";
import { BadRequestError } from "@/common/errors/bad-request-error";

export const wishlistsService = {
  async getList(id: string): Promise<PublicWishlistData[]> {
    const wishlists = await prisma.wishlist.findMany({
      where: {
        ownerId: id,
      },
      select: publicWishlistSelect,
      orderBy: {
        createdAt: "desc",
      },
    });

    return wishlists;
  },

  async getById(myId: string, wishlistId: string): Promise<PublicWishlistWithItemsType | null> {
    const wishlist = await prisma.wishlist.findUnique({
      where: { id: wishlistId },
      select: publicWishlistWithItemsSelect,
    });

    if (!wishlist) return null;

    if (wishlist.ownerId !== myId) return wishlist;

    return {
      ...wishlist,
      items: wishlist.items.map((item) => ({ ...item, reserverId: null })),
    };
  },

  async create(userId: string, data: CreateWishlistType): Promise<PublicWishlistData> {
    const wishlist = await prisma.wishlist.create({
      data: { ...data, ownerId: userId },
      select: publicWishlistSelect,
    });

    return wishlist;
  },

  async update(userId: string, wishlistId: string, data: UpdateWishlistType): Promise<PublicWishlistData | null> {
    const wishlist = await prisma.wishlist.findFirst({
      where: { id: wishlistId, ownerId: userId },
    });
    if (!wishlist) return null;

    const updateData = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
    };

    return await prisma.wishlist.update({
      where: { id: wishlistId },
      data: updateData,
      select: publicWishlistSelect,
    });
  },

  async delete(userId: string, wishlistId: string): Promise<Pick<PublicWishlistData, "title">> {
    const wishlist = await prisma.wishlist.findFirst({ where: { id: wishlistId, ownerId: userId } });
    if (!wishlist) throw new BadRequestError("NO_WISHLIST", "Проверьте правильность введенных данных.");

    return await prisma.wishlist.delete({
      where: {
        id: wishlistId,
      },
      select: {
        title: true,
      },
    });
  },
};

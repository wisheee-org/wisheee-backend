import { prisma } from "@/lib/prisma";
import type { CreateWishlistItemType, UpdateWishlistItemType } from "./item.validation";
import { wishlistItemSelect, type WishlistItemType } from "./item.responses";
import { BadRequestError } from "@/common/errors/bad-request-error";

export const wishlistItemService = {
  async create(data: CreateWishlistItemType): Promise<WishlistItemType> {
    const item = await prisma.wishlistItem.create({
      data,
      select: wishlistItemSelect,
    });
    return item;
  },

  async update(userId: string, itemId: string, data: UpdateWishlistItemType): Promise<WishlistItemType | null> {
    const wishlistItem = await prisma.wishlistItem.findFirst({
      where: {
        id: itemId,
        wishlist: {
          ownerId: userId,
        },
      },
      select: wishlistItemSelect,
    });
    if (!wishlistItem) return null;

    const updateData = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.link !== undefined && { link: data.link }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
    };

    const updated = await prisma.wishlistItem.update({
      where: { id: itemId },
      data: updateData,
      select: wishlistItemSelect,
    });

    return { ...updated, reserverId: null };
  },

  async delete(userId: string, itemId: string): Promise<Pick<WishlistItemType, "title">> {
    const item = await prisma.wishlistItem.findFirst({ where: { id: itemId, wishlist: { ownerId: userId } } });
    if (!item) throw new BadRequestError("NO_WISHLIST_ITEM", "Проверьте правильность введенных данных.");

    return await prisma.wishlistItem.delete({
      where: {
        id: itemId,
      },
      select: {
        title: true,
      },
    });
  },
};

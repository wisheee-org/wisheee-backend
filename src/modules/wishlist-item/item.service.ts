import { prisma } from "@/lib/prisma";
import type { CreateWishlistItemType, UpdateWishlistItemType } from "./item.validation";
import { wishlistItemSelect, type WishlistItemType } from "./item.responses";
import { BadRequestError } from "@/common/errors/bad-request-error";
import { ConflictError } from "@/common/errors/conflict-error";

export const wishlistItemService = {
  async getList(myId: string, wishlistId: string): Promise<WishlistItemType[] | null> {
    const owner = await prisma.wishlist.findFirst({
      where: { id: wishlistId },
      select: { ownerId: true },
    });
    if (!owner) return null;

    const items = await prisma.wishlistItem.findMany({
      where: { wishlistId },
      select: wishlistItemSelect,
      orderBy: { createdAt: "desc" },
    });

    if (!items) return null;

    if (owner.ownerId !== myId) return items;

    return items.map((item) => ({ ...item, reserverId: null }));
  },
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

    if (data.wishlistId !== undefined) {
      const wishlist = await prisma.wishlist.findFirst({
        where: {
          id: data.wishlistId,
          ownerId: userId,
        },
        select: { id: true },
      });
      if (!wishlist) throw new BadRequestError("NO_WISHLIST", "Вишлиста с таким id не существует");
    }

    const updateData = {
      ...(data.wishlistId !== undefined && { wishlistId: data.wishlistId }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.link !== undefined && { link: data.link }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.image !== undefined && { image: data.image }),
    };

    const updated = await prisma.wishlistItem.update({
      where: { id: itemId },
      data: updateData,
      select: wishlistItemSelect,
    });

    return { ...updated, reserverId: null };
  },

  async delete(userId: string, itemId: string): Promise<Pick<WishlistItemType, "title" | "wishlistId">> {
    const item = await prisma.wishlistItem.findFirst({ where: { id: itemId, wishlist: { ownerId: userId } } });
    if (!item) throw new BadRequestError("NO_WISHLIST_ITEM", "Проверьте правильность введенных данных.");

    return await prisma.wishlistItem.delete({
      where: {
        id: itemId,
      },
      select: {
        title: true,
        wishlistId: true,
      },
    });
  },

  async reserve(userId: string, itemId: string): Promise<WishlistItemType> {
    const item = await prisma.wishlistItem.findFirst({
      where: { id: itemId },
      select: {
        ...wishlistItemSelect,
        wishlist: { select: { ownerId: true } },
      },
    });
    if (!item) throw new BadRequestError("NO_WISHLIST_ITEM", "Проверьте правильность введенных данных.");
    if (item.wishlist.ownerId === userId)
      throw new BadRequestError("OWNER_CANNOT_RESERVE_HIS_ITEM", "Владелец вишлиста не может резервировать свой подарок.");
    if (item.reserverId && item.reserverId !== userId)
      throw new ConflictError("ALREADY_RESERVED", "Подарок уже забронирован другим пользователем.");

    const nextReserverId = item.reserverId === userId ? null : userId;
    const updated = await prisma.wishlistItem.updateMany({
      where: { id: itemId, reserverId: item.reserverId },
      data: { reserverId: nextReserverId },
    });

    if (updated.count === 0)
      throw new ConflictError("RESERVATION_CHANGED", "Состояние брони уже изменилось. Обновите страницу.");

    const { wishlist: _wishlist, ...wishlistItem } = item;
    return { ...wishlistItem, reserverId: nextReserverId };
  },
};

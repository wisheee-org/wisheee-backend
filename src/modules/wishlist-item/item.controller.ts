import type { NextFunction, Request, Response } from "express";
import { wishlistItemService } from "./item.service";
import { CreateWishlistItemSchema, UpdateWishlistItemSchema } from "./item.validation";
import { BadRequestError } from "@/common/errors/bad-request-error";

type GetByIdParams = {
  wishlistId: string;
  itemId: string;
};

export const wishlistItemController = {
  async getList(req: Request<GetByIdParams>, res: Response, next: NextFunction) {
    try {
      const myId = req.user.id;
      const wishlistId = req.params.wishlistId;
      if (!wishlistId) throw new BadRequestError("NO_WISHLIST_ID", "Нет id вишлиста.");

      const data = await wishlistItemService.getList(myId, wishlistId);

      return res.status(200).json({ data });
    } catch (e) {
      next(e);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateWishlistItemSchema.parse(req.body);

      const items = await wishlistItemService.create(data);

      return res.status(200).json({ data: items });
    } catch (e) {
      next(e);
    }
  },

  async update(req: Request<GetByIdParams>, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const itemId = req.params.itemId;
      if (!itemId) throw new BadRequestError("NO_WISHLIST_ITEM_ID", "Нет id подарка.");

      const data = UpdateWishlistItemSchema.parse(req.body);

      const updated = await wishlistItemService.update(userId, itemId, data);

      return res.status(200).json({ data: updated });
    } catch (e) {
      next(e);
    }
  },

  async delete(req: Request<GetByIdParams>, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const itemId = req.params.itemId;
      if (!itemId) throw new BadRequestError("NO_WISHLIST_ITEM_ID", "Нет id подарка.");

      const { title, wishlistId } = await wishlistItemService.delete(userId, itemId);

      return res.status(200).json({ message: `${title} больше не в списке желаний.`, data: { wishlistId } });
    } catch (e) {
      next(e);
    }
  },

  async reserve(req: Request<GetByIdParams>, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const itemId = req.params.itemId;
      if (!itemId) throw new BadRequestError("NO_WISHLIST_ITEM_ID", "Нет id подарка.");

      const reserved = await wishlistItemService.reserve(userId, itemId);

      return res.status(200).json({ data: reserved });
    } catch (e) {
      next(e);
    }
  },
};

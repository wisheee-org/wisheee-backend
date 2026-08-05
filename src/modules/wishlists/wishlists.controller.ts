import type { NextFunction, Request, Response } from "express";
import { wishlistsService } from "./wishlist.service";
import { BadRequestError } from "@/common/errors/bad-request-error";
import { CreateWishlistSchema, UpdateWishlistSchema } from "./wishlists.validation";

type GetByIdParams = {
  userId: string;
  wishlistId: string;
};

export const wishlistController = {
  async getList(req: Request<GetByIdParams>, res: Response, next: NextFunction) {
    try {
      const id = req.params.userId ?? req.user.id;
      const data = await wishlistsService.getList(id);

      return res.status(200).json({ data });
    } catch (e) {
      next(e);
    }
  },

  async getById(req: Request<GetByIdParams>, res: Response, next: NextFunction) {
    try {
      const myId = req.user.id;
      const wishlistId = req.params.wishlistId;
      if (!wishlistId) throw new BadRequestError("NO_WISHLIST_ID", "Нет id вишлиста.");

      const data = await wishlistsService.getById(myId, wishlistId);

      return res.status(200).json({ data });
    } catch (e) {
      next(e);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const data = CreateWishlistSchema.parse(req.body);

      const wishlist = await wishlistsService.create(userId, data);

      return res.status(201).json({ data: wishlist });
    } catch (e) {
      next(e);
    }
  },

  async update(req: Request<GetByIdParams>, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const wishlistId = req.params.wishlistId;
      if (!wishlistId) throw new BadRequestError("NO_WISHLIST_ID", "Нет id вишлиста.");

      const data = UpdateWishlistSchema.parse(req.body);

      const updated = await wishlistsService.update(userId, wishlistId, data);

      return res.status(200).json({ data: updated });
    } catch (e) {
      next(e);
    }
  },

  async delete(req: Request<GetByIdParams>, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const wishlistId = req.params.wishlistId;
      if (!wishlistId) throw new BadRequestError("NO_WISHLIST_ID", "Нет id вишлиста.");

      const { title } = await wishlistsService.delete(userId, wishlistId);

      return res.status(200).json({ message: `Вишлист ${title} удален.` });
    } catch (e) {
      next(e);
    }
  },
};

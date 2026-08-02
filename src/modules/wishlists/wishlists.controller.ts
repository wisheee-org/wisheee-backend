import type { NextFunction, Request, Response } from "express";
import { WishlistsService } from "./wishlist.service";
import { BadRequestError } from "@/common/errors/bad-request-error";
import { CreateWishlistSchema, UpdateWishlistSchema } from "./wishlists.validation";

type GetByIdParams = {
  id: string;
};

export class WishlistController {
  private _wishlistsService = new WishlistsService();

  getById = async (req: Request<GetByIdParams>, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const wishlistId = req.params.id;
      if (!wishlistId) throw new BadRequestError("NO_WISHLIST_ID", "Нет id вишлиста.");

      const data = await this._wishlistsService.getById(userId, wishlistId);

      return res.status(200).json({ data });
    } catch (e) {
      next(e);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const data = CreateWishlistSchema.parse(req.body);

      const wishlist = await this._wishlistsService.create(userId, data);

      return res.status(201).json({ data: wishlist });
    } catch (e) {
      next(e);
    }
  };

  update = async (req: Request<GetByIdParams>, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const wishlistId = req.params.id;
      if (!wishlistId) throw new BadRequestError("NO_WISHLIST_ID", "Нет id вишлиста.");

      const data = UpdateWishlistSchema.parse(req.body);

      const updated = await this._wishlistsService.update(userId, wishlistId, data);

      return res.status(200).json({ data: updated });
    } catch (e) {
      next(e);
    }
  };

  delete = async (req: Request<GetByIdParams>, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const wishlistId = req.params.id;
      if (!wishlistId) throw new BadRequestError("NO_WISHLIST_ID", "Нет id вишлиста.");

      const { title } = await this._wishlistsService.delete(userId, wishlistId);

      return res.status(200).json({ message: `Вишлист ${title} удален.` });
    } catch (e) {
      next(e);
    }
  };
}

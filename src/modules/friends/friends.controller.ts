import type { NextFunction, Request, Response } from "express";
import { friendsService } from "./friends.service";
import { BadRequestError } from "@/common/errors/bad-request-error";

type GetByIdParams = {
  id?: string;
};

export const friendsController = {
  async getList(req: Request<GetByIdParams>, res: Response, next: NextFunction) {
    try {
      const id = req.params.id ?? req.user.id;

      const friends = await friendsService.getList(id);

      return res.status(200).json({ data: friends });
    } catch (e) {
      next(e);
    }
  },

  async deleteFriend(req: Request<GetByIdParams>, res: Response, next: NextFunction) {
    try {
      const friendId = req.params.id;
      if (!friendId) throw new BadRequestError("NO_USER_ID", "Нет id пользователя.");

      await friendsService.deleteFriend(req.user.id, friendId);

      return res.status(200).send();
    } catch (e) {
      next(e);
    }
  },
};

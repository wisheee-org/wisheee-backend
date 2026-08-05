import type { NextFunction, Request, Response } from "express";
import { friendsService } from "./friends.service";

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
};

import type { NextFunction, Request, Response } from "express";
import { userService } from "./user.service";
import { BadRequestError } from "@/common/errors/bad-request-error";
import { SearchUsersSchema, UpdateUserSchema, type SearchUserType } from "./user.validation";

type GetByIdParams = {
  id: string;
};

export const userController = {
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await userService.getById(req.user.id);
      return res.status(200).json({
        data,
      });
    } catch (e) {
      next(e);
    }
  },

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const queries = SearchUsersSchema.parse(req.query);

      const data = await userService.search(userId, queries);

      return res.status(200).json({ data });
    } catch (e) {
      next(e);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.user.id;
      const updateData = UpdateUserSchema.parse(req.body);
      const data = await userService.update(id, updateData);

      return res.status(200).json({ data });
    } catch (e) {
      next(e);
    }
  },

  async getById(req: Request<GetByIdParams>, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      if (!id) throw new BadRequestError("NO_USER_ID", "Нет id пользователя.");
      const data = await userService.getById(id);
      return res.status(200).json({ data });
    } catch (e) {
      next(e);
    }
  },
};

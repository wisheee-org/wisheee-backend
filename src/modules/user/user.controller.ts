import type { NextFunction, Request, Response } from "express";
import { UserService } from "./user.service";
import { BadRequestError } from "@/common/errors/bad-request-error";
import { UpdateUserSchema } from "./user.validation";

type GetByIdParams = {
  id: string;
};

export class UserController {
  private _userService = new UserService();

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this._userService.me(req.user.id);
      return res.status(200).json({
        data,
      });
    } catch (e) {
      next(e);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.user.id;
      const updateData = UpdateUserSchema.parse(req.body);
      const data = await this._userService.update(id, updateData);

      return res.status(200).json({ data });
    } catch (e) {
      next(e);
    }
  };

  getById = async (req: Request<GetByIdParams>, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      if (!id) throw new BadRequestError("NO_USER_ID", "Нет id пользователя.");
      const data = await this._userService.getById(id);
      return res.status(200).json({ data });
    } catch (e) {
      next(e);
    }
  };
}

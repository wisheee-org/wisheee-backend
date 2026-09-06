import type { NextFunction, Request, Response } from "express";
import { notificationsService } from "./notifications.service";

export const notificationsController = {
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await notificationsService.getList(req.user.id);
      return res.status(200).json({ data });
    } catch (e) {
      next(e);
    }
  },
};

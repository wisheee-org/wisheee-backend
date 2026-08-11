import type { NextFunction, Request, Response } from "express";
import { CreateRequestSchema, RequestIdParamsSchema } from "./request.validation";
import { requestsService } from "./requests.service";

export const requestsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { addresseeId } = CreateRequestSchema.parse(req.body);
      const data = await requestsService.sendRequest(req.user.id, addresseeId);
      return res.status(data.status === "pending" ? 201 : 200).json({ data });
    } catch (e) {
      next(e);
    }
  },

  // async getList(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { direction } = ListRequestsSchema.parse(req.query);
  //     const data = await requestsService.getRequests(req.user.id, direction);

  //     return res.status(200).json({ data });
  //   } catch (e) {
  //     next(e);
  //   }
  // },

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const { requestId } = RequestIdParamsSchema.parse(req.params);
      const data = await requestsService.acceptRequest(req.user.id, requestId);
      return res.status(200).json({ data });
    } catch (e) {
      next(e);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { requestId } = RequestIdParamsSchema.parse(req.params);
      await requestsService.deleteRequest(req.user.id, requestId);
      return res.status(204).send();
    } catch (e) {
      next(e);
    }
  },
};

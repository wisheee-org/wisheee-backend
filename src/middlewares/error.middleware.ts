import type { NextFunction, Request, Response } from "express";

import { logger } from "@/config/log";

export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
  });

  res.status(500).json({
    message: "Internal server error",
  });
}

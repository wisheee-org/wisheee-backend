import type { Request, Response } from "express";

import { logger } from "@/config/log";
import { AppError } from "@/common/errors/app-error";
import z from "zod";

export function errorMiddleware(err: Error, req: Request, res: Response) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message, code: err.code });
  }
  if (err instanceof z.ZodError) {
    const errors = Object.fromEntries(err.issues.map((issue) => [issue.path.join("."), issue.message]));

    return res.status(400).json({
      message: "Validation failed",
      errors,
    });
  }

  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
  });

  return res.status(500).json({
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  });
}

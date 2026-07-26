import { UnauthorizedError } from "@/common/errors/unauthorized-error";
import { jwtService } from "@/modules/auth/services/jwt.service";
import type { NextFunction, Request, Response } from "express";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) throw new UnauthorizedError("INVALID_ACCESS_TOKEN", "Недействительный токен.");

  const payload = jwtService.verifyAccessToken(accessToken);

  req.user = {
    id: payload.sub,
  };

  next();
}

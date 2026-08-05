import type { NextFunction, Request, Response } from "express";
import { EmailSchema, SignInSchema, SignUpSchema, TokenSchema } from "./auth.validation";
import { ACCESS_TTL_MS, REFRESH_TTL_MS } from "@/config/auth.config";
import { authService } from "./services/auth.service";

export const authController = {
  async init(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      const data = await authService.init(refreshToken);

      return res.status(200).json({
        data,
      });
    } catch (e) {
      next(e);
    }
  },

  async signUp(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = SignUpSchema.parse(req.body);
      await authService.signUp(dto);

      return res.status(201).json({
        message: "Письмо для подтверждения отправлено на email.",
      });
    } catch (e) {
      next(e);
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.query.token;
      const dto = TokenSchema.parse({ token });
      await authService.verifyEmail(dto.token);

      return res.redirect(`${process.env.CLIENT_URL}/signin`);
    } catch (e) {
      next(e);
    }
  },

  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = EmailSchema.parse(req.body);
      await authService.resendVerification(dto.email);

      return res.status(200).json({
        message: "Если указанный email существует и еще не подтвержден, письмо отправлено.",
      });
    } catch (e) {
      next(e);
    }
  },

  async signIn(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = SignInSchema.parse(req.body);
      const { accessToken, refreshToken, user } = await authService.signIn(dto);

      return res
        .status(200)
        .cookie("accessToken", accessToken, {
          httpOnly: true,
          maxAge: ACCESS_TTL_MS,
          sameSite: "lax",
        })
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
          maxAge: REFRESH_TTL_MS,
          sameSite: "lax",
        })
        .json({
          message: "Вход выполнен успешно.",
          data: user,
        });
    } catch (e) {
      next(e);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshTokenCurrent = req.cookies.refreshToken;
      const { accessToken, refreshToken } = await authService.refresh(refreshTokenCurrent);

      return res
        .status(200)
        .cookie("accessToken", accessToken, {
          httpOnly: true,
          maxAge: ACCESS_TTL_MS,
          sameSite: "lax",
        })
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
          maxAge: REFRESH_TTL_MS,
          sameSite: "lax",
        })
        .send();
    } catch (e) {
      next(e);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      await authService.logout(refreshToken);

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      return res.status(200).json({ message: "Выход выполнен успешно." });
    } catch (e) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      next(e);
    }
  },
};

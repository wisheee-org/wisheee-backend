import type { NextFunction, Request, Response } from "express";
import { AuthService } from "./services/auth.service";
import { EmailSchema, SignInSchema, SignUpSchema, TokenSchema } from "./auth.validation";
import { ACCESS_TTL_MS, REFRESH_TTL_MS } from "@/config/auth.config";

export class AuthController {
  private _authService = new AuthService();

  // me = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const user = await this._authService.me(req.user.id);

  //     return res.status(200).json({
  //       data: user,
  //     });
  //   } catch (e) {
  //     next(e);
  //   }
  // };

  init = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      const data = await this._authService.init(refreshToken);

      return res.status(200).json({
        data,
      });
    } catch (e) {
      next(e);
    }
  };

  signUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = SignUpSchema.parse(req.body);
      await this._authService.signUp(dto);

      return res.status(201).json({
        message: "Письмо для подтверждения отправлено на email.",
      });
    } catch (e) {
      next(e);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.query.token;
      const dto = TokenSchema.parse({ token });
      await this._authService.verifyEmail(dto.token);

      return res.redirect(`${process.env.CLIENT_URL}/signin`);
    } catch (e) {
      next(e);
    }
  };

  resendVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = EmailSchema.parse(req.body);
      await this._authService.resendVerification(dto.email);

      return res.status(200).json({
        message: "Если указанный email существует и еще не подтвержден, письмо отправлено.",
      });
    } catch (e) {
      next(e);
    }
  };

  signIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = SignInSchema.parse(req.body);
      const { accessToken, refreshToken, user } = await this._authService.signIn(dto);

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
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshTokenCurrent = req.cookies.refreshToken;
      const { accessToken, refreshToken } = await this._authService.refresh(refreshTokenCurrent);

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
        });
    } catch (e) {
      next(e);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      await this._authService.logout(refreshToken);

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      return res.status(200).json({ message: "Выход выполнен успешно." });
    } catch (e) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      next(e);
    }
  };
}

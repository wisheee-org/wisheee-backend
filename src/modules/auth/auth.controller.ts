import type { NextFunction, Request, Response } from "express";
import { AuthService } from "./services/auth.service";
import { EmailSchema, SignInSchema, SignUpSchema, TokenSchema } from "./auth.validation";

export class AuthController {
  private authService = new AuthService();

  signUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = SignUpSchema.parse(req.body);
      await this.authService.signUp(dto);

      return res.status(201).json({
        message: "Письмо для подтверждения отправлено на email.",
      });
    } catch (e) {
      next(e);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = TokenSchema.parse(req.body);
      await this.authService.verifyEmail(dto.token);

      return res.status(200).json({
        message: "Email успешно подтвержден.",
      });
    } catch (e) {
      next(e);
    }
  };

  resendVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = EmailSchema.parse(req.body);
      await this.authService.resendVerification(dto.email);

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
      const data = await this.authService.signIn(dto);

      return res.status(200).json({
        message: "Вход выполнен успешно.",
        data,
      });
    } catch (e) {
      next(e);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      const data = await this.authService.refresh(refreshToken);

      return res.status(200).json({
        data,
      });
    } catch (e) {
      next(e);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      const data = await this.authService.logout(refreshToken);

      return res.status(204).json({ message: "Выход выполнен успешно." });
    } catch (e) {
      next(e);
    }
  };
}

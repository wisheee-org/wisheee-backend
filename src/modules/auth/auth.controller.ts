import type { NextFunction, Request, Response } from "express";
import { AuthService } from "./services/auth.service";
import { SignUpSchema, TokenSchema } from "./auth.validation";

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

  async login(req: Request, res: Response) {}
  async refresh(req: Request, res: Response) {}
  async logout(req: Request, res: Response) {}
}

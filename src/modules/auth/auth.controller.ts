import type { NextFunction, Request, Response } from "express";
import { AuthService } from "./services/auth.service";
import { SignUpSchema } from "./auth.validation";

export class AuthController {
  private authService = new AuthService();

  signUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = SignUpSchema.parse(req.body);
      const user = await this.authService.signUp(dto);

      return res.status(201).json({
        message: "Пользователь создан",
        data: user,
      });
    } catch (e) {
      next(e);
    }
  };

  async login(req: Request, res: Response) {}
  async refresh(req: Request, res: Response) {}
  async logout(req: Request, res: Response) {}
}

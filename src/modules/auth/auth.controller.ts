import type { NextFunction, Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
  private authService = new AuthService();

  signUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.authService.signUp(req.body);
      res.status(201).json(user);
    } catch (e) {
      next(e);
    }
  };

  async login(req: Request, res: Response) {}
  async refresh(req: Request, res: Response) {}
  async logout(req: Request, res: Response) {}
}

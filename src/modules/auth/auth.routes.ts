import { Router } from "express";
import { AuthController } from "@/modules/auth/auth.controller";

const authController = new AuthController();

const router = Router();

router.post("/auth/signup", authController.signUp);
router.post("/auth/verify-email", authController.verifyEmail);
router.post("/auth/resend-verification", authController.resendVerification);
// router.post("/login", authController.login);
// router.post("/refresh", authController.refresh);
// router.post("/logout", authController.logout);

export const authRouter = router;

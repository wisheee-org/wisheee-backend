import { Router } from "express";
import { AuthController } from "@/modules/auth/auth.controller";

const authController = new AuthController();

const router = Router();

router.post("/signup", authController.signUp);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);
router.post("/signin", authController.signIn);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

export const authRouter = router;

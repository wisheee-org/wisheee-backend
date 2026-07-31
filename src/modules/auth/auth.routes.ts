import { Router } from "express";
import { AuthController } from "@/modules/auth/auth.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

const authController = new AuthController();

const router = Router();

// router.get("/me", authMiddleware, authController.me);
router.get("/init", authController.init);
router.post("/signup", authController.signUp);
router.get("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);
router.post("/signin", authController.signIn);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

export const authRouter = router;

import { Router } from "express";
import { authController } from "@/modules/auth/auth.controller";

const router = Router();

router.get("/init", authController.init);
router.post("/signup", authController.signUp);
router.get("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);
router.post("/signin", authController.signIn);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

export const authRouter = router;

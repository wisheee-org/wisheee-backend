import { Router } from "express";
import { UserController } from "./user.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

const userController = new UserController();

const router = Router();

router.get("/me", authMiddleware, userController.me);
router.patch("/update", authMiddleware, userController.update);
router.get("/:id", authMiddleware, userController.getById);

export const userRouter = router;

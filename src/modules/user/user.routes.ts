import { Router } from "express";
import { userController } from "./user.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { wishlistController } from "../wishlists/wishlists.controller";

const router = Router();

router.get("/me", authMiddleware, userController.me);
router.patch("/me", authMiddleware, userController.update);

router.get("/search", authMiddleware, userController.search);

router.get("/:id", authMiddleware, userController.getById);
router.get("/:id/wishlists", authMiddleware, wishlistController.getById);

export const userRouter = router;

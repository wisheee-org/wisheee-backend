import { Router } from "express";
import { userController } from "./user.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { wishlistController } from "../wishlists/wishlists.controller";
import { friendsController } from "../friends/friends.controller";

const router = Router();

router.get("/me", authMiddleware, userController.me);
router.patch("/me", authMiddleware, userController.update);

router.get("/search", authMiddleware, userController.search);

router.get("/:userId", authMiddleware, userController.getById);
router.get("/:userId/wishlists", authMiddleware, wishlistController.getList);
router.get("/:userId/friends", authMiddleware, friendsController.getList);

export const userRouter = router;

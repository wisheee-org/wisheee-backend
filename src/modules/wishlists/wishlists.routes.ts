import { Router } from "express";
import { wishlistController } from "./wishlists.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, wishlistController.getList);

router.post("/", authMiddleware, wishlistController.create);
router.get("/:wishlistId", authMiddleware, wishlistController.getById);
router.patch("/:wishlistId", authMiddleware, wishlistController.update);
router.delete("/:wishlistId", authMiddleware, wishlistController.delete);

export const wishlistRouter = router;

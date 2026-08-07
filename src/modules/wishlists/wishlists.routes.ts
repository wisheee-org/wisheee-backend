import { Router } from "express";
import { wishlistController } from "./wishlists.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, wishlistController.getList);
// router.get("/:wishlistId", authMiddleware, wishlistController.getById);

router.post("/", authMiddleware, wishlistController.create);
router.patch("/:wishlistId", authMiddleware, wishlistController.update);
router.delete("/:wishlistId", authMiddleware, wishlistController.delete);

export const wishlistRouter = router;

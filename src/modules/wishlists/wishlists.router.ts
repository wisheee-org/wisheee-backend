import { Router } from "express";
import { wishlistController } from "./wishlists.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, wishlistController.getList);
router.get("/:id", authMiddleware, wishlistController.getById);

router.post("/", authMiddleware, wishlistController.create);
router.patch("/:id", authMiddleware, wishlistController.update);
router.delete("/:id", authMiddleware, wishlistController.delete);

export const wishlistRouter = router;

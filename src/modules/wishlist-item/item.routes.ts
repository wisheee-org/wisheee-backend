import { Router } from "express";
import { wishlistItemController } from "./item.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

const router = Router();

router.post("/", authMiddleware, wishlistItemController.create);
router.patch("/:itemId", authMiddleware, wishlistItemController.update);
router.delete("/:itemId", authMiddleware, wishlistItemController.delete);

export const wishlistItemRouter = router;

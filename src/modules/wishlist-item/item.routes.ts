import { Router } from "express";
import { wishlistItemController } from "./item.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

const router = Router();

router.get("/:wishlistId", authMiddleware, wishlistItemController.getList);
router.post("/", authMiddleware, wishlistItemController.create);
router.patch("/:itemId", authMiddleware, wishlistItemController.update);
router.delete("/:itemId", authMiddleware, wishlistItemController.delete);

router.patch("/:itemId/reservation", authMiddleware, wishlistItemController.reserve);

export const wishlistItemRouter = router;

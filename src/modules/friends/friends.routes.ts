import { Router } from "express";
import { friendsController } from "./friends.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, friendsController.getList);

export const friendsRouter = router;

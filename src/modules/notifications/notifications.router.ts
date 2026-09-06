import { Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { notificationsController } from "./notifications.controller";

const router = Router();

router.get("/", authMiddleware, notificationsController.getList);

export const notificationsRouter = router;

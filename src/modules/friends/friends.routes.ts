import { Router } from "express";
import { friendsController } from "./friends.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { requestsRouter } from "../requests/requests.routes";

const router = Router();

router.get("/", authMiddleware, friendsController.getList);
router.use("/requests", requestsRouter);

export const friendsRouter = router;

import { Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { requestsController } from "./requests.controller";

const router = Router();

router.post("/", authMiddleware, requestsController.create);
router.post("/:requestId/accept", authMiddleware, requestsController.accept);
router.post("/:requestId/reject", authMiddleware, requestsController.reject);
router.delete("/:requestId", authMiddleware, requestsController.delete);

export const requestsRouter = router;

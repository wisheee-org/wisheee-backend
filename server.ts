import "dotenv/config";

import express from "express";
import helmet from "helmet";
import { logger } from "@/config/log";
import { authRouter } from "@/modules/auth/auth.routes";
import { errorMiddleware } from "@/middlewares/error.middleware";
import cookieParser from "cookie-parser";
import cors from "cors";
import { wishlistRouter } from "@/modules/wishlists/wishlists.routes";
import { userRouter } from "@/modules/user/user.routes";
import { friendsRouter } from "@/modules/friends/friends.routes";
import { wishlistItemRouter } from "@/modules/wishlist-item/item.routes";
import { notificationsRouter } from "@/modules/notifications/notifications.router";
import { Server } from "socket.io";
import { createServer } from "http";
import { initializeRealtimeServer } from "@/lib/realtime/realtime.server";

const app = express();
const httpServer = createServer(app);
initializeRealtimeServer(httpServer);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(cookieParser());

async function main() {
  app.use(helmet());
  app.use(express.json());

  app.use((_, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/wishlists", wishlistRouter);
  app.use("/api/friends", friendsRouter);
  app.use("/api/wishlist-items", wishlistItemRouter);
  app.use("/api/notifications", notificationsRouter);

  app.use(errorMiddleware);

  const port = process.env.PORT || 3000;
  httpServer.listen(port, () => {
    // logger.info(`Server is running on http://localhost:${port}`);
  });
}

main().catch((e) => {
  logger.error(e);
});

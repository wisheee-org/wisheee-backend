import "dotenv/config";

import express from "express";
import helmet from "helmet";
import { logger } from "@/config/log";
import { authRouter } from "@/modules/auth/auth.routes";
import { errorMiddleware } from "@/middlewares/error.middleware";
import cookieParser from "cookie-parser";
import cors from "cors";
import { wishlistRouter } from "@/modules/wishlists/wishlists.router";
import { userRouter } from "@/modules/user/user.routes";

const app = express();
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

  app.use(errorMiddleware);

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
  });
}

main().catch((e) => {
  logger.error(e);
});

import "dotenv/config";

import express from "express";
import helmet from "helmet";
import { logger } from "@/config/log";
import { authRouter } from "@/modules/auth/auth.routes";
import { errorMiddleware } from "@/middlewares/error.middleware";

const app = express();

async function main() {
  app.use(helmet());
  app.use(express.json());

  app.use("/api/auth", authRouter);

  app.use(errorMiddleware);

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
  });
}

main().catch((e) => {
  logger.error(e);
});

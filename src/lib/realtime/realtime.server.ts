import { logger } from "@/config/log";
import { jwtService } from "@/modules/auth/services/jwt.service";
import cookieParser from "cookie-parser";
import type { Server as HttpServer, IncomingMessage } from "node:http";
import { Server } from "socket.io";

type SocketRequest = IncomingMessage & {
  cookies?: Record<string, string>;
};
let io: Server | null = null;

export function initializeRealtimeServer(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.engine.use(cookieParser());

  io.use((socket, next) => {
    try {
      const request = socket.request as SocketRequest;
      const accessToken = request.cookies?.accessToken;

      if (!accessToken) {
        return next(new Error("UNAUTHORIZED"));
      }

      const payload = jwtService.verifyAccessToken(accessToken);

      socket.data.userId = payload.sub;

      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    socket.join(`user:${userId}`);

    logger.info(`Socket connected: user ${userId}`);
  });
}

export function getRealtimeServer() {
  if (!io) throw new Error("Realtime server is not initialized");
  return io;
}

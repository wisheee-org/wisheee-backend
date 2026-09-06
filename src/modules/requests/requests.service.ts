import { prisma } from "@/lib/prisma";
import { publicUserSelect } from "@/shared/prisma/user.select";
import { BadRequestError } from "@/common/errors/bad-request-error";
import { ConflictError } from "@/common/errors/conflict-error";
import { ForbiddenError } from "@/common/errors/forbidden-error";
import { NotFoundError } from "@/common/errors/not-found-error";
import { Prisma } from "@/generated/prisma/client";
import { friendRequestSelect, type SendRequestResult } from "./requests.responses";
import { friendNotificationWriter } from "../notifications/notifications.writer";

function _getPair(userId: string, otherUserId: string) {
  const [user1Id, user2Id] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];
  return { user1Id, user2Id, pairKey: `${user1Id}:${user2Id}` };
}

function _isRetryableTransactionError(error: unknown): error is { code: "P2002" | "P2034" } {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  return error.code === "P2002" || error.code === "P2034";
}

async function _runSerializable<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (e) {
      if (attempt === 1 || !_isRetryableTransactionError(e)) throw e;
    }
  }

  throw new Error("Unreachable transaction retry state");
}

export const requestsService = {
  async sendRequest(senderId: string, addresseeId: string): Promise<SendRequestResult> {
    if (senderId === addresseeId) {
      throw new BadRequestError("SELF_FRIEND_REQUEST", "Нельзя отправить заявку в друзья самому себе.");
    }

    const pair = _getPair(senderId, addresseeId);

    return _runSerializable(async (tx) => {
      const addressee = await tx.user.findUnique({
        where: { id: addresseeId },
        select: publicUserSelect,
      });
      if (!addressee) throw new NotFoundError("USER_NOT_FOUND", "Пользователь не найден.");

      const friendship = await tx.friend.findUnique({
        where: {
          user1Id_user2Id: {
            user1Id: pair.user1Id,
            user2Id: pair.user2Id,
          },
        },
        select: { id: true },
      });
      if (friendship) throw new ConflictError("ALREADY_FRIENDS", "Пользователи уже являются друзьями.");

      const existingRequest = await tx.friendRequest.findUnique({
        where: { pairKey: pair.pairKey },
        select: { id: true, senderId: true, addresseeId: true },
      });

      if (existingRequest?.senderId === senderId) {
        throw new ConflictError("FRIEND_REQUEST_ALREADY_EXISTS", "Заявка в друзья уже отправлена.");
      }

      if (existingRequest) {
        await tx.friend.create({
          data: { user1Id: pair.user1Id, user2Id: pair.user2Id },
        });
        await tx.friendRequest.delete({ where: { id: existingRequest.id } });
        await friendNotificationWriter.createPair(tx, {
          actorId: senderId,
          otherUserId: addresseeId,
          entityId: existingRequest.id,
          type: "FRIEND_REQUEST_ACCEPTED",
          occurredAt: new Date(),
        });
        // await tx.friendNotification.deleteMany({
        //   where: { entityId: existingRequest.id, type: "FRIEND_REQUEST_CREATED" },
        // });
        return { status: "accepted", friend: addressee };
      }

      const request = await tx.friendRequest.create({
        data: { senderId, addresseeId, pairKey: pair.pairKey },
        select: friendRequestSelect,
      });

      await friendNotificationWriter.createPair(tx, {
        actorId: senderId,
        otherUserId: addresseeId,
        entityId: request.id,
        type: "FRIEND_REQUEST_CREATED",
        occurredAt: new Date(),
      });

      return { status: "pending", request };
    });
  },

  async acceptRequest(userId: string, requestId: string) {
    return _runSerializable(async (tx) => {
      const request = await tx.friendRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          senderId: true,
          addresseeId: true,
          sender: { select: publicUserSelect },
        },
      });
      if (!request) throw new NotFoundError("FRIEND_REQUEST_NOT_FOUND", "Заявка в друзья не найдена.");
      if (request.addresseeId !== userId) {
        throw new ForbiddenError("FRIEND_REQUEST_FORBIDDEN", "Только адресат может принять заявку.");
      }

      const pair = _getPair(request.senderId, request.addresseeId);
      await tx.friend.create({ data: { user1Id: pair.user1Id, user2Id: pair.user2Id } });
      await tx.friendRequest.delete({ where: { id: request.id } });
      await friendNotificationWriter.createPair(tx, {
        actorId: request.addresseeId,
        otherUserId: request.senderId,
        entityId: request.id,
        type: "FRIEND_REQUEST_ACCEPTED",
        occurredAt: new Date(),
      });
      // await tx.friendNotification.deleteMany({
      //   where: { entityId: request.id, type: "FRIEND_REQUEST_CREATED" },
      // });

      return request.sender;
    });
  },

  async rejectRequest(userId: string, requestId: string) {
    return _runSerializable(async (tx) => {
      const request = await tx.friendRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          senderId: true,
          addresseeId: true,
          sender: { select: publicUserSelect },
        },
      });
      if (!request) throw new NotFoundError("FRIEND_REQUEST_NOT_FOUND", "Заявка в друзья не найдена.");
      if (request.addresseeId !== userId) {
        throw new ForbiddenError("FRIEND_REQUEST_FORBIDDEN", "Только адресат может отклонить заявку.");
      }

      await tx.friendRequest.delete({ where: { id: request.id } });
      await friendNotificationWriter.createPair(tx, {
        actorId: request.addresseeId,
        otherUserId: request.senderId,
        entityId: request.id,
        type: "FRIEND_REQUEST_REJECTED",
        occurredAt: new Date(),
      });
      // await tx.friendNotification.deleteMany({
      //   where: { entityId: request.id, type: "FRIEND_REQUEST_CREATED" },
      // });

      return request.sender;
    });
  },

  async deleteRequest(userId: string, requestId: string): Promise<void> {
    await _runSerializable(async (tx) => {
      const request = await tx.friendRequest.findUnique({
        where: { id: requestId },
        select: { id: true, senderId: true, addresseeId: true },
      });
      if (!request) throw new NotFoundError("FRIEND_REQUEST_NOT_FOUND", "Заявка в друзья не найдена.");
      if (request.senderId !== userId && request.addresseeId !== userId) {
        throw new ForbiddenError("FRIEND_REQUEST_FORBIDDEN", "Нельзя изменить чужую заявку.");
      }

      await tx.friendRequest.delete({ where: { id: request.id } });
      await tx.friendNotification.deleteMany({
        where: { entityId: request.id },
      });
    });
  },
};

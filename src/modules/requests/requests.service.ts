import { publicUserSelect } from "@/shared/prisma/user.select";
import { BadRequestError } from "@/common/errors/bad-request-error";
import { ConflictError } from "@/common/errors/conflict-error";
import { ForbiddenError } from "@/common/errors/forbidden-error";
import { NotFoundError } from "@/common/errors/not-found-error";
import { friendRequestSelect, type SendRequestResult } from "./requests.responses";
import { friendNotificationWriter } from "../notifications/notifications.writer";
import { notificationsPublisher } from "../notifications/notifications.publisher";
import { getPair } from "@/common/utils/get-ids-pair";
import { runSerializable } from "@/common/utils/run-serializable";

export const requestsService = {
  async sendRequest(senderId: string, addresseeId: string): Promise<SendRequestResult> {
    if (senderId === addresseeId) {
      throw new BadRequestError("SELF_FRIEND_REQUEST", "Нельзя отправить заявку в друзья самому себе.");
    }

    const pair = getPair(senderId, addresseeId);

    const data = await runSerializable<{ response: SendRequestResult; senderId: string; addresseeId: string }>(async (tx) => {
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
        await tx.friendNotification.deleteMany({
          where: { entityId: existingRequest.id, type: "FRIEND_REQUEST_CREATED" },
        });
        return { response: { status: "accepted", friend: addressee }, senderId, addresseeId };
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

      return { response: { status: "pending", request }, senderId, addresseeId };
    });

    notificationsPublisher.changed([data.senderId, data.addresseeId]);

    return data.response;
  },

  async acceptRequest(userId: string, requestId: string) {
    const data = await runSerializable(async (tx) => {
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

      const pair = getPair(request.senderId, request.addresseeId);
      await tx.friend.create({ data: { user1Id: pair.user1Id, user2Id: pair.user2Id } });
      await tx.friendRequest.delete({ where: { id: request.id } });
      await friendNotificationWriter.createPair(tx, {
        actorId: request.addresseeId,
        otherUserId: request.senderId,
        entityId: request.id,
        type: "FRIEND_REQUEST_ACCEPTED",
        occurredAt: new Date(),
      });
      await tx.friendNotification.deleteMany({
        where: { entityId: request.id, type: "FRIEND_REQUEST_CREATED" },
      });

      return { sender: request.sender, addresseeId: request.addresseeId };
    });

    notificationsPublisher.changed([data.sender.id, data.addresseeId]);

    return data.sender;
  },

  async rejectRequest(userId: string, requestId: string) {
    const data = await runSerializable(async (tx) => {
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
      await tx.friendNotification.deleteMany({
        where: { entityId: request.id, type: "FRIEND_REQUEST_CREATED" },
      });

      return { sender: request.sender, addresseeId: request.addresseeId };
    });

    notificationsPublisher.changed([data.sender.id, data.addresseeId]);

    return data.sender;
  },

  async deleteRequest(userId: string, requestId: string): Promise<void> {
    const data = await runSerializable(async (tx) => {
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

      return { senderId: request.senderId, addresseeId: request.addresseeId };
    });

    notificationsPublisher.changed([data.senderId, data.addresseeId]);
  },
};

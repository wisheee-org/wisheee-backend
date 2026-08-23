-- CreateEnum
CREATE TYPE "FriendNotificationType" AS ENUM ('FRIEND_REQUEST_RECEIVED', 'FRIEND_REQUEST_ACCEPTED', 'FRIEND_REQUEST_REJECTED');

-- CreateTable
CREATE TABLE "friend_notifications" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "type" "FriendNotificationType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friend_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "friend_notifications_recipient_id_actor_id_idx" ON "friend_notifications"("recipient_id", "actor_id");

-- CreateIndex
CREATE INDEX "friend_notifications_type_entityId_idx" ON "friend_notifications"("type", "entityId");

-- CreateIndex
CREATE INDEX "friend_notifications_recipient_id_read_at_idx" ON "friend_notifications"("recipient_id", "read_at");

-- AddForeignKey
ALTER TABLE "friend_notifications" ADD CONSTRAINT "friend_notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_notifications" ADD CONSTRAINT "friend_notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

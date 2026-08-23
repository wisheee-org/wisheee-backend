/*
  Warnings:

  - You are about to drop the column `entityId` on the `friend_notifications` table. All the data in the column will be lost.
  - Added the required column `entity_id` to the `friend_notifications` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "friend_notifications" DROP CONSTRAINT "friend_notifications_actor_id_fkey";

-- DropIndex
DROP INDEX "friend_notifications_type_entityId_idx";

-- AlterTable
ALTER TABLE "friend_notifications" DROP COLUMN "entityId",
ADD COLUMN     "entity_id" TEXT NOT NULL,
ALTER COLUMN "actor_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "friend_notifications_type_entity_id_idx" ON "friend_notifications"("type", "entity_id");

-- AddForeignKey
ALTER TABLE "friend_notifications" ADD CONSTRAINT "friend_notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

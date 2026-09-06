/*
  Warnings:

  - The values [FRIEND_REQUEST_RECEIVED] on the enum `FriendNotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FriendNotificationType_new" AS ENUM ('FRIEND_REQUEST_CREATED', 'FRIEND_REQUEST_ACCEPTED', 'FRIEND_REQUEST_REJECTED');
ALTER TABLE "friend_notifications" ALTER COLUMN "type" TYPE "FriendNotificationType_new" USING ("type"::text::"FriendNotificationType_new");
ALTER TYPE "FriendNotificationType" RENAME TO "FriendNotificationType_old";
ALTER TYPE "FriendNotificationType_new" RENAME TO "FriendNotificationType";
DROP TYPE "public"."FriendNotificationType_old";
COMMIT;

-- AlterTable
ALTER TABLE "friend_notifications" ADD COLUMN     "counterparty_id" TEXT;

-- AddForeignKey
ALTER TABLE "friend_notifications" ADD CONSTRAINT "friend_notifications_counterparty_id_fkey" FOREIGN KEY ("counterparty_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

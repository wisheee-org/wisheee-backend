/*
  Warnings:

  - You are about to drop the column `image_url` on the `wishlist_items` table. All the data in the column will be lost.
  - Made the column `description` on table `wishlist_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `link` on table `wishlist_items` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "wishlist_items" DROP COLUMN "image_url",
ADD COLUMN     "image" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "description" SET DEFAULT '',
ALTER COLUMN "link" SET NOT NULL,
ALTER COLUMN "link" SET DEFAULT '';

/*
  Warnings:

  - Made the column `description` on table `wishlists` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "wishlists" ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "description" SET DEFAULT '';

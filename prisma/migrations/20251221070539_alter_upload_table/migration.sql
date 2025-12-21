/*
  Warnings:

  - You are about to drop the column `deleted` on the `uploads` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "uploads" DROP COLUMN "deleted",
ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false;

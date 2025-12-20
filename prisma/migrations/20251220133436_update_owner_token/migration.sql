/*
  Warnings:

  - You are about to drop the column `refresh_token_expiry` on the `owner_tokens` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "owner_tokens" DROP COLUMN "refresh_token_expiry",
ADD COLUMN     "refresh_token_expire_at" TIMESTAMPTZ(3);

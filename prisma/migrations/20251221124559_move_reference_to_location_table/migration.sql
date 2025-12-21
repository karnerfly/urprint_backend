/*
  Warnings:

  - You are about to drop the column `location_id` on the `shops` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shop_id]` on the table `shop_locations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shop_id` to the `shop_locations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "shops" DROP CONSTRAINT "shops_location_id_fkey";

-- DropIndex
DROP INDEX "shops_location_id_key";

-- AlterTable
ALTER TABLE "shop_locations" ADD COLUMN     "shop_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "shops" DROP COLUMN "location_id";

-- CreateIndex
CREATE UNIQUE INDEX "shop_locations_shop_id_key" ON "shop_locations"("shop_id");

-- AddForeignKey
ALTER TABLE "shop_locations" ADD CONSTRAINT "shop_locations_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - The primary key for the `documents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `otps` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `shop_owners` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `shops` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `uploads` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_upload_id_fkey";

-- DropForeignKey
ALTER TABLE "otps" DROP CONSTRAINT "otps_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "owner_phones" DROP CONSTRAINT "owner_phones_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "shops" DROP CONSTRAINT "shops_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "uploads" DROP CONSTRAINT "uploads_shop_id_fkey";

-- AlterTable
ALTER TABLE "documents" DROP CONSTRAINT "documents_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "upload_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "otps" DROP CONSTRAINT "otps_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "owner_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "otps_pkey" PRIMARY KEY ("id");

-- AlterTable
CREATE SEQUENCE owner_phones_id_seq;
ALTER TABLE "owner_phones" ALTER COLUMN "id" SET DEFAULT nextval('owner_phones_id_seq'),
ALTER COLUMN "owner_id" SET DATA TYPE TEXT;
ALTER SEQUENCE owner_phones_id_seq OWNED BY "owner_phones"."id";

-- AlterTable
ALTER TABLE "shop_owners" DROP CONSTRAINT "shop_owners_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "shop_owners_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "shops" DROP CONSTRAINT "shops_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "owner_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "shops_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "uploads" DROP CONSTRAINT "uploads_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "shop_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "uploads_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "owner_phones" ADD CONSTRAINT "owner_phones_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "shop_owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "shop_owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "shop_owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

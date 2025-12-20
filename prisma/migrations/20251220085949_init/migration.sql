-- CreateEnum
CREATE TYPE "ColorMode" AS ENUM ('COLORED', 'BLACK_AND_WHITE');

-- CreateEnum
CREATE TYPE "SideMode" AS ENUM ('SINGLE', 'BOTH');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('TWO_FACTOR_AUTHENTICATION', 'EMAIL_VERIFICATION', 'PASSWORD_RESET', 'FORGOT_PASSWORD');

-- CreateEnum
CREATE TYPE "OtpMedium" AS ENUM ('SMS', 'EMAIL');

-- CreateTable
CREATE TABLE "shop_owners" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "password_salt" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "otp_required" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "shop_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_phones" (
    "id" INTEGER NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,

    CONSTRAINT "owner_phones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shops" (
    "id" INTEGER NOT NULL,
    "shop_name" TEXT NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "location_id" INTEGER,
    "upload_token" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_locations" (
    "id" SERIAL NOT NULL,
    "street" TEXT,
    "city" TEXT,
    "district" TEXT,
    "state" TEXT,
    "pin" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "shop_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploads" (
    "id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "customer_token" TEXT NOT NULL,
    "document_count" INTEGER NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "expire_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" INTEGER NOT NULL,
    "upload_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "media_type" TEXT NOT NULL,
    "downloadable" BOOLEAN NOT NULL DEFAULT false,
    "no_of_copies" INTEGER NOT NULL,
    "color_mode" "ColorMode" NOT NULL,
    "side_mode" "SideMode" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" INTEGER NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "verification_token" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "medium" "OtpMedium" NOT NULL,
    "medium_identity" TEXT NOT NULL,
    "ack_required" BOOLEAN NOT NULL,
    "ack_id" INTEGER,
    "ack_used" BOOLEAN,
    "ack_expire_at" TIMESTAMPTZ(3),
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "resend_count" INTEGER NOT NULL DEFAULT 0,
    "max_failed" INTEGER NOT NULL,
    "max_resend" INTEGER NOT NULL,
    "expire_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_expirations" (
    "id" SERIAL NOT NULL,
    "display_text" TEXT NOT NULL,
    "value_in_minute" INTEGER NOT NULL,
    "display_order" INTEGER NOT NULL,

    CONSTRAINT "upload_expirations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "states" (
    "id" SERIAL NOT NULL,
    "display_name" TEXT NOT NULL,
    "state_code" INTEGER,
    "display_order" INTEGER NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" SERIAL NOT NULL,
    "display_name" TEXT NOT NULL,
    "state_id" INTEGER NOT NULL,
    "district_code" INTEGER,
    "display_order" INTEGER NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shop_owners_email_key" ON "shop_owners"("email");

-- CreateIndex
CREATE UNIQUE INDEX "shop_owners_password_salt_key" ON "shop_owners"("password_salt");

-- CreateIndex
CREATE UNIQUE INDEX "owner_phones_owner_id_phone_key" ON "owner_phones"("owner_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "shops_owner_id_key" ON "shops"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "shops_location_id_key" ON "shops"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "shops_upload_token_key" ON "shops"("upload_token");

-- CreateIndex
CREATE UNIQUE INDEX "uploads_code_key" ON "uploads"("code");

-- CreateIndex
CREATE UNIQUE INDEX "uploads_customer_token_key" ON "uploads"("customer_token");

-- CreateIndex
CREATE UNIQUE INDEX "otps_verification_token_key" ON "otps"("verification_token");

-- CreateIndex
CREATE UNIQUE INDEX "otps_otp_hash_key" ON "otps"("otp_hash");

-- AddForeignKey
ALTER TABLE "owner_phones" ADD CONSTRAINT "owner_phones_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "shop_owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "shop_owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "shop_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "shop_owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

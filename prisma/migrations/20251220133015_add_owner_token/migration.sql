-- CreateTable
CREATE TABLE "owner_tokens" (
    "id" SERIAL NOT NULL,
    "owner_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "refresh_token_expiry" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "owner_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "owner_tokens_owner_id_key" ON "owner_tokens"("owner_id");

-- AddForeignKey
ALTER TABLE "owner_tokens" ADD CONSTRAINT "owner_tokens_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "shop_owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

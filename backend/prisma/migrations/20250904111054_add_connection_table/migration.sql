CREATE EXTENSION IF NOT EXISTS postgis;

-- AlterTable
ALTER TABLE "public"."Store" ADD COLUMN     "location" geography;

-- CreateTable
CREATE TABLE "public"."Connection" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UpdateLog" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "flavorName" TEXT NOT NULL,
    "availability" INTEGER NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpdateLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UpdateLog_storeId_createdAt_idx" ON "public"."UpdateLog"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "UpdateLog_flavorName_createdAt_idx" ON "public"."UpdateLog"("flavorName", "createdAt");

-- CreateIndex
CREATE INDEX "UpdateLog_createdAt_idx" ON "public"."UpdateLog"("createdAt");

-- CreateIndex
CREATE INDEX "idx_store_location" ON "public"."Store" USING GIST ("location");

-- AddForeignKey
ALTER TABLE "public"."UpdateLog" ADD CONSTRAINT "UpdateLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UpdateLog" ADD CONSTRAINT "UpdateLog_flavorName_fkey" FOREIGN KEY ("flavorName") REFERENCES "public"."Flavor"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

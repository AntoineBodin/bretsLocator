-- CreateTable
CREATE TABLE "public"."Store" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Flavor" (
    "name" TEXT NOT NULL,
    "image" TEXT,

    CONSTRAINT "Flavor_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "public"."StoreFlavor" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "flavorName" TEXT NOT NULL,
    "available" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreFlavor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Store_lat_lon_idx" ON "public"."Store"("lat", "lon");

-- CreateIndex
CREATE UNIQUE INDEX "StoreFlavor_storeId_flavorName_key" ON "public"."StoreFlavor"("storeId", "flavorName");

-- AddForeignKey
ALTER TABLE "public"."StoreFlavor" ADD CONSTRAINT "StoreFlavor_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StoreFlavor" ADD CONSTRAINT "StoreFlavor_flavorName_fkey" FOREIGN KEY ("flavorName") REFERENCES "public"."Flavor"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the `_FlavorToStore` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `long` on the `Store` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Flavor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lon` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_FlavorToStore_B_index";

-- DropIndex
DROP INDEX "_FlavorToStore_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_FlavorToStore";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "StoreFlavor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "storeId" INTEGER NOT NULL,
    "flavorId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoreFlavor_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StoreFlavor_flavorId_fkey" FOREIGN KEY ("flavorId") REFERENCES "Flavor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Store" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lon" REAL NOT NULL
);
INSERT INTO "new_Store" ("address", "id", "lat", "name") SELECT "address", "id", "lat", "name" FROM "Store";
DROP TABLE "Store";
ALTER TABLE "new_Store" RENAME TO "Store";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "StoreFlavor_storeId_flavorId_key" ON "StoreFlavor"("storeId", "flavorId");

-- CreateIndex
CREATE UNIQUE INDEX "Flavor_name_key" ON "Flavor"("name");

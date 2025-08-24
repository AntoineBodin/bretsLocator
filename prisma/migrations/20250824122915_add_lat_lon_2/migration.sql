/*
  Warnings:

  - You are about to drop the `Shop` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_FlavorToShop` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Shop";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_FlavorToShop";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Store" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "long" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "_FlavorToStore" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_FlavorToStore_A_fkey" FOREIGN KEY ("A") REFERENCES "Flavor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FlavorToStore_B_fkey" FOREIGN KEY ("B") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_FlavorToStore_AB_unique" ON "_FlavorToStore"("A", "B");

-- CreateIndex
CREATE INDEX "_FlavorToStore_B_index" ON "_FlavorToStore"("B");

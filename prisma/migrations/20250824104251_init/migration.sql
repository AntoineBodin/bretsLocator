-- CreateTable
CREATE TABLE "Shop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Flavor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_FlavorToShop" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_FlavorToShop_A_fkey" FOREIGN KEY ("A") REFERENCES "Flavor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FlavorToShop_B_fkey" FOREIGN KEY ("B") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_FlavorToShop_AB_unique" ON "_FlavorToShop"("A", "B");

-- CreateIndex
CREATE INDEX "_FlavorToShop_B_index" ON "_FlavorToShop"("B");

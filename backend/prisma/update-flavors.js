import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const res = await fetch("https://boutique.brets.fr/ws/wsGetProducts.asp");
  const data = await res.json();

  for (const item of data.products) {
    const name = item.name;
    const image = item.smallimg || null;

    await prisma.flavor.upsert({
      where: { name },
      update: { image },
      create: { name, image },
    });
  }

  console.log("Flavors updated !");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

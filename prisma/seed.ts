import fs from "fs";
import path from "path";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const storesDir = path.join(process.cwd(), "stores");

const statuses = ["in_stock", "out_of_stock", "unavailable"]

async function main() {
  // Supprimer les données existantes
  await prisma.storeFlavor.deleteMany()
  await prisma.store.deleteMany()
  await prisma.flavor.deleteMany()
  console.log("Base nettoyée.");

  // Créer les saveurs
  await updateFlavors();
  
  const flavorRecords = await prisma.flavor.findMany(); 
  await createStores(flavorRecords);

  await prisma.$executeRawUnsafe(`
    UPDATE "Store"
    SET location = ST_SetSRID(ST_MakePoint(lon, lat), 4326)
    WHERE lat IS NOT NULL AND lon IS NOT NULL;
  `);
  console.log("Stores: location updated");

  await prisma.$executeRawUnsafe(`
    REINDEX INDEX idx_store_location;
  `);
  console.log("Stores: reindexed");

  console.log("Seed terminé !")
}

function cleanProductName(rawName: string): string {
  return rawName
    .replace(/^(?:chips\s*bret'?s\s*(?:ondulées?)?)/i, "")
    .replace(/\b\d+\s?gr?\b/gi, "")
    .replace(/sachet\s*/i, "")
    .replace(/format\s*familial/i, "")
    .replace(/[-–]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function updateFlavors() {
  const res = await fetch("https://boutique.brets.fr/ws/wsGetProducts.asp?pagesize=100");
  const data = await res.json() as { products: { name: string; smallimg?: string }[] };

  for (const item of data.products) {
    const name = cleanProductName(item.name);
    const image = item.smallimg || null;

    await prisma.flavor.upsert({
      where: { name },
      update: { image },
      create: { name, image },
    });
  }
  
  console.log("Flavors updated !");
  return data.products;
}

async function createStores(flavorRecords: { name: string; image: string | null; }[]) {
  const files = fs.readdirSync(storesDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const filePath = path.join(storesDir, file);
    console.log(`Début du traitement du fichier : ${file}`);
    const start = Date.now();

    let rawData = fs.readFileSync(filePath, "utf-8");
    let jsonData = JSON.parse(rawData);

    // 1. Bulk insert des stores
    const storesToCreate = jsonData.map((s: any) => ({
      name: s.name,
      address: s.address,
      lat: s.lat,
      lon: s.lon
    }));

    // Prisma createMany ne retourne pas les IDs créés, donc on doit les récupérer ensuite
    await prisma.store.createMany({ data: storesToCreate });

    // 2. Récupérer tous les stores insérés (par nom et coordonnées)
    const insertedStores = await prisma.store.findMany({
      where: {
        OR: storesToCreate.map((s: { name: any; lat: any; lon: any; }) => ({
          name: s.name,
          lat: s.lat,
          lon: s.lon
        }))
      }
    });

    // 3. Préparer les liaisons storeFlavor en bulk
    const storeFlavorsToCreate: { storeId: number; flavorName: string; available: number }[] = [];
    for (const store of insertedStores) {
      for (const flavor of flavorRecords) {
        const status = Math.floor(Math.random() * statuses.length);
        storeFlavorsToCreate.push({
          storeId: store.id,
          flavorName: flavor.name,
          available: status
        });
      }
    }

    // 4. Bulk insert des storeFlavor
    // Prisma limite à 10 000 records par createMany, donc on peut chunker si besoin
    const chunkSize = 1000;
    for (let i = 0; i < storeFlavorsToCreate.length; i += chunkSize) {
      await prisma.storeFlavor.createMany({
        data: storeFlavorsToCreate.slice(i, i + chunkSize)
      });
    }

    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`Fichier traité : ${file} (${duration}s)`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e)
    prisma.$disconnect()
  })

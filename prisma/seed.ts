import fs from "fs";
import path from "path";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const storesDir = path.join(process.cwd(), "stores");

const statuses = ["in_stock", "out_of_stock", "unavailable"];

// Ajout: mode passé en argument (random | blank)
const seedMode = (process.argv[2] === "blank") ? "blank" : "random";

async function main(mode: "random" | "blank" = "random") {
  console.log(`Seed mode: ${mode}`);

  // Supprimer les données existantes
  await prisma.storeFlavor.deleteMany();
  await prisma.store.deleteMany();
  await prisma.flavor.deleteMany();
  console.log("Base nettoyée.");

  // Créer / mettre à jour les saveurs
  await updateFlavors();
  const flavorRecords = await prisma.flavor.findMany();

  // Créer les stores (sans lier de saveurs ici)
  await createStores();

  // Récupérer tous les stores
  const allStores = await prisma.store.findMany();

  // Peupler la table de relation selon le mode
  if (mode === "blank") {
    await populateStoreFlavorsUnknown(allStores, flavorRecords);
  } else {
    await populateStoreFlavorsRandom(allStores, flavorRecords);
  }

  // Mise à jour colonne géographique
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Store" 
    DROP COLUMN IF EXISTS location;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Store" 
    ADD COLUMN location geography(POINT, 4326);
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "Store"
    SET location = ST_SetSRID(ST_MakePoint(lon, lat), 4326)
    WHERE lat IS NOT NULL AND lon IS NOT NULL;
  `);
  console.log("Stores: location updated");
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_store_location 
    ON "Store" USING GIST(location);
  `);
  await prisma.$executeRawUnsafe(`REINDEX INDEX idx_store_location;`);
  console.log("Stores: reindexed");

  console.log("Seed terminé !");
}

function cleanProductName(rawName: string): string {
  return rawName
    // Retire préfixe générique chips Bret's (variantes)
    .replace(/^(?:chips\s*bret'?s\s*(?:ondulées?)?)/i, "")
    // Retire mentions de poids (ex: 125g, 150 gr)
    .replace(/\b\d+\s?gr?\b/gi, "")
    // Retire mots génériques ou marketing
    .replace(/\bformat\s*familial\b/gi, "")
    .replace(/\bsachet[s]?\b/gi, "")
    // Retire les mots demandés: saveur(s), Aro, Brets/Bret's (si encore présents ailleurs)
    .replace(/\bsaveurs?\b/gi, "")
    .replace(/\baro\b/gi, "")
    .replace(/\bbrets?\b/gi, "")
    .replace(/bret'?s/gi, "") // fallback apostrophes résiduelles
    .replace(/'s/gi, "") // fallback apostrophes résiduelles
    // Tirets / tirets longs
    .replace(/[-–]/g, " ")
    // Collapser multiples espaces
    .replace(/\s{2,}/g, " ")
    // Nettoyage espaces autour apostrophes
    .replace(/\s+'\s*/g, "'")
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

async function createStores() {
  const files = fs.readdirSync(storesDir).filter(f => f.endsWith(".json"));
  for (const file of files) {
    const filePath = path.join(storesDir, file);
    console.log(`Traitement stores fichier: ${file}`);
    const start = Date.now();

    const rawData = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(rawData);

    const storesToCreate = jsonData.map((s: any) => ({
      name: s.name,
      address: s.address,
      lat: s.lat,
      lon: s.lon
    }));

    await prisma.store.createMany({ data: storesToCreate });

    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`Stores insérés depuis ${file} (${duration}s)`);
  }
}

// Nouvelle méthode: tout en "inconnu" (0)
async function populateStoreFlavorsUnknown(
  stores: { id: number }[],
  flavorRecords: { name: string }[]
) {
  console.log("Remplissage StoreFlavor en mode 'blank' (availability = 0)...");
  const bulk: { storeId: number; flavorName: string; available: number }[] = [];
  for (const store of stores) {
    for (const flavor of flavorRecords) {
      bulk.push({
        storeId: store.id,
        flavorName: flavor.name,
        available: 0 // inconnu
      });
    }
  }
  await chunkedCreateStoreFlavors(bulk);
  console.log("Populate blank terminé.");
}

// Nouvelle méthode: aléatoire (comportement historique)
async function populateStoreFlavorsRandom(
  stores: { id: number }[],
  flavorRecords: { name: string }[]
) {
  console.log("Remplissage StoreFlavor en mode 'random'...");
  const bulk: { storeId: number; flavorName: string; available: number }[] = [];
  for (const store of stores) {
    for (const flavor of flavorRecords) {
      const status = Math.floor(Math.random() * statuses.length); // 0,1,2
      bulk.push({
        storeId: store.id,
        flavorName: flavor.name,
        available: status
      });
    }
  }
  await chunkedCreateStoreFlavors(bulk);
  console.log("Populate random terminé.");
}

// Factorisation d'insertion chunkée
async function chunkedCreateStoreFlavors(
  data: { storeId: number; flavorName: string; available: number }[],
  chunkSize = 1000
) {
  for (let i = 0; i < data.length; i += chunkSize) {
    await prisma.storeFlavor.createMany({
      data: data.slice(i, i + chunkSize)
    });
  }
}

main(seedMode as "random" | "blank")
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });

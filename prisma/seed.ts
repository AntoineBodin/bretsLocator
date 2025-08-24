import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const stores = [
  { name: "Carrefour Evry", address: "Centre Commercial Evry 2, 91000 Evry", lat: 48.6303, lon: 2.4417 },
  { name: "Leclerc Massy", address: "1 Avenue de Paris, 91300 Massy", lat: 48.7250, lon: 2.2712 },
  { name: "Intermarché Palaiseau", address: "5 Rue Henri Barbusse, 91120 Palaiseau", lat: 48.7125, lon: 2.2060 },
  { name: "Auchan Ris-Orangis", address: "Centre Commercial Carré Sénart, 91130 Ris-Orangis", lat: 48.6431, lon: 2.4820 },
  { name: "Franprix Evry", address: "10 Rue des Coquelicots, 91000 Evry", lat: 48.6320, lon: 2.4350 }
]

const flavors = [
  { name: "Poulet rôti" },
  { name: "Moutarde à l'ancienne" },
  { name: "Nature" },
  { name: "Paprika fumé" },
  { name: "Ciboulette" }
]

const statuses = ["in_stock", "out_of_stock", "unavailable"]

async function main() {
  // Supprimer les données existantes
  await prisma.storeFlavor.deleteMany()
  await prisma.store.deleteMany()
  await prisma.flavor.deleteMany()

  // Créer les saveurs
  const flavorRecords = []
  for (const f of flavors) {
    const flavor = await prisma.flavor.create({ data: f })
    flavorRecords.push(flavor)
  }

  // Créer les stores et lier les saveurs avec status aléatoire
  for (const s of stores) {
    const store = await prisma.store.create({ data: s })

    for (const flavor of flavorRecords) {
      //const status = statuses[Math.floor(Math.random() * statuses.length)]
      await prisma.storeFlavor.create({
        data: {
          storeId: store.id,
          flavorId: flavor.id,
          available: true
        }
      })
    }
  }

  console.log("Seed terminé !")
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e)
    prisma.$disconnect()
  })

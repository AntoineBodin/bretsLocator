import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

// ✅ GET toutes les boutiques avec leurs parfums
app.get("/stores", async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      include: {
        storeFlavors: {
          include: {
            flavor: true, // on va chercher les infos du parfum lié
          },
        },
      },
    });
    res.json(stores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des stores" });
  }
});

// ✅ GET tous les parfums avec les magasins qui les proposent
app.get("/flavors", async (req, res) => {
  try {
    const flavors = await prisma.flavor.findMany({
      include: {
        storeFlavors: {
          include: {
            store: true, // inverse : on ramène les infos du store
          },
        },
      },
    });
    res.json(flavors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des flavors" });
  }
});

// ✅ POST : ajouter un parfum à un magasin
app.post("/store/:storeId/add-flavor/:flavorId", async (req, res) => {
  const { storeId, flavorId } = req.params;

  try {
    const storeFlavor = await prisma.storeFlavor.create({
      data: {
        storeId: parseInt(storeId),
        flavorId: parseInt(flavorId),
      },
    });
    res.json(storeFlavor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de l'ajout du parfum au magasin" });
  }
});

// ✅ POST : créer un nouveau store
app.post("/stores", async (req, res) => {
  const { name, city } = req.body;

  try {
    const store = await prisma.store.create({
      data: { name, city },
    });
    res.json(store);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la création du store" });
  }
});

// ✅ POST : créer un nouveau flavor
app.post("/flavors", async (req, res) => {
  const { name } = req.body;

  try {
    const flavor = await prisma.flavor.create({
      data: { name },
    });
    res.json(flavor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la création du flavor" });
  }
});

// 🚀 Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});


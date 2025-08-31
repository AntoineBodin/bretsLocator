import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

// =====================
// Routes classiques
// =====================

// GET toutes les boutiques avec leurs parfums
app.get("/stores", async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      include: {
        storeFlavors: {
          include: { flavor: true }
        }
      }
    });
    res.json(stores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET tous les parfums
app.get("/flavors", async (req, res) => {
  try {
    const flavors = await prisma.flavor.findMany({
      include: {
        storeFlavors: {
          include: { store: true }
        }
      }
    });
    res.json(flavors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET flavors (léger : name + image)
app.get("/flavors-simple", async (req, res) => {
  try {
    const flavors = await prisma.flavor.findMany({
      select: { name: true, image: true }
    });
    res.json(flavors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// =====================
// Routes avec PostGIS
// =====================

// GET stores dans la bounding box (optimisé PostGIS)
app.get("/stores-in-bounds", async (req, res) => {
  try {
    const { swLat, swLon, neLat, neLon, cellSize, flavor } = req.query;

    if (!swLat || !swLon || !neLat || !neLon) {
      return res.status(400).json({ error: "Paramètres swLat, swLon, neLat, neLon requis" });
    }

    const swLatNum = parseFloat(swLat);
    const swLonNum = parseFloat(swLon);
    const neLatNum = parseFloat(neLat);
    const neLonNum = parseFloat(neLon);
    const grid = parseFloat(cellSize) || 0.01; // valeur par défaut

    let clusters;
    if (flavor) {
      // Filtrer par flavor si fourni
      clusters = await prisma.$queryRaw`
        SELECT 
          ST_X(ST_Centroid(ST_Collect(location::geometry))) AS lon,
          ST_Y(ST_Centroid(ST_Collect(location::geometry))) AS lat,
          COUNT(*) AS store_count,
          ARRAY_AGG(id) AS store_ids
        FROM "Store"
        WHERE location && ST_MakeEnvelope(${swLonNum}::double precision, ${swLatNum}::double precision, ${neLonNum}::double precision, ${neLatNum}::double precision, 4326)
          AND EXISTS (
            SELECT 1 FROM "StoreFlavor" sf 
            WHERE sf."storeId" = "Store".id AND sf."flavorName" = ${flavor} AND sf."available" = 1
          )
        GROUP BY ST_SnapToGrid(location::geometry, ${grid}, ${grid});
      `;
    } else {
      // Pas de filtre flavor
      clusters = await prisma.$queryRaw`
        SELECT 
          ST_X(ST_Centroid(ST_Collect(location::geometry))) AS lon,
          ST_Y(ST_Centroid(ST_Collect(location::geometry))) AS lat,
          COUNT(*) AS store_count,
          ARRAY_AGG(id) AS store_ids
        FROM "Store"
        WHERE location && ST_MakeEnvelope(${swLonNum}::double precision, ${swLatNum}::double precision, ${neLonNum}::double precision, ${neLatNum}::double precision, 4326)
        GROUP BY ST_SnapToGrid(location::geometry, ${grid}, ${grid});
      `;
    }

    const serializedClusters = clusters.map(c => ({
      lon: c.lon,
      lat: c.lat,
      store_count: Number(c.store_count),
      store_ids: c.store_ids.map(id => Number(id))
    }));

    res.json(serializedClusters);
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur PostGIS" });
  }
});

// =====================
// Création store / flavor / storeFlavor
// =====================

app.post("/stores", async (req, res) => {
  const { name, address, lat, lon } = req.body;
  try {
    const store = await prisma.store.create({
      data: { name, address, lat, lon }
    });
    res.json(store);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création store" });
  }
});

app.post("/flavors", async (req, res) => {
  const { name, image } = req.body;
  try {
    const flavor = await prisma.flavor.create({
      data: { name, image }
    });
    res.json(flavor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création flavor" });
  }
});

app.post("/store/:storeId/add-flavor/:flavorName", async (req, res) => {
  const { storeId, flavorName } = req.params;
  try {
    const storeFlavor = await prisma.storeFlavor.create({
      data: {
        storeId: parseInt(storeId),
        flavorName
      }
    });
    res.json(storeFlavor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur ajout flavor au store" });
  }
});

// =====================
// Infos magasin
// =====================

// GET infos d'un magasin par id (inclut storeFlavors + flavor)
app.get("/store/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id invalide" });

    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        storeFlavors: {
          include: { flavor: true }
        }
      }
    });

    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json(store);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// =====================
// Lancement serveur
// =====================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
